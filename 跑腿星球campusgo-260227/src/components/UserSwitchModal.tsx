import React, { useEffect, useState } from 'react';
import { X, Plus, User as UserIcon, Check } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../lib/utils';

interface UserSwitchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SimpleUser {
  id: string;
  nickname: string;
  avatar_url: string;
}

export default function UserSwitchModal({ isOpen, onClose }: UserSwitchModalProps) {
  const { user: currentUser, switchUser, switchUserById } = useAuth();
  const [users, setUsers] = useState<SimpleUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen]);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      setUsers(data);
    } catch (error) {
      console.error('Failed to fetch users', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateNew = async () => {
    setIsCreating(true);
    try {
      await switchUser(); // This creates a new user and switches to it
      onClose();
    } catch (error) {
      alert('创建失败');
    } finally {
      setIsCreating(false);
    }
  };

  const handleSwitchTo = async (id: string) => {
    if (id === currentUser?.id) return;
    await switchUserById(id);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-xl animate-in fade-in zoom-in duration-200">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h3 className="font-bold text-gray-800">切换测试账号</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-4 max-h-[60vh] overflow-y-auto">
          {isLoading ? (
            <div className="text-center py-8 text-gray-400">加载中...</div>
          ) : (
            <div className="space-y-2">
              {users.map((u) => (
                <button
                  key={u.id}
                  onClick={() => handleSwitchTo(u.id)}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-xl transition-all border",
                    currentUser?.id === u.id 
                      ? "bg-blue-50 border-blue-200 ring-1 ring-blue-200" 
                      : "bg-white border-gray-100 hover:bg-gray-50 hover:border-gray-200"
                  )}
                >
                  <img src={u.avatar_url} alt={u.nickname} className="w-10 h-10 rounded-full bg-gray-200" />
                  <div className="flex-1 text-left">
                    <div className="font-medium text-gray-800 flex items-center gap-2">
                      {u.nickname}
                      {currentUser?.id === u.id && (
                        <span className="text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded">当前</span>
                      )}
                    </div>
                    <div className="text-xs text-gray-400">ID: {u.id.slice(0, 6)}...</div>
                  </div>
                  {currentUser?.id === u.id && <Check size={16} className="text-blue-600" />}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-100 bg-gray-50">
          <button
            onClick={handleCreateNew}
            disabled={isCreating}
            className="w-full bg-white border border-gray-300 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-50 active:scale-[0.98] transition-all shadow-sm flex items-center justify-center gap-2"
          >
            {isCreating ? (
              '创建中...'
            ) : (
              <>
                <Plus size={18} />
                新建测试账号
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
