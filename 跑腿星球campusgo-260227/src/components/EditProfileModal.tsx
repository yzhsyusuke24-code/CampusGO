import React, { useState, useEffect } from 'react';
import { X, RefreshCw, Check } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../lib/utils';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AVATAR_SEEDS = ['Felix', 'Aneka', 'Zoe', 'Jack', 'Bella', 'Charlie', 'Willow', 'Oliver', 'Leo', 'Mia'];

export default function EditProfileModal({ isOpen, onClose }: EditProfileModalProps) {
  const { user, refreshUser } = useAuth();
  const [nickname, setNickname] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      setNickname(user.nickname);
      setSelectedAvatar(user.avatar_url);
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!user) return;
    if (!nickname.trim()) {
      alert('昵称不能为空');
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: user.id,
          nickname: nickname.trim(),
          avatar_url: selectedAvatar
        })
      });

      if (res.ok) {
        await refreshUser();
        onClose();
      } else {
        alert('保存失败');
      }
    } catch (error) {
      console.error('Failed to update profile', error);
      alert('保存失败');
    } finally {
      setIsSaving(false);
    }
  };

  const getAvatarUrl = (seed: string) => `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-xl animate-in fade-in zoom-in duration-200">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h3 className="font-bold text-gray-800">编辑个人资料</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Avatar Selection */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-3 block">选择头像</label>
            <div className="flex justify-center mb-4">
              <img 
                src={selectedAvatar} 
                alt="Selected Avatar" 
                className="w-20 h-20 rounded-full border-4 border-blue-100"
              />
            </div>
            <div className="grid grid-cols-5 gap-2">
              {AVATAR_SEEDS.map(seed => {
                const url = getAvatarUrl(seed);
                const isSelected = selectedAvatar === url;
                return (
                  <button
                    key={seed}
                    onClick={() => setSelectedAvatar(url)}
                    className={cn(
                      "relative rounded-full overflow-hidden border-2 transition-all aspect-square",
                      isSelected ? "border-blue-500 ring-2 ring-blue-200" : "border-transparent hover:border-gray-200"
                    )}
                  >
                    <img src={url} alt={seed} className="w-full h-full" />
                    {isSelected && (
                      <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                        <Check size={12} className="text-white drop-shadow-md" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Nickname Input */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">昵称</label>
            <input 
              type="text" 
              value={nickname}
              onChange={e => setNickname(e.target.value)}
              placeholder="请输入昵称"
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-100 outline-none transition-all"
              maxLength={12}
            />
            <p className="text-xs text-gray-400 mt-1 text-right">{nickname.length}/12</p>
          </div>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 active:scale-[0.98] transition-all shadow-md shadow-blue-200 disabled:opacity-70"
          >
            {isSaving ? '保存中...' : '保存修改'}
          </button>
        </div>
      </div>
    </div>
  );
}
