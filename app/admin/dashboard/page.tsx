"use client";

import { useCallback, useEffect, useState } from "react";
import { EnhancedDashboard } from "../components/EnhancedDashboard";
import { UsersPanel } from "./UsersPanel";
import { PendingPanel } from "./PendingPanel";
import { ProductsPanel } from "./ProductsPanel";
import { useSessionExpiry } from "@/lib/hooks/useSessionExpiry";
import { useResponsive } from "@/app/hooks/useResponsive";
import { useAdmin } from "@/app/context/AdminContext";
import { BarChart3, AlertTriangle } from "lucide-react";

// ⚡ LAZY LOAD panels with code splitting - dramatically reduces initial bundle size
// Panels are intentionally minimal — dashboard now only shows Overview

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

// Tab configuration: main dashboard + panels (rendered by activeTab)
const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: BarChart3, color: 'text-blue-600' },
  { id: 'users', label: 'Users', icon: BarChart3, color: 'text-green-600' },
  { id: 'pending', label: 'Pending', icon: BarChart3, color: 'text-orange-600' },
  { id: 'products', label: 'Products', icon: BarChart3, color: 'text-purple-600' },
] as const;

export default function AdminDashboardPage() {
  const { mounted } = useResponsive();
  const { admin, isLoading: authLoading } = useAdmin();
  // Active dashboard tab (dashboard | users | pending | products)
  // Default to 'dashboard' on each load - no localStorage persistence
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'pending' | 'products'>('dashboard');
  const canViewTab = useCallback((tab: 'dashboard' | 'users' | 'pending' | 'products') => {
    if (admin?.permissions?.includes('access_all_features')) return true;
    const permissionByTab = {
      dashboard: 'view_dashboard',
      users: 'view_users',
      pending: 'view_orders',
      products: 'view_products',
    } as const;
    return Boolean(admin?.permissions?.includes(permissionByTab[tab]));
  }, [admin?.permissions]);
  
  // Adjust default tab based on admin permissions
  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (admin) {
        const canViewDashboard = canViewTab('dashboard');
        if (!canViewDashboard) {
          const fallback = (['pending', 'products', 'users'] as const).find(canViewTab);
          if (fallback) {
            setActiveTab(fallback);
            window.dispatchEvent(new CustomEvent('adminTabChange', { detail: { tab: fallback } }));
          }
        }
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [admin, canViewTab]);

  // Use session expiry hook to detect logout
  const { sessionError } = useSessionExpiry();

  // No localStorage persistence for tab preference
  // Each session starts fresh with Dashboard view

  // Listen for same-window tab changes dispatched by the sidebar
  useEffect(() => {
    const onAdminTabChange = (e: Event) => {
      try {
        const detail = (e as CustomEvent).detail;
        if (detail && detail.tab) {
            const t = detail.tab;
            if (t === 'dashboard' || t === 'users' || t === 'pending' || t === 'products') {
              if (canViewTab(t)) setActiveTab(t);
            }
        }
      } catch {
        // ignore
      }
    };

    window.addEventListener('adminTabChange', onAdminTabChange as EventListener);
    return () => window.removeEventListener('adminTabChange', onAdminTabChange as EventListener);
  }, [canViewTab]);

  // Early returns AFTER all hooks are called
  if (!mounted || authLoading) {
    return null;
  }

  if (!(['dashboard', 'users', 'pending', 'products'] as const).some(canViewTab)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md rounded-2xl border bg-white p-8 text-center shadow-sm">
          <AlertTriangle className="mx-auto h-10 w-10 text-amber-500" />
          <h1 className="mt-4 text-xl font-black text-gray-900">No dashboard access assigned</h1>
          <p className="mt-2 text-sm text-gray-600">Ask the Super Admin to assign at least one dashboard, customer, order, or product permission.</p>
        </div>
      </div>
    );
  }

  // Show session error banner if present
  if (mounted && sessionError) {
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

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 pb-6 md:pb-0">
      {/* Content Area - ⚡ Lazy loaded panels only render when needed */}
      <main className="px-4 sm:px-6 lg:px-8 py-6 md:py-8 w-full pb-6 md:pb-0">
        {/* Enhanced Analytics Dashboard */}
        {activeTab === 'dashboard' && canViewTab('dashboard') && (
          <div className="animate-fadeIn">
            <EnhancedDashboard />
          </div>
        )}

        {activeTab === 'users' && canViewTab('users') && (
          <div className="animate-fadeIn">
            <UsersPanel />
          </div>
        )}

        {activeTab === 'pending' && canViewTab('pending') && (
          <div className="animate-fadeIn">
            <PendingPanel />
          </div>
        )}

        {activeTab === 'products' && canViewTab('products') && (
          <div className="animate-fadeIn">
            <ProductsPanel />
          </div>
        )}

        {/* Only Overview content is shown */}


      </main>
    </div>
  );
}
