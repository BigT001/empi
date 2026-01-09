"use client";

import { useEffect, useState } from "react";
import MobileAdminDashboard from "../mobile-dashboard";
import { MobileBottomSidebar } from "./MobileBottomSidebar";
import { UsersPanel } from "./UsersPanel";
import { PendingPanel } from "./PendingPanel";
import { ProductsPanel } from "./ProductsPanel";
import { useSessionExpiry } from "@/lib/hooks/useSessionExpiry";
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
  const [isMobile, setIsMobile] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  // Active dashboard tab (dashboard | users | pending | products)
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'pending' | 'products'>(() => {
    try {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('adminDashboardActiveTab');
        if (saved === 'users' || saved === 'pending' || saved === 'products' || saved === 'dashboard') return saved as any;
      }
    } catch (e) { /* ignore */ }
    return 'dashboard';
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
  // No tab counts to fetch — overview-only dashboard

  // Persist active tab to localStorage when it changes
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') localStorage.setItem('adminDashboardActiveTab', activeTab);
    } catch (e) { /* ignore */ }
  }, [activeTab]);

  // Listen for same-window tab changes dispatched by the sidebar
  useEffect(() => {
    const onAdminTabChange = (e: Event) => {
      try {
        const detail = (e as CustomEvent).detail;
        if (detail && detail.tab) {
            const t = detail.tab;
            if (t === 'dashboard' || t === 'users' || t === 'pending' || t === 'products') {
              setActiveTab(t);
            }
        }
      } catch (err) {
        // ignore
      }
    };

    window.addEventListener('adminTabChange', onAdminTabChange as EventListener);
    return () => window.removeEventListener('adminTabChange', onAdminTabChange as EventListener);
  }, []);

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId as any);
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
      {/* Header removed per request */}

      {/* Content Area - ⚡ Lazy loaded panels only render when needed - ADD PADDING BOTTOM FOR MOBILE SIDEBAR */}
      <main className="p-4 md:p-8 w-full pb-24 md:pb-0">
        {/* Overview + Panels */}
        {activeTab === 'dashboard' && (
          <div className="animate-fadeIn">
            <MobileAdminDashboard />
          </div>
        )}

        {activeTab === 'users' && (
          <div className="animate-fadeIn">
            <UsersPanel />
          </div>
        )}

        {activeTab === 'pending' && (
          <div className="animate-fadeIn">
            <PendingPanel />
          </div>
        )}

        {activeTab === 'products' && (
          <div className="animate-fadeIn">
            <ProductsPanel />
          </div>
        )}

        {/* Only Overview content is shown */}


      </main>

      {/* Mobile Bottom Sidebar Navigation - MOBILE ONLY */}
      <MobileBottomSidebar />
    </div>
  );
}
