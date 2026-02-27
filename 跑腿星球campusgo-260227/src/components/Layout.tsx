import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../lib/utils';
import { LayoutDashboard, PlusCircle, User, List, Package } from 'lucide-react';
import NotificationsButton from './NotificationsButton';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function Layout({ children, activeTab, onTabChange }: LayoutProps) {
  const { role, setRole } = useAuth();

  const isRequester = role === 'requester';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-md mx-auto shadow-xl border-x border-gray-200">
      {/* Top Navigation Bar */}
      <header className="bg-white px-4 py-3 shadow-sm flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <h1 className="font-bold text-lg text-gray-800">跑腿星球</h1>
          <NotificationsButton />
        </div>
        
        {/* Segmented Control for Role Switching */}
        <div className="bg-gray-100 p-1 rounded-lg flex text-xs font-medium">
          <button
            onClick={() => setRole('requester')}
            className={cn(
              "px-3 py-1.5 rounded-md transition-all duration-200",
              isRequester 
                ? "bg-white text-green-600 shadow-sm" 
                : "text-gray-500 hover:text-gray-700"
            )}
          >
            我要下单
          </button>
          <button
            onClick={() => setRole('runner')}
            className={cn(
              "px-3 py-1.5 rounded-md transition-all duration-200",
              !isRequester 
                ? "bg-white text-blue-600 shadow-sm" 
                : "text-gray-500 hover:text-gray-700"
            )}
          >
            我要接单
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto pb-20">
        {children}
      </main>

      {/* Bottom Tab Bar */}
      <nav className="bg-white border-t border-gray-200 fixed bottom-0 w-full max-w-md flex justify-around py-2 pb-safe z-10">
        {isRequester ? (
          <>
            <TabItem 
              icon={<PlusCircle size={24} />} 
              label="发单" 
              isActive={activeTab === 'create'} 
              onClick={() => onTabChange('create')} 
              activeColor="text-green-600"
            />
            <TabItem 
              icon={<List size={24} />} 
              label="订单" 
              isActive={activeTab === 'orders'} 
              onClick={() => onTabChange('orders')} 
              activeColor="text-green-600"
            />
            <TabItem 
              icon={<User size={24} />} 
              label="我的" 
              isActive={activeTab === 'profile'} 
              onClick={() => onTabChange('profile')} 
              activeColor="text-green-600"
            />
          </>
        ) : (
          <>
            <TabItem 
              icon={<LayoutDashboard size={24} />} 
              label="大厅" 
              isActive={activeTab === 'lobby'} 
              onClick={() => onTabChange('lobby')} 
              activeColor="text-blue-600"
            />
            <TabItem 
              icon={<Package size={24} />} 
              label="任务" 
              isActive={activeTab === 'tasks'} 
              onClick={() => onTabChange('tasks')} 
              activeColor="text-blue-600"
            />
            <TabItem 
              icon={<User size={24} />} 
              label="我的" 
              isActive={activeTab === 'profile'} 
              onClick={() => onTabChange('profile')} 
              activeColor="text-blue-600"
            />
          </>
        )}
      </nav>
    </div>
  );
}

function TabItem({ icon, label, isActive, onClick, activeColor = "text-blue-600" }: { icon: React.ReactNode, label: string, isActive: boolean, onClick: () => void, activeColor?: string }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center w-full py-1 transition-colors",
        isActive ? activeColor : "text-gray-400 hover:text-gray-600"
      )}
    >
      {icon}
      <span className="text-[10px] mt-1 font-medium">{label}</span>
    </button>
  );
}
