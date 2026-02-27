import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Order } from '../types';
import { MapPin, Package, DollarSign, Clock, ArrowRight, Filter, X } from 'lucide-react';
import { cn } from '../lib/utils';

interface LobbyViewProps {
  onTaskAccepted: () => void;
}

export default function LobbyView({ onTaskAccepted }: LobbyViewProps) {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  
  // Filters
  const [activeType, setActiveType] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [keywords, setKeywords] = useState({ pickup: '', delivery: '' });

  const fetchOrders = () => {
    setLoading(true);
    // Fetch only pending orders
    fetch('/api/orders?status=pending')
      .then(res => res.json())
      .then(data => {
        // Filter out my own orders (optional, but good practice)
        const filtered = data.filter((o: Order) => o.requester_id !== user?.id);
        setOrders(filtered);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchOrders();
  }, [user]);

  const handleAcceptOrder = async (orderId: string) => {
    if (!user) return;
    // if (!confirm('确定要接这个单吗？接单后请尽快联系下单人。')) return; // Removed for easier testing

    setAcceptingId(orderId);

    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: 'accepted',
          runner_id: user.id
        })
      });

      if (res.ok) {
        alert('接单成功！请前往“任务”页面查看。');
        onTaskAccepted();
      } else {
        alert('接单失败，可能已被抢单');
        fetchOrders(); // Refresh list
      }
    } catch (error) {
      console.error('Failed to accept order', error);
      alert('接单失败，请重试');
    } finally {
      setAcceptingId(null);
    }
  };

  // Filter Logic
  const filteredOrders = orders.filter(order => {
    // Type Filter
    if (activeType !== 'all') {
      if (order.type !== activeType) return false;
    } else {
      // If 'all' is selected, check if user has type preferences
      // If user has specific type preferences, only show those types by default?
      // Or maybe we should only apply preferences if a "Apply Preferences" toggle is on?
      // For now, let's keep 'all' as truly ALL, unless we want to enforce preferences.
      // Let's stick to simple behavior: 'all' means all. Preferences are just for pre-filling the advanced filters.
    }

    // Price Filter
    if (priceRange.min && order.price < parseFloat(priceRange.min)) return false;
    if (priceRange.max && order.price > parseFloat(priceRange.max)) return false;

    // Location Filter
    if (keywords.pickup && !order.pickup_location.includes(keywords.pickup)) return false;
    if (keywords.delivery && !order.delivery_location.includes(keywords.delivery)) return false;

    return true;
  });

  const resetFilters = () => {
    setPriceRange({ min: '', max: '' });
    setKeywords({ pickup: '', delivery: '' });
  };

  if (loading) return <div className="p-8 text-center text-gray-500">加载任务中...</div>;

  return (
    <div className="p-4 space-y-4">
      {/* Type Filter Bar */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {['all', 'takeout', 'express', 'send', 'errand', 'other'].map(type => (
          <button
            key={type}
            onClick={() => setActiveType(type)}
            className={cn(
              "px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
              activeType === type 
                ? "bg-blue-600 text-white shadow-sm" 
                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
            )}
          >
            {type === 'all' && '全部'}
            {type === 'takeout' && '取外卖'}
            {type === 'express' && '取快递'}
            {type === 'send' && '寄快递'}
            {type === 'errand' && '跑腿'}
            {type === 'other' && '其他'}
          </button>
        ))}
      </div>

      {/* Advanced Filter Toggle */}
      <div className="flex justify-between items-center">
        <button 
          onClick={() => setShowFilters(!showFilters)}
          className={cn(
            "text-sm flex items-center gap-1 px-3 py-1.5 rounded-lg transition-colors",
            showFilters ? "bg-blue-50 text-blue-600" : "text-gray-500 hover:bg-gray-100"
          )}
        >
          <Filter size={14} />
          {showFilters ? '收起筛选' : '高级筛选'}
        </button>
        {(priceRange.min || priceRange.max || keywords.pickup || keywords.delivery) && (
          <button onClick={resetFilters} className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1">
            <X size={12} /> 清除条件
          </button>
        )}
      </div>

      {/* Advanced Filter Panel */}
      {showFilters && (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 space-y-4 animate-in slide-in-from-top-2 duration-200">
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1.5 block">赏金范围 (元)</label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <span className="absolute left-2.5 top-2 text-gray-400 text-xs">¥</span>
                <input 
                  type="number" 
                  placeholder="最低" 
                  value={priceRange.min}
                  onChange={e => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
                  className="w-full pl-6 pr-2 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-100 outline-none"
                />
              </div>
              <span className="text-gray-300">-</span>
              <div className="relative flex-1">
                <span className="absolute left-2.5 top-2 text-gray-400 text-xs">¥</span>
                <input 
                  type="number" 
                  placeholder="最高" 
                  value={priceRange.max}
                  onChange={e => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
                  className="w-full pl-6 pr-2 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-100 outline-none"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 mb-1.5 block">地点关键词</label>
            <div className="grid grid-cols-2 gap-2">
              <input 
                type="text" 
                placeholder="取货点包含..." 
                value={keywords.pickup}
                onChange={e => setKeywords(prev => ({ ...prev, pickup: e.target.value }))}
                className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-100 outline-none"
              />
              <input 
                type="text" 
                placeholder="送达点包含..." 
                value={keywords.delivery}
                onChange={e => setKeywords(prev => ({ ...prev, delivery: e.target.value }))}
                className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-100 outline-none"
              />
            </div>
          </div>
        </div>
      )}

      {filteredOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-gray-400">
          <Package size={48} className="mb-2 opacity-20" />
          <p>暂时没有符合条件的任务</p>
          <p className="text-xs mt-1">尝试调整筛选条件</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map(order => (
        <div key={order.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 relative overflow-hidden">
          {/* Type Badge */}
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
                {new Date(order.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              </span>
            </div>
            <div className="text-lg font-bold text-red-500 flex items-center">
              <span className="text-xs font-normal mr-0.5">¥</span>
              {order.price.toFixed(2)}
            </div>
          </div>

          {/* Details */}
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

            {order.time_requirement && (
              <div className="flex items-center gap-2 text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded w-fit">
                <Clock size={12} />
                <span>要求：{order.time_requirement}</span>
              </div>
            )}
          </div>

          {/* Action */}
          <button 
            onClick={() => handleAcceptOrder(order.id)}
            disabled={acceptingId === order.id}
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 active:scale-[0.98] transition-all shadow-md shadow-blue-200 flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {acceptingId === order.id ? '抢单中...' : (
              <>
                <span>立即接单</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </div>
          ))}
        </div>
      )}
    </div>
  );
}
