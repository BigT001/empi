"use client";

import { ReactNode, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Menu, X, Home, Users, Clock, Package, Plus, BarChart3, FileText, MessageCircle, Truck, Settings, LogOut } from "lucide-react";
import { useAdmin } from "@/app/context/AdminContext";

interface SidebarItem {
  name: string;
  href: string;
  icon: React.ReactNode;
  tab?: string;
}

const sidebarItems: SidebarItem[] = [
  {
    name: "Dashboard",
    href: "/admin/dashboard",
    icon: <Home className="h-5 w-5" />,
    tab: 'dashboard',
  },
  {
    name: "Users",
    href: "/admin/dashboard",
    icon: <Users className="h-5 w-5" />,
    tab: 'users',
  },
  {
    name: "Orders",
    href: "/admin/dashboard",
    icon: <Clock className="h-5 w-5" />,
    tab: 'pending',
  },
  {
    name: "Products",
    href: "/admin/dashboard",
    icon: <Package className="h-5 w-5" />,
    tab: 'products',
  },
  {
    name: "Add Product",
    href: "/admin/upload",
    icon: <Plus className="h-5 w-5" />,
  },
  {
    name: "Finance",
    href: "/admin/finance",
    icon: <BarChart3 className="h-5 w-5" />,
  },
  {
    name: "Invoices",
    href: "/admin/invoices",
    icon: <FileText className="h-5 w-5" />,
  },
  {
    name: "Reviews",
    href: "/admin/reviews",
    icon: <MessageCircle className="h-5 w-5" />,
  },
  {
    name: "Logistics",
    href: "/admin/logistics",
    icon: <Truck className="h-5 w-5" />,
  },
  {
    name: "Settings",
    href: "/admin/settings",
    icon: <Settings className="h-5 w-5" />,
  },
];

export default function MobileAdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const [isMounted, setIsMounted] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [menuStats, setMenuStats] = useState({ pendingInvoices: 0, pendingOrders: 0 });
  const router = useRouter();
  const pathname = usePathname();
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
        const data = await res.json();
        if (!mounted) return;
        setMenuStats({
          pendingInvoices: data.pendingInvoices || 0,
          pendingOrders: (data.pendingOrders ?? data.pendingInvoices) || 0,
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
    return pathname.startsWith(href) && href !== "/admin/dashboard";
  };

  const handleMenuItemClick = (item: SidebarItem) => {
    try {
      if (typeof window !== 'undefined') {
        if (item.tab) {
          localStorage.setItem('adminDashboardActiveTab', item.tab);
          // Dispatch custom event for same-page tab changes
          window.dispatchEvent(new CustomEvent('adminTabChange', { detail: { tab: item.tab } }));
        }
      }
    } catch (e) {
      // ignore
    }
    setIsMenuOpen(false);
    
    // If already on the target page, don't navigate
    if (pathname === item.href || pathname.startsWith(item.href)) {
      return;
    }
    
    router.push(item.href);
  };

  const handleLogout = async () => {
    setIsMenuOpen(false);
    await logout();
    setTimeout(() => {
      router.push('/admin/login');
    }, 300);
  };

  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    let scrollTimeout: NodeJS.Timeout;
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY < lastScrollY || currentScrollY < 50) {
        setIsHeaderVisible(true);
      } else if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsHeaderVisible(false);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  return (
    <div className="md:hidden w-full relative">
      {/* Header with Toggle Button */}
      <header className={`fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50 transition-transform duration-300 ease-in-out ${
        isHeaderVisible ? 'translate-y-0' : '-translate-y-full'
      }`}>
        <div className="flex items-center justify-between px-4 py-3 h-16">
          <h1 className="text-lg font-bold text-gray-900">Admin Panel</h1>
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2.5 rounded-lg bg-lime-600 text-white hover:bg-lime-700 transition shadow-lg"
            title={isMenuOpen ? "Close menu" : "Open menu"}
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </header>

      {/* Sidebar Overlay */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      {/* Sidebar Menu */}
      <div
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
          {sidebarItems.map((item) => {
            const active = isActive(item.href, item.tab);
            return (
              <button
                key={item.tab ? `${item.href}-${item.tab}` : item.href}
                onClick={() => handleMenuItemClick(item)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all text-left ${
                  active
                    ? "bg-gradient-to-r from-lime-500 to-lime-600 text-white shadow-md"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <div className="text-lg">{item.icon}</div>
                <span>{item.name}</span>
                {item.tab === 'pending' && menuStats.pendingOrders > 0 && (
                  <span className="ml-auto inline-block w-2 h-2 rounded-full bg-amber-500" />
                )}
              </button>
            );
          })}
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200 my-4" />

        {/* Logout Button */}
        <div className="p-4">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg font-medium transition-all border border-red-200 hover:border-red-300"
          >
            <LogOut className="h-5 w-5" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Fixed Toggle Button - Right Side */}
      <div className="fixed top-4 right-4 z-50">
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="p-2.5 rounded-lg bg-lime-600 text-white hover:bg-lime-700 transition shadow-lg"
          title={isMenuOpen ? "Close menu" : "Open menu"}
        >
          {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Main Content */}
      <main className="w-full min-h-screen bg-white pt-20">
        {children}
      </main>
    </div>
  );
}

