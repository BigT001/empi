"use client";

import { useEffect, useState, Suspense } from "react";
import dynamic from "next/dynamic";
import MobileAdminDashboard from "../mobile-dashboard";
import MobileAdminLayout from "../mobile-layout";
import { useAdmin } from "@/app/context/AdminContext";
import MobileAdminDashboardSkeleton from "../mobile-dashboard";
import { Users, ShoppingCart, Package, Clock, BarChart3 } from "lucide-react";

// ⚡ LAZY LOAD panels with code splitting - dramatically reduces initial bundle size
const UsersPanel = dynamic(() => import("./UsersPanel").then(mod => ({ default: mod.UsersPanel })), {
  loading: () => <PanelSkeleton />,
  ssr: false // Don't render on server - load on client only when tab is clicked
});

const OrdersPanel = dynamic(() => import("./OrdersPanel").then(mod => ({ default: mod.OrdersPanel })), {
  loading: () => <PanelSkeleton />,
  ssr: false
});

const ProductsPanel = dynamic(() => import("./ProductsPanel").then(mod => ({ default: mod.ProductsPanel })), {
  loading: () => <PanelSkeleton />,
  ssr: false
});

const PendingPanel = dynamic(() => import("./PendingPanel").then(mod => ({ default: mod.PendingPanel })), {
  loading: () => <PanelSkeleton />,
  ssr: false
});

// ⚡ Skeleton loader for fast perceived performance
function PanelSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-40 bg-gray-200 rounded-lg"></div>
      <div className="h-40 bg-gray-200 rounded-lg"></div>
      <div className="h-40 bg-gray-200 rounded-lg"></div>
    </div>
  );
}

// ⚡ Tab configuration for easy maintenance
const TABS = [
  { id: 'overview', label: 'Overview', icon: BarChart3, color: 'text-blue-600' },
  { id: 'users', label: 'Users', icon: Users, color: 'text-purple-600' },
  { id: 'orders', label: 'Orders', icon: ShoppingCart, color: 'text-orange-600' },
  { id: 'products', label: 'Products', icon: Package, color: 'text-green-600' },
  { id: 'pending', label: 'Pending', icon: Clock, color: 'text-red-600' },
] as const;

export default function AdminDashboardPage() {
  const [isMobile, setIsMobile] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<
    'overview' | 'users' | 'orders' | 'products' | 'pending'
  >('overview');
  // ⚡ Track loaded tabs to prevent re-fetching
  const [loadedTabs, setLoadedTabs] = useState(new Set(['overview']));

  useEffect(() => {
    setIsMounted(true);
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // ⚡ Handle tab click - mark as loaded
  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId as any);
    setLoadedTabs(prev => new Set([...prev, tabId]));
  };

  if (!isMounted) {
    return null;
  }

  if (isMobile) {
    return (
      <MobileAdminLayout>
        <MobileAdminDashboard />
      </MobileAdminLayout>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-200">
        <div className="px-6 py-4">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-600 mt-1">Real-time store analytics and management</p>
        </div>
      </div>

      {/* Horizontal Tab Navigation - ⚡ OPTIMIZED FOR SPEED */}
      <div className="sticky top-16 z-30 bg-white border-b border-gray-200 overflow-x-auto">
        <nav className="flex gap-1 px-6 py-0">
          {TABS.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={`px-4 py-3 font-semibold transition-all whitespace-nowrap flex items-center gap-2 border-b-2 ${
                  activeTab === tab.id
                    ? 'border-lime-600 text-lime-600 bg-lime-50/50'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Icon className="h-5 w-5" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Content Area - ⚡ Lazy loaded panels only render when needed */}
      <main className="p-6 md:p-8 w-full">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="animate-fadeIn">
            <MobileAdminDashboard />
          </div>
        )}

        {/* Users Tab - ⚡ Only loaded/rendered when clicked */}
        {activeTab === 'users' && loadedTabs.has('users') && (
          <div className="animate-fadeIn">
            <UsersPanel />
          </div>
        )}

        {/* Orders Tab - ⚡ Only loaded/rendered when clicked */}
        {activeTab === 'orders' && loadedTabs.has('orders') && (
          <div className="animate-fadeIn">
            <OrdersPanel />
          </div>
        )}

        {/* Products Tab - ⚡ Only loaded/rendered when clicked */}
        {activeTab === 'products' && loadedTabs.has('products') && (
          <div className="animate-fadeIn">
            <ProductsPanel />
          </div>
        )}

        {/* Pending Tab - ⚡ Only loaded/rendered when clicked */}
        {activeTab === 'pending' && loadedTabs.has('pending') && (
          <div className="animate-fadeIn">
            <PendingPanel />
          </div>
        )}
      </main>
    </div>
  );
}
