import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Package, MapPin, Clock, FileText, DollarSign, MessageCircle } from 'lucide-react';

interface CreateOrderViewProps {
  onOrderCreated: () => void;
}

export default function CreateOrderView({ onOrderCreated }: CreateOrderViewProps) {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    type: 'takeout',
    description: '',
    pickup_location: '',
    delivery_location: '',
    price: '',
    requester_wechat: '',
    time_requirement: '',
    extra_needs: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert('请先登录');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          requester_id: user.id,
          price: parseFloat(formData.price)
        }),
      });

      if (response.ok) {
        onOrderCreated();
      } else {
        alert('发布失败，请重试');
      }
    } catch (error) {
      console.error('Error creating order:', error);
      alert('发布失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div className="bg-white p-5 rounded-2xl shadow-sm">
        <h2 className="text-lg font-bold text-gray-800 mb-4">发布跑腿任务</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Task Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">任务类型</label>
            <div className="grid grid-cols-5 gap-2">
              {['takeout', 'express', 'send', 'errand', 'other'].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, type }))}
                  className={`py-2 text-xs rounded-lg border transition-colors ${
                    formData.type === type 
                      ? 'bg-blue-50 border-blue-500 text-blue-700 font-medium' 
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {type === 'takeout' && '取外卖'}
                  {type === 'express' && '取快递'}
                  {type === 'send' && '寄快递'}
                  {type === 'errand' && '跑腿'}
                  {type === 'other' && '其他'}
                </button>
              ))}
            </div>
          </div>

          {/* Description (Size/Weight) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <div className="flex items-center gap-1">
                <Package size={16} />
                <span>物品描述 (大小/重量) *</span>
              </div>
            </label>
            <input
              type="text"
              name="description"
              required
              placeholder="例：中号快递，约2kg"
              value={formData.description}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            />
          </div>

          {/* Locations */}
          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <div className="flex items-center gap-1">
                  <MapPin size={16} className="text-green-600" />
                  <span>取件地点 *</span>
                </div>
              </label>
              <input
                type="text"
                name="pickup_location"
                required
                placeholder="例：东门菜鸟驿站"
                value={formData.pickup_location}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <div className="flex items-center gap-1">
                  <MapPin size={16} className="text-orange-600" />
                  <span>送达地点 *</span>
                </div>
              </label>
              <input
                type="text"
                name="delivery_location"
                required
                placeholder="例：男生宿舍3栋201"
                value={formData.delivery_location}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          {/* Price & WeChat */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <div className="flex items-center gap-1">
                  <DollarSign size={16} />
                  <span>赏金 (元) *</span>
                </div>
              </label>
              <input
                type="number"
                name="price"
                required
                min="0.1"
                step="0.1"
                placeholder="0.00"
                value={formData.price}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <div className="flex items-center gap-1">
                  <MessageCircle size={16} />
                  <span>微信号 *</span>
                </div>
              </label>
              <input
                type="text"
                name="requester_wechat"
                required
                placeholder="用于联系"
                value={formData.requester_wechat}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          {/* Optional Fields */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <div className="flex items-center gap-1">
                <Clock size={16} />
                <span>时间要求 (选填)</span>
              </div>
            </label>
            <input
              type="text"
              name="time_requirement"
              placeholder="例：今天下午5点前"
              value={formData.time_requirement}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <div className="flex items-center gap-1">
                <FileText size={16} />
                <span>备注需求 (选填)</span>
              </div>
            </label>
            <textarea
              name="extra_needs"
              rows={2}
              placeholder="其他特殊要求..."
              value={formData.extra_needs}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-4 shadow-md shadow-blue-200"
          >
            {isSubmitting ? '发布中...' : '立即发布'}
          </button>
        </form>
      </div>
    </div>
  );
}
