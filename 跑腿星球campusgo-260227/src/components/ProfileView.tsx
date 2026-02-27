import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Star, Users, Edit2 } from 'lucide-react';
import PreferencesModal from './PreferencesModal';
import UserSwitchModal from './UserSwitchModal';
import EditProfileModal from './EditProfileModal';

export default function ProfileView() {
  const { user } = useAuth();
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);
  const [isSwitchUserOpen, setIsSwitchUserOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);

  if (!user) return <div>Loading...</div>;

  return (
    <div className="p-4 space-y-6">
      <div className="bg-white rounded-2xl p-6 shadow-sm flex flex-col items-center relative">
        <button 
          onClick={() => setIsSwitchUserOpen(true)}
          className="absolute top-4 right-4 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-lg flex items-center gap-1 hover:bg-blue-100 transition-colors z-10 cursor-pointer"
        >
          <Users size={12} />
          切换账号
        </button>

        <div className="relative mb-3 group">
          <img 
            src={user.avatar_url} 
            alt={user.nickname} 
            className="w-20 h-20 rounded-full border-4 border-gray-100"
          />
          <button 
            onClick={() => setIsEditProfileOpen(true)}
            className="absolute bottom-0 right-0 bg-white border border-gray-200 p-1.5 rounded-full shadow-sm text-gray-600 hover:text-blue-600 hover:border-blue-200 transition-all"
          >
            <Edit2 size={12} />
          </button>
        </div>
        
        <div className="flex items-center gap-2 mb-1">
          <h2 className="text-xl font-bold text-gray-800">{user.nickname}</h2>
          <button 
            onClick={() => setIsEditProfileOpen(true)}
            className="text-gray-400 hover:text-blue-600"
          >
            <Edit2 size={14} />
          </button>
        </div>
        <p className="text-sm text-gray-500">ID: {user.id.slice(0, 8)}</p>
        
        {/* Display current preferences summary */}
        {user.preferences && (
          <div className="flex flex-wrap gap-1 justify-center mt-3 max-w-[240px]">
            {/* Handle legacy array or new object */}
            {Array.isArray(user.preferences) ? (
              user.preferences.map((tag: string) => (
                <span key={tag} className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                  {tag}
                </span>
              ))
            ) : (
              <>
                {user.preferences.types && user.preferences.types.length > 0 && (
                  <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                    {user.preferences.types.map(t => 
                      t === 'takeout' ? '取外卖' : 
                      t === 'express' ? '取快递' : 
                      t === 'send' ? '寄快递' : 
                      t === 'errand' ? '跑腿' : 
                      t === 'other' ? '其他' : t
                    ).join('/')}
                  </span>
                )}
                {(user.preferences.priceMin || user.preferences.priceMax) && (
                  <span className="text-[10px] bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full">
                    ¥{user.preferences.priceMin || 0}-{user.preferences.priceMax || '∞'}
                  </span>
                )}
                {user.preferences.tags && user.preferences.tags.map((tag: string) => (
                  <span key={tag} className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                    {tag}
                  </span>
                ))}
              </>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm text-center">
          <p className="text-sm text-gray-500 mb-2 font-medium">作为下单人</p>
          <div className="flex items-center justify-center gap-1 text-yellow-500 mb-2">
            <span className="text-3xl font-bold text-gray-800">{user.rating_as_requester.toFixed(1)}</span>
            <Star size={20} fill="currentColor" />
          </div>
          <div className="flex justify-center gap-4 text-xs text-gray-400 border-t border-gray-50 pt-2">
            <div>
              <span className="block font-semibold text-gray-600">{user.requester_order_count || 0}</span>
              下单
            </div>
            <div>
              <span className="block font-semibold text-gray-600">{user.requester_review_count || 0}</span>
              评价
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm text-center">
          <p className="text-sm text-gray-500 mb-2 font-medium">作为接单人</p>
          <div className="flex items-center justify-center gap-1 text-yellow-500 mb-2">
            <span className="text-3xl font-bold text-gray-800">{user.rating_as_runner.toFixed(1)}</span>
            <Star size={20} fill="currentColor" />
          </div>
          <div className="flex justify-center gap-4 text-xs text-gray-400 border-t border-gray-50 pt-2">
            <div>
              <span className="block font-semibold text-gray-600">{user.runner_order_count || 0}</span>
              接单
            </div>
            <div>
              <span className="block font-semibold text-gray-600">{user.runner_review_count || 0}</span>
              评价
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800">常用功能</h3>
        </div>
        <div className="divide-y divide-gray-100">
          <button 
            onClick={() => setIsPreferencesOpen(true)}
            className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 flex justify-between items-center"
          >
            <span>接单偏好设置</span>
            <span className="text-xs text-gray-400">
              {user.preferences ? '已设置' : '未设置'}
            </span>
          </button>
          <button className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50">
            联系客服
          </button>
        </div>
      </div>

      <PreferencesModal 
        isOpen={isPreferencesOpen} 
        onClose={() => setIsPreferencesOpen(false)} 
      />

      <UserSwitchModal 
        isOpen={isSwitchUserOpen} 
        onClose={() => setIsSwitchUserOpen(false)} 
      />

      <EditProfileModal 
        isOpen={isEditProfileOpen} 
        onClose={() => setIsEditProfileOpen(false)} 
      />
    </div>
  );
}
