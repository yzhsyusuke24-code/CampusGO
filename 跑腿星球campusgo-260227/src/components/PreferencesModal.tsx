import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { UserPreferences } from '../types';

interface PreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ORDER_TYPES = [
  { id: 'takeout', label: '取外卖' },
  { id: 'express', label: '取快递' },
  { id: 'send', label: '寄快递' },
  { id: 'errand', label: '跑腿' },
  { id: 'other', label: '其他' },
];

const OTHER_TAGS = [
  '仅校内', '需尽快', '女生宿舍', '男生宿舍'
];

export default function PreferencesModal({ isOpen, onClose }: PreferencesModalProps) {
  const { user, refreshUser } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  
  // Form State
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [priceMin, setPriceMin] = useState<string>('');
  const [priceMax, setPriceMax] = useState<string>('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Sync with user preferences when modal opens
  useEffect(() => {
    if (isOpen && user) {
      // Handle legacy array format or new object format
      const prefs = user.preferences as any;
      
      if (Array.isArray(prefs)) {
        // Legacy: try to migrate tags
        setSelectedTags(prefs);
        setSelectedTypes([]);
        setPriceMin('');
        setPriceMax('');
      } else {
        // New format
        setSelectedTypes(prefs?.types || []);
        setPriceMin(prefs?.priceMin?.toString() || '');
        setPriceMax(prefs?.priceMax?.toString() || '');
        setSelectedTags(prefs?.tags || []);
      }
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const toggleType = (typeId: string) => {
    setSelectedTypes(prev => 
      prev.includes(typeId) 
        ? prev.filter(t => t !== typeId) 
        : [...prev, typeId]
    );
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag) 
        : [...prev, tag]
    );
  };

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    
    const newPreferences: UserPreferences = {
      types: selectedTypes,
      priceMin: priceMin ? parseFloat(priceMin) : undefined,
      priceMax: priceMax ? parseFloat(priceMax) : undefined,
      tags: selectedTags
    };

    try {
      const res = await fetch('/api/user/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: user.id,
          preferences: newPreferences
        })
      });

      if (res.ok) {
        await refreshUser();
        onClose();
      } else {
        alert('保存失败');
      }
    } catch (error) {
      console.error('Failed to save preferences', error);
      alert('保存失败');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-xl animate-in fade-in zoom-in duration-200">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h3 className="font-bold text-gray-800">接单偏好设置</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Order Types */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-3 block">接单类型 (多选)</label>
            <div className="grid grid-cols-4 gap-2">
              {ORDER_TYPES.map(type => {
                const isSelected = selectedTypes.includes(type.id);
                return (
                  <button
                    key={type.id}
                    onClick={() => toggleType(type.id)}
                    className={cn(
                      "py-2 rounded-lg text-sm font-medium transition-all border",
                      isSelected 
                        ? "bg-blue-50 text-blue-600 border-blue-200" 
                        : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                    )}
                  >
                    {type.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Price Range */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-3 block">期望赏金范围 (元)</label>
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <span className="absolute left-3 top-2.5 text-gray-400 text-sm">¥</span>
                <input 
                  type="number" 
                  placeholder="最低" 
                  value={priceMin}
                  onChange={e => setPriceMin(e.target.value)}
                  className="w-full pl-7 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-100 outline-none"
                />
              </div>
              <span className="text-gray-300">-</span>
              <div className="relative flex-1">
                <span className="absolute left-3 top-2.5 text-gray-400 text-sm">¥</span>
                <input 
                  type="number" 
                  placeholder="最高" 
                  value={priceMax}
                  onChange={e => setPriceMax(e.target.value)}
                  className="w-full pl-7 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-100 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Other Tags */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-3 block">其他偏好</label>
            <div className="flex flex-wrap gap-2">
              {OTHER_TAGS.map(tag => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-sm font-medium transition-all border",
                      isSelected 
                        ? "bg-green-50 text-green-700 border-green-200" 
                        : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                    )}
                  >
                    {tag}
                    {isSelected && <Check size={12} className="inline-block ml-1" />}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 active:scale-[0.98] transition-all shadow-md shadow-blue-200 disabled:opacity-70 mt-4"
          >
            {isSaving ? '保存设置' : '保存设置'}
          </button>
        </div>
      </div>
    </div>
  );
}
