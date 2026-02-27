import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Order } from '../types';
import { MapPin, Package, MessageCircle, Phone, CheckCircle, AlertCircle, Star } from 'lucide-react';
import { cn } from '../lib/utils';
import ReviewModal from './ReviewModal';

export default function RunnerTasksView() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [reviewedOrderIds, setReviewedOrderIds] = useState<Set<string>>(new Set());

  const fetchOrders = () => {
    if (!user) return;
    setLoading(true);
    fetch(`/api/orders?role=runner&user_id=${user.id}`)
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

  const handleCompleteTask = async (orderId: string) => {
    // if (!confirm('确认已送达并完成任务？')) return; // Removed for easier testing

    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed_by_runner' })
      });
      if (res.ok) {
        alert('已确认送达，等待下单人确认。');
        fetchOrders();
      }
    } catch (error) {
      console.error('Failed to complete task', error);
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
          target_id: selectedOrder.requester_id, // Reviewing the requester
          role: 'requester', // The target's role
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

  const handleCancelAcceptance = async (orderId: string) => {
    // if (!confirm('确定要放弃这个任务吗？')) return;

    try {
      const res = await fetch(`/api/orders/${orderId}/cancel-acceptance`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ runner_id: user?.id })
      });
      if (res.ok) {
        alert('已取消接单，任务已返回大厅');
        fetchOrders();
      } else {
        alert('操作失败');
      }
    } catch (error) {
      console.error('Failed to cancel acceptance', error);
      alert('操作失败');
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">加载中...</div>;

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-400">
        <Package size={48} className="mb-2 opacity-20" />
        <p>还没有接单哦</p>
        <p className="text-xs mt-1">快去任务大厅看看吧</p>
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
              <StatusBadge status={order.status} />
            </div>
            <div className="text-lg font-bold text-gray-800">
              <span className="text-xs font-normal mr-0.5">¥</span>
              {order.price.toFixed(2)}
            </div>
          </div>

          <div className="space-y-3 mb-4">
            <div className="flex items-start gap-2 text-sm text-gray-800 font-medium">
              <Package size={16} className="mt-0.5 text-gray-400 shrink-0" />
              <span>{order.description}</span>
            </div>
            
            <div className="bg-gray-50 p-3 rounded-lg space-y-2">
              <div className="flex items-start gap-2 text-sm text-gray-600">
                <div className="w-4 h-4 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-[10px] mt-0.5 shrink-0">取</div>
                <span>{order.pickup_location}</span>
              </div>
              <div className="flex items-start gap-2 text-sm text-gray-600">
                <div className="w-4 h-4 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-[10px] mt-0.5 shrink-0">送</div>
                <span>{order.delivery_location}</span>
              </div>
            </div>

            {/* Contact Info - Only visible to runner */}
            <div className="bg-blue-50 p-3 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="bg-blue-100 p-1.5 rounded-full">
                  <MessageCircle size={16} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-blue-600 font-medium">下单人微信</p>
                  <p className="text-sm font-bold text-gray-800 select-all">{order.requester_wechat}</p>
                </div>
              </div>
              <button 
                onClick={() => navigator.clipboard.writeText(order.requester_wechat)}
                className="text-xs text-blue-600 border border-blue-200 px-2 py-1 rounded bg-white hover:bg-blue-50"
              >
                复制
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-gray-50">
            {order.status === 'accepted' ? (
              <div className="flex gap-2">
                <button 
                  onClick={() => handleCancelAcceptance(order.id)}
                  className="flex-1 bg-gray-100 text-gray-600 py-2.5 rounded-lg font-medium hover:bg-gray-200 active:scale-[0.98] transition-all"
                >
                  放弃任务
                </button>
                <button 
                  onClick={() => handleCompleteTask(order.id)}
                  className="flex-[2] bg-green-600 text-white py-2.5 rounded-lg font-medium hover:bg-green-700 active:scale-[0.98] transition-all shadow-sm shadow-green-200"
                >
                  确认已送达
                </button>
              </div>
            ) : order.status === 'completed_by_runner' ? (
              <div className="text-center text-sm text-orange-600 bg-orange-50 py-2 rounded-lg">
                等待下单人确认中...
              </div>
            ) : order.status === 'confirmed' ? (
              !reviewedOrderIds.has(order.id) ? (
                <button 
                  onClick={() => openReviewModal(order)}
                  className="w-full text-yellow-600 bg-yellow-50 border border-yellow-200 py-2 rounded-lg text-sm font-medium hover:bg-yellow-100 flex items-center justify-center gap-1"
                >
                  <Star size={14} />
                  评价下单人
                </button>
              ) : (
                <div className="text-center text-sm text-gray-400 py-2 flex items-center justify-center gap-1">
                  <Star size={12} fill="currentColor" />
                  已评价
                </div>
              )
            ) : (
              <div className="text-center text-sm text-gray-400 py-2">
                任务已结束
              </div>
            )}
          </div>
        </div>
      ))}

      <ReviewModal 
        isOpen={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        onSubmit={submitReview}
        targetName="下单人"
        roleLabel="下单人"
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
    accepted: "进行中",
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
