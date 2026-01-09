"use client";

import { ReactNode, useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Plus, BarChart3, FileText, Settings, Home, LogOut, MessageCircle, Truck, Package, Users } from "lucide-react";

interface NavItem {
  name: string;
  href: string;
  icon: ReactNode;
  label: string;
  tab?: string;
}

const navItems: NavItem[] = [
  {
    name: "Dashboard",
    href: "/admin/dashboard",
    icon: <Home className="h-5 w-5" />,
    label: "Overview",
    tab: 'dashboard',
  },
  {
    name: "Users",
    href: "/admin/dashboard",
    icon: <Users className="h-5 w-5" />,
    label: "Users",
    tab: 'users',
  },
  {
    name: "Products",
    href: "/admin/dashboard",
    icon: <Package className="h-5 w-5" />,
    label: "Products",
    tab: 'products',
  },
  {
    name: "Add",
    href: "/admin/upload",
    icon: <Plus className="h-5 w-5" />,
    label: "Add Product",
  },
  {
    name: "Finance",
    href: "/admin/finance",
    icon: <BarChart3 className="h-5 w-5" />,
    label: "Analytics",
  },
  {
    name: "Invoices",
    href: "/admin/invoices",
    icon: <FileText className="h-5 w-5" />,
    label: "Invoices",
  },
  {
    name: "Reviews",
    href: "/admin/reviews",
    icon: <MessageCircle className="h-5 w-5" />,
    label: "Customer Reviews",
  },
  {
    name: "Logistics",
    href: "/admin/logistics",
    icon: <Truck className="h-5 w-5" />,
    label: "Logistics",
  },
  {
    name: "Settings",
    href: "/admin/settings",
    icon: <Settings className="h-5 w-5" />,
    label: "Settings",
  },
];

export default function MobileAdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [isMounted, setIsMounted] = useState(false);
  const [stats, setStats] = useState({ pendingInvoices: 0, pendingOrders: 0, totalOrders: 0, totalProducts: 0, registeredCustomers: 0 });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch('/api/admin/dashboard', { cache: 'no-store' });
        if (!res.ok) return;
        const d = await res.json();
        if (!mounted) return;
        setStats({
          pendingInvoices: d.pendingInvoices || 0,
          pendingOrders: (d.pendingOrders ?? d.pendingInvoices) || 0,
          totalOrders: d.totalOrders || 0,
          totalProducts: d.totalProducts || 0,
          registeredCustomers: d.registeredCustomers || 0,
        });
      } catch (e) {
        // ignore
      }
    })();
    return () => { mounted = false; };
  }, []);

  const isActive = (href: string, tab?: string) => {
    if (href === "/admin/dashboard") {
      if (!(pathname === '/admin' || pathname.startsWith('/admin/dashboard'))) return false;
      try {
        if (typeof window !== 'undefined') {
          const activeTab = localStorage.getItem('adminDashboardActiveTab') || 'dashboard';
          return !!tab && activeTab === tab;
        }
      } catch (e) {
        // ignore
      }
      return tab === 'dashboard' && (pathname === '/admin' || pathname === '/admin/dashboard');
    }
    if (href === "/admin/upload") {
      return pathname === "/admin/upload" || pathname === "/admin";
    }
    return pathname.startsWith(href) && href !== "/admin/dashboard";
  };

  if (!isMounted) return null;

  return (
    <div className="flex flex-col h-screen bg-white overflow-hidden md:hidden">
      {/* Mobile Header */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center hover:opacity-80 transition">
          <Image
            src="/logo/EMPI-2k24-LOGO-1.PNG"
            alt="EMPI"
            width={40}
            height={40}
            className="h-10 w-auto object-contain"
          />
        </Link>
        <h1 className="text-lg font-bold text-gray-900">Admin Panel</h1>
        <div className="w-10" /> {/* Spacer for alignment */}
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-16">
        <div className="w-full">
          {children}
        </div>
      </main>

      {/* Bottom Navigation Bar - Instagram Style */}
      <nav className="fixed bottom-4 left-4 right-4 bg-white/95 border border-gray-100 z-40 md:hidden rounded-2xl shadow-lg backdrop-blur-sm">
        <div className="flex items-center justify-between h-16 w-full px-1">
          {navItems.map((item) => {
            const active = isActive(item.href, item.tab);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => {
                  try {
                    if (typeof window !== 'undefined') {
                      if (item.tab) localStorage.setItem('adminDashboardActiveTab', item.tab);
                    }
                  } catch (e) { /* ignore */ }
                }}
                className={`flex flex-col items-center justify-center flex-1 h-full py-2 relative transition-transform duration-200 ${
                  active
                    ? "text-lime-600 transform -translate-y-1 scale-105"
                    : "text-gray-500 hover:text-gray-900 hover:scale-102"
                }`}
                title={item.label}
              >
                {/* Icon + badge container */}
                <div className="relative mb-0.5 flex items-center justify-center">
                  <div className={`transition-transform ${active ? 'scale-110' : 'scale-100'}`}>{item.icon}</div>

                  {/* Badges (dot only - no numeric count) */}
                  {item.name === 'Pending' && stats.pendingOrders > 0 && (
                    <span aria-hidden className="absolute -top-1 -right-3 w-2 h-2 rounded-full bg-amber-500" />
                  )}
                </div>

                {/* Label - small on mobile */}
                <span className="text-[10px] font-semibold leading-none line-clamp-1 px-0.5 mt-0.5">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Desktop Sidebar Fallback - Hidden on Mobile */}
      <style jsx>{`
        @media (min-width: 768px) {
          main {
            display: none;
          }
          nav {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
