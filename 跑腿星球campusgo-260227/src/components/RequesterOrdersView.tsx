import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Order } from '../types';
import { Clock, CheckCircle, MapPin, Package, AlertCircle, Star } from 'lucide-react';
import { cn } from '../lib/utils';
import ReviewModal from './ReviewModal';

export default function RequesterOrdersView() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [reviewedOrderIds, setReviewedOrderIds] = useState<Set<string>>(new Set());

  const fetchOrders = () => {
    if (!user) return;
    setLoading(true);
    fetch(`/api/orders?role=requester&user_id=${user.id}`)
      .then(res => res.json())
      .then(async (data) => {
        setOrders(data);
        setLoading(false);
        // Check review status for confirmed orders
        const confirmedOrders = data.filter((o: Order) => o.status === 'confirmed');
        const reviewedSet = new Set<string>();
        for (const order of confirmedOrders) {
          const res = await fetch(`/api/orders/${order.id}/review-status?user_id=${user.id}`);
          const { hasReviewed } = await res.json();
          if (hasReviewed) reviewedSet.add(order.id);
        }
        setReviewedOrderIds(reviewedSet);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchOrders();
  }, [user]);

  const handleConfirmCompletion = async (orderId: string) => {
    // if (!confirm('确认该订单已完成吗？确认后将无法更改。')) return; // Removed for easier testing

    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'confirmed' })
      });
      if (res.ok) {
        alert('订单已完成！快去评价一下接单人吧。');
        fetchOrders();
      }
    } catch (error) {
      console.error('Failed to confirm order', error);
      alert('操作失败');
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    // if (!confirm('确定要取消这个订单吗？')) return; // Removed for easier testing

    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' })
      });
      if (res.ok) {
        alert('订单已取消');
        fetchOrders();
      }
    } catch (error) {
      console.error('Failed to cancel order', error);
      alert('操作失败');
    }
  };

  const openReviewModal = (order: Order) => {
    setSelectedOrder(order);
    setReviewModalOpen(true);
  };

  const submitReview = async (rating: number, comment: string) => {
    if (!selectedOrder || !user) return;

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: selectedOrder.id,
          reviewer_id: user.id,
          target_id: selectedOrder.runner_id, // Reviewing the runner
          role: 'runner', // The target's role
          rating,
          comment
        })
      });

      if (res.ok) {
        setReviewedOrderIds(prev => new Set(prev).add(selectedOrder.id));
      } else {
        alert('评价提交失败');
      }
    } catch (error) {
      console.error('Failed to submit review', error);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">加载中...</div>;

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-400">
        <Package size={48} className="mb-2 opacity-20" />
        <p>暂无发布的订单</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {orders.map(order => (
        <div key={order.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-start mb-3">
            <div className="flex items-center gap-2">
              <span className={cn(
                "px-2 py-0.5 rounded text-xs font-medium border",
                order.type === 'takeout' && "bg-orange-50 text-orange-600 border-orange-200",
                order.type === 'express' && "bg-blue-50 text-blue-600 border-blue-200",
                order.type === 'send' && "bg-green-50 text-green-600 border-green-200",
                order.type === 'errand' && "bg-purple-50 text-purple-600 border-purple-200",
                order.type === 'other' && "bg-gray-50 text-gray-600 border-gray-200",
              )}>
                {order.type === 'takeout' && '取外卖'}
                {order.type === 'express' && '取快递'}
                {order.type === 'send' && '寄快递'}
                {order.type === 'errand' && '跑腿'}
                {order.type === 'other' && '其他'}
              </span>
              <span className="text-xs text-gray-400">
                {new Date(order.created_at).toLocaleDateString()}
              </span>
            </div>
            <StatusBadge status={order.status} />
          </div>

          <div className="space-y-2 mb-4">
            <div className="flex items-start gap-2 text-sm text-gray-700">
              <Package size={16} className="mt-0.5 text-gray-400 shrink-0" />
              <span className="font-medium">{order.description}</span>
            </div>
            <div className="flex items-start gap-2 text-sm text-gray-600">
              <MapPin size={16} className="mt-0.5 text-gray-400 shrink-0" />
              <span>{order.pickup_location} <span className="text-gray-300 mx-1">→</span> {order.delivery_location}</span>
            </div>
            <div className="flex items-center gap-2 text-sm font-semibold text-red-500">
              <span className="text-xs text-gray-500 font-normal">赏金</span>
              ¥{order.price.toFixed(2)}
            </div>
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-gray-50 flex justify-end">
            {order.status === 'completed_by_runner' && (
              <button 
                onClick={() => handleConfirmCompletion(order.id)}
                className="bg-green-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-green-700 active:scale-95 transition-all shadow-sm shadow-green-200"
              >
                确认完成
              </button>
            )}
            {order.status === 'confirmed' && (
              !reviewedOrderIds.has(order.id) ? (
                <button 
                  onClick={() => openReviewModal(order)}
                  className="text-yellow-600 bg-yellow-50 border border-yellow-200 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-yellow-100 flex items-center gap-1"
                >
                  <Star size={14} />
                  评价接单人
                </button>
              ) : (
                <div className="text-xs text-gray-400 flex items-center gap-1">
                  <Star size={12} fill="currentColor" />
                  已评价
                </div>
              )
            )}
            {order.status === 'pending' && (
              <button 
                onClick={() => handleCancelOrder(order.id)}
                className="text-gray-400 text-sm px-3 py-1 hover:text-red-500 transition-colors"
              >
                取消订单
              </button>
            )}
            {order.status === 'accepted' && (
              <div className="text-xs text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg flex items-center gap-1">
                <Clock size={12} />
                接单人正在配送中
              </div>
            )}
          </div>
        </div>
      ))}

      <ReviewModal 
        isOpen={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        onSubmit={submitReview}
        targetName="接单人"
        roleLabel="接单人"
      />
    </div>
  );
}

function StatusBadge({ status }: { status: Order['status'] }) {
  const styles = {
    pending: "text-gray-500 bg-gray-100",
    accepted: "text-blue-600 bg-blue-50",
    completed_by_runner: "text-orange-600 bg-orange-50",
    confirmed: "text-green-600 bg-green-50",
    cancelled: "text-red-500 bg-red-50",
  };

  const labels = {
    pending: "待接单",
    accepted: "已接单",
    completed_by_runner: "待确认",
    confirmed: "已完成",
    cancelled: "已取消",
  };

  return (
    <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", styles[status])}>
      {labels[status]}
    </span>
  );
}
