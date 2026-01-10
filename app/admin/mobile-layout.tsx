"use client";

import { ReactNode, useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Plus, BarChart3, FileText, Settings, Home, LogOut, MessageCircle, Truck, Package, Users, Menu, X } from "lucide-react";
import { useAdmin } from "@/app/context/AdminContext";

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
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [stats, setStats] = useState({ pendingInvoices: 0, pendingOrders: 0, totalOrders: 0, totalProducts: 0, registeredCustomers: 0 });
  const { logout } = useAdmin();

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
    <div className="flex flex-col h-screen bg-white overflow-hidden md:hidden relative">
      {/* Mobile Header with Toggle Menu */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm">
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
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-700"
          title={isMenuOpen ? "Close menu" : "Open menu"}
        >
          {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Sliding Sidebar Menu */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${
          isMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setIsMenuOpen(false)}
      />
      
      <nav
        className={`fixed top-0 left-0 h-screen w-64 bg-white shadow-xl z-40 transform transition-transform duration-300 ease-out overflow-y-auto ${
          isMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Menu Header */}
        <div className="sticky top-0 bg-gradient-to-r from-lime-500 to-lime-600 text-white p-4 flex items-center justify-between shadow-md">
          <h2 className="font-bold text-lg">Menu</h2>
          <button
            onClick={() => setIsMenuOpen(false)}
            className="p-1 hover:bg-lime-400 rounded transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Menu Items */}
        <div className="py-4 px-2 space-y-1">
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
                  setIsMenuOpen(false);
                }}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${
                  active
                    ? "bg-gradient-to-r from-lime-500 to-lime-600 text-white shadow-md"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <div className="text-lg">{item.icon}</div>
                <span>{item.name}</span>
                {item.tab === 'pending' && stats.pendingOrders > 0 && (
                  <span className="ml-auto inline-block w-2 h-2 rounded-full bg-amber-500" />
                )}
              </Link>
            );
          })}
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200 my-4" />

        {/* Logout Button */}
        <div className="p-4">
          <button
            onClick={async () => {
              setIsMenuOpen(false);
              await logout();
            }}
            className="flex items-center gap-3 w-full px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg font-medium transition-all border border-red-200 hover:border-red-300"
          >
            <LogOut className="h-5 w-5" />
            <span>Logout</span>
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-6">
        <div className="w-full">
          {children}
        </div>
      </main>

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
