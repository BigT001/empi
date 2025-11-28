"use client";

import { Users, ShoppingCart, Palette, Package, Clock, BarChart3 } from "lucide-react";

interface Tab {
  id: 'overview' | 'users' | 'orders' | 'custom-orders' | 'products' | 'pending';
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number | null;
}

const TABS: Tab[] = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'orders', label: 'Orders', icon: ShoppingCart },
  { id: 'custom-orders', label: 'Custom', icon: Palette },
  { id: 'products', label: 'Products', icon: Package },
  { id: 'pending', label: 'Pending', icon: Clock },
];

interface MobileBottomNavProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
  pendingCount?: number;
}

export function MobileBottomNav({ activeTab, onTabChange, pendingCount }: MobileBottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-40">
      <div className="flex justify-around">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex-1 flex flex-col items-center justify-center py-3 px-2 transition-all relative ${
                isActive
                  ? 'text-lime-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="relative">
                <Icon
                  className={`h-6 w-6 transition-all ${
                    isActive ? 'scale-110' : ''
                  }`}
                />
                {/* Badge for pending orders */}
                {tab.id === 'pending' && pendingCount && pendingCount > 0 && (
                  <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
                    {pendingCount > 99 ? '99+' : pendingCount}
                  </div>
                )}
              </div>
              <span
                className={`text-xs mt-1 font-semibold transition-all ${
                  isActive ? 'opacity-100' : 'opacity-75'
                }`}
              >
                {tab.label}
              </span>
              {/* Underline indicator */}
              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-lime-500 to-lime-600 rounded-t-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
