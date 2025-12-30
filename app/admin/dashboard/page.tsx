"use client";

import { useEffect, useState, Suspense } from "react";
import dynamic from "next/dynamic";
import MobileAdminDashboard from "../mobile-dashboard";
import MobileAdminLayout from "../mobile-layout";
import { MobileBottomSidebar } from "./MobileBottomSidebar";
import { useAdmin } from "@/app/context/AdminContext";
import { useSessionExpiry } from "@/lib/hooks/useSessionExpiry";
import MobileAdminDashboardSkeleton from "../mobile-dashboard";
import { Users, ShoppingCart, Palette, Package, Clock, BarChart3, AlertTriangle, Palette as Paintbrush, CheckCircle2 } from "lucide-react";

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

const ApprovedOrdersPanel = dynamic(() => import("./ApprovedOrdersPanel").then(mod => ({ default: mod.ApprovedOrdersPanel })), {
  loading: () => <PanelSkeleton />,
  ssr: false
});

const CustomOrdersPanel = dynamic(() => import("./CustomOrdersPanel").then(mod => ({ default: mod.CustomOrdersPanel })), {
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
  { id: 'custom', label: 'Orders', icon: Paintbrush, color: 'text-orange-600' },
  { id: 'users', label: 'Users', icon: Users, color: 'text-purple-600' },
  { id: 'products', label: 'Products', icon: Package, color: 'text-indigo-600' },
] as const;

export default function AdminDashboardPage() {
  const [isMobile, setIsMobile] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [tabCounts, setTabCounts] = useState<Record<string, number>>({
    pending: 0,
    approved: 0,
    custom: 0,
    users: 0,
    products: 0,
  });
  
  // ⚡ Initialize activeTab and loadedTabs together to prevent missing content on page refresh
  const [activeTab, setActiveTab] = useState<
    'overview' | 'users' | 'products' | 'custom'
  >(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('adminDashboardActiveTab');
      return (saved as 'overview' | 'users' | 'products' | 'custom') || 'overview';
    }
    return 'overview';
  });
  
  // ⚡ Track loaded tabs to prevent re-fetching - Initialize with activeTab so content loads on refresh
  const [loadedTabs, setLoadedTabs] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('adminDashboardActiveTab');
      const initialTab = (saved as 'overview' | 'users' | 'products' | 'custom') || 'overview';
      return new Set(['overview', initialTab]);
    }
    return new Set(['overview']);
  });
  
  // Use session expiry hook to detect logout
  const { sessionError } = useSessionExpiry();

  useEffect(() => {
    setIsMounted(true);
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Fetch tab counts
  useEffect(() => {
    const fetchCounts = async () => {
      try {
        // Fetch pending orders count
        const pendingRes = await fetch('/api/orders?limit=1');
        const pendingData = pendingRes.ok ? await pendingRes.json() : { orders: [] };
        const pendingOrders = Array.isArray(pendingData) ? pendingData : (pendingData.orders || []);
        const pendingCount = pendingOrders.filter((o: any) => 
          o.status === 'pending' || o.status === 'unpaid' || o.status === 'processing' || o.paymentStatus === 'pending'
        ).length;

        // Fetch approved orders count
        const approvedRes = await fetch('/api/orders?limit=1');
        const approvedData = approvedRes.ok ? await approvedRes.json() : { orders: [] };
        const approvedOrders = Array.isArray(approvedData) ? approvedData : (approvedData.orders || []);
        const approvedCount = approvedOrders.filter((o: any) => 
          o.status === 'approved' || o.paymentStatus === 'paid'
        ).length;

        // Fetch custom orders count
        const customRes = await fetch('/api/custom-orders?limit=1');
        const customData = customRes.ok ? await customRes.json() : [];
        const customOrders = Array.isArray(customData) ? customData : (customData.orders || []);
        const customCount = customOrders.filter((o: any) => o.status === 'pending').length;

        // Fetch users count
        const usersRes = await fetch('/api/users?limit=1');
        const usersData = usersRes.ok ? await usersRes.json() : [];
        const usersCount = Array.isArray(usersData) ? usersData.length : (usersData.users || []).length;

        // Fetch products count
        const productsRes = await fetch('/api/products?limit=1');
        const productsData = productsRes.ok ? await productsRes.json() : [];
        const productsCount = Array.isArray(productsData) ? productsData.length : (productsData.products || []).length;

        setTabCounts({
          pending: pendingCount,
          approved: approvedCount,
          custom: customCount,
          users: usersCount,
          products: productsCount,
        });
      } catch (error) {
        console.error('Failed to fetch tab counts:', error);
      }
    };

    fetchCounts();
    // Refresh counts every 10 seconds
    const interval = setInterval(fetchCounts, 10000);
    return () => clearInterval(interval);
  }, []);

  // Persist active tab to localStorage
  useEffect(() => {
    localStorage.setItem('adminDashboardActiveTab', activeTab);
  }, [activeTab]);

  // ⚡ Handle tab click - mark as loaded
  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId as any);
    setLoadedTabs(prev => new Set([...prev, tabId]));
  };

  // Show session error banner if present
  if (isMounted && sessionError) {
    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-8 text-center">
          <AlertTriangle className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">Session Expired</h1>
          <p className="text-gray-600 mb-6">{sessionError}</p>
          <a
            href="/admin/login"
            className="inline-block bg-lime-600 hover:bg-lime-700 text-white font-semibold py-2 px-6 rounded-lg transition"
          >
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  if (!isMounted) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pb-24 md:pb-0">
      {/* Horizontal Tab Navigation - VISIBLE ON DESKTOP AND MOBILE - ⚡ OPTIMIZED FOR SPEED - POSITIONED AT TOP */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-200 overflow-x-auto shadow-sm md:sticky">
        <nav className="flex gap-1 px-4 md:px-6 py-0">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const count = tabCounts[tab.id] || 0;
            const showBadge = ['pending', 'approved', 'custom', 'users', 'products'].includes(tab.id) && count > 0;
            
            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={`px-3 md:px-4 py-3 font-semibold transition-all whitespace-nowrap flex items-center gap-1 md:gap-2 border-b-2 text-sm md:text-base relative ${
                  activeTab === tab.id
                    ? 'border-lime-600 text-lime-600 bg-lime-50/50'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Icon className="h-4 w-4 md:h-5 md:w-5" />
                <span className="hidden sm:inline">{tab.label}</span>
                {showBadge && (
                  <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {count > 99 ? '99+' : count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Content Area - ⚡ Lazy loaded panels only render when needed - ADD PADDING BOTTOM FOR MOBILE SIDEBAR */}
      <main className="p-4 md:p-8 w-full pb-24 md:pb-0">
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

        {/* Products Tab - ⚡ Only loaded/rendered when clicked */}
        {activeTab === 'products' && loadedTabs.has('products') && (
          <div className="animate-fadeIn">
            <ProductsPanel />
          </div>
        )}

        {/* Orders Tab - ⚡ Only loaded/rendered when clicked */}
        {activeTab === 'custom' && loadedTabs.has('custom') && (
          <div className="animate-fadeIn">
            <CustomOrdersPanel />
          </div>
        )}


      </main>

      {/* Mobile Bottom Sidebar Navigation - MOBILE ONLY */}
      <MobileBottomSidebar />
    </div>
  );
}
