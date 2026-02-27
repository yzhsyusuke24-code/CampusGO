import React, { useState } from 'react';
import { Star, X } from 'lucide-react';
import { cn } from '../lib/utils';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (rating: number, comment: string) => void;
  targetName: string;
  roleLabel: string; // "下单人" or "接单人"
}

export default function ReviewModal({ isOpen, onClose, onSubmit, targetName, roleLabel }: ReviewModalProps) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    await onSubmit(rating, comment);
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-xl animate-in fade-in zoom-in duration-200">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h3 className="font-bold text-gray-800">评价{roleLabel}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 flex flex-col items-center space-y-6">
          <div className="text-center">
            <p className="text-sm text-gray-500 mb-1">您对 {targetName} 的表现满意吗？</p>
            <div className="flex gap-2 justify-center mt-3">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className="transition-transform hover:scale-110 focus:outline-none"
                >
                  <Star 
                    size={32} 
                    className={cn(
                      "transition-colors",
                      star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-200"
                    )} 
                  />
                </button>
              ))}
            </div>
            <p className="text-sm font-medium text-yellow-500 mt-2">
              {rating === 5 && "非常满意"}
              {rating === 4 && "满意"}
              {rating === 3 && "一般"}
              {rating === 2 && "不满意"}
              {rating === 1 && "非常差"}
            </p>
          </div>

          <textarea
            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
            rows={3}
            placeholder="写点什么评价一下吧..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />

          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 active:scale-[0.98] transition-all shadow-md shadow-blue-200 disabled:opacity-70"
          >
            {isSubmitting ? '提交评价' : '提交评价'}
          </button>
        </div>
      </div>
    </div>
  );
}
