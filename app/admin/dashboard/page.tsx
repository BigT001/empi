"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import MobileAdminDashboard from "../mobile-dashboard";
import MobileAdminLayout from "../mobile-layout";
import { useAdmin } from "@/app/context/AdminContext";
import { UsersPanel } from "./UsersPanel";
import { OrdersPanel } from "./OrdersPanel";
import { ProductsPanel } from "./ProductsPanel";
import { PendingPanel } from "./PendingPanel";

export default function AdminDashboardPage() {
  const [isMobile, setIsMobile] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<
    'overview' | 'users' | 'orders' | 'products' | 'pending'
  >('overview');

  useEffect(() => {
    setIsMounted(true);
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

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
  // Desktop dashboard - displayed with sidebar from admin layout
  // Show a tabbed interface where each tab shows relevant content.

  return (
    <div className="w-full h-full p-6 md:p-8">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="md:w-64 bg-white border border-gray-200 rounded-lg p-4">
          <nav className="space-y-2">
            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full text-left px-3 py-2 rounded ${activeTab === 'overview' ? 'bg-lime-50 font-semibold' : 'hover:bg-gray-50'}`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`w-full text-left px-3 py-2 rounded ${activeTab === 'users' ? 'bg-lime-50 font-semibold' : 'hover:bg-gray-50'}`}
            >
              User
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`w-full text-left px-3 py-2 rounded ${activeTab === 'orders' ? 'bg-lime-50 font-semibold' : 'hover:bg-gray-50'}`}
            >
              Orders
            </button>
            <button
              onClick={() => setActiveTab('products')}
              className={`w-full text-left px-3 py-2 rounded ${activeTab === 'products' ? 'bg-lime-50 font-semibold' : 'hover:bg-gray-50'}`}
            >
              Products
            </button>
            <button
              onClick={() => setActiveTab('pending')}
              className={`w-full text-left px-3 py-2 rounded ${activeTab === 'pending' ? 'bg-lime-50 font-semibold' : 'hover:bg-gray-50'}`}
            >
              Pending
            </button>
          </nav>
        </div>

        <div className="flex-1">
          {activeTab === 'overview' && <MobileAdminDashboard />}
          {activeTab === 'users' && <UsersPanel />}
          {activeTab === 'orders' && <OrdersPanel />}
          {activeTab === 'products' && <ProductsPanel />}
          {activeTab === 'pending' && <PendingPanel />}
        </div>
      </div>
    </div>
  );
}
