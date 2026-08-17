"use client";

import { ReactNode, useState, useEffect, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  Menu,
  X,
  LayoutDashboard,
  Users,
  ShoppingBag,
  Package,
  Truck,
  TrendingUp,
  WalletCards,
  FileText,
  Mail,
  Settings,
  LogOut,
  ChevronRight
} from "lucide-react";
import { useAdmin } from "@/app/context/AdminContext";

interface SidebarItem {
  name: string;
  href: string;
  icon: React.ReactNode;
  tab?: string;
  badgeKey?: 'pendingOrders' | 'pendingInvoices';
}

interface SidebarGroup {
  title: string;
  items: SidebarItem[];
}

const sidebarGroups: SidebarGroup[] = [
  {
    title: "Overview",
    items: [
      {
        name: "Dashboard",
        href: "/admin/dashboard?tab=dashboard",
        icon: <LayoutDashboard className="h-5 w-5" />,
        tab: 'dashboard',
      },
      {
        name: "Users",
        href: "/admin/dashboard?tab=users",
        icon: <Users className="h-5 w-5" />,
        tab: 'users',
      },
    ]
  },
  {
    title: "Commerce & Inventory",
    items: [
      {
        name: "Orders",
        href: "/admin/dashboard?tab=pending",
        icon: <ShoppingBag className="h-5 w-5" />,
        tab: 'pending',
        badgeKey: 'pendingOrders',
      },
      {
        name: "Products",
        href: "/admin/dashboard?tab=products",
        icon: <Package className="h-5 w-5" />,
        tab: 'products',
      },
      {
        name: "Logistics",
        href: "/admin/logistics",
        icon: <Truck className="h-5 w-5" />,
      },
    ]
  },
  {
    title: "Finance & Payroll",
    items: [
      {
        name: "Finance",
        href: "/admin/finance",
        icon: <TrendingUp className="h-5 w-5" />,
      },
      {
        name: "Payroll",
        href: "/admin/payroll",
        icon: <WalletCards className="h-5 w-5" />,
      },
      {
        name: "Invoices",
        href: "/admin/invoices",
        icon: <FileText className="h-5 w-5" />,
        badgeKey: 'pendingInvoices',
      },
    ]
  },
  {
    title: "System & Comms",
    items: [
      {
        name: "Mail Room",
        href: "/admin/mail-room",
        icon: <Mail className="h-5 w-5" />,
      },
      {
        name: "Settings",
        href: "/admin/settings",
        icon: <Settings className="h-5 w-5" />,
      },
    ]
  }
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
  const searchParams = useSearchParams();
  const { logout, admin } = useAdmin();

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

  const [activeTab, setActiveTab] = useState<string>('dashboard');

  useEffect(() => {
    if (pathname === "/admin/dashboard" || pathname === "/admin") {
      const currentTab = searchParams?.get('tab') || 'dashboard';
      setActiveTab(currentTab);
    }
  }, [pathname, searchParams]);

  useEffect(() => {
    const handleTabChange = (event: Event) => {
      if (event instanceof CustomEvent) {
        setActiveTab(event.detail?.tab || 'dashboard');
      }
    };
    
    window.addEventListener('adminTabChange', handleTabChange);
    return () => window.removeEventListener('adminTabChange', handleTabChange);
  }, []);

  const isActive = (href: string, tab?: string) => {
    const isOnDashboard = pathname === '/admin' || pathname === '/admin/dashboard';
    if (tab) {
      if (!isOnDashboard) return false;
      const currentTab = searchParams?.get('tab') || activeTab || 'dashboard';
      return currentTab === tab;
    }
    const basePath = href.split('?')[0];
    return pathname === basePath || pathname.startsWith(basePath + '/');
  };

  const handleMenuItemClick = (item: SidebarItem) => {
    try {
      if (typeof window !== 'undefined' && item.tab) {
        window.dispatchEvent(new CustomEvent('adminTabChange', { detail: { tab: item.tab } }));
      }
    } catch (e) {
      // ignore
    }
    setIsMenuOpen(false);
    
    if (item.tab && (pathname === '/admin' || pathname === '/admin/dashboard')) {
      return;
    }
    
    if (pathname !== item.href && !pathname.startsWith(item.href + '/')) {
      router.push(item.href);
    }
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
      {/* Mobile Top Header Bar */}
      <header className={`fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50 transition-transform duration-300 ease-in-out ${
        isHeaderVisible ? 'translate-y-0' : '-translate-y-full'
      }`}>
        <div className="flex items-center justify-between px-4 py-3 h-16">
          <Link href="/admin/dashboard" className="flex items-center gap-2">
            <Image
              src="/logo/EMPI-2k24-LOGO-1.PNG"
              alt="EMPI Logo"
              width={90}
              height={75}
              className="h-8 w-auto object-contain"
              priority
            />
            <span className="text-[10px] font-bold text-lime-700 bg-lime-50 px-1.5 py-0.5 rounded border border-lime-200 uppercase">
              Admin
            </span>
          </Link>
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 rounded-xl bg-gray-900 text-white hover:bg-gray-800 transition shadow"
            title={isMenuOpen ? "Close menu" : "Open menu"}
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </header>

      {/* Backdrop */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      {/* Slide-out Mobile Menu */}
      <div
        className={`fixed top-0 left-0 h-full w-72 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-out flex flex-col ${
          isMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Menu Header */}
        <div className="bg-gray-900 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image
              src="/logo/EMPI-2k24-LOGO-1.PNG"
              alt="EMPI Logo"
              width={90}
              height={75}
              className="h-8 w-auto object-contain brightness-200"
              priority
            />
            <span className="text-[10px] font-bold text-lime-400 uppercase tracking-widest">
              Portal
            </span>
          </div>
          <button
            onClick={() => setIsMenuOpen(false)}
            className="p-1.5 hover:bg-gray-800 text-gray-300 rounded-lg transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Menu Items grouped */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {sidebarGroups.map((group) => (
            <div key={group.title} className="space-y-1">
              <h3 className="px-3 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                {group.title}
              </h3>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const active = isActive(item.href, item.tab);
                  const badgeVal = item.badgeKey ? menuStats[item.badgeKey] : 0;

                  return (
                    <button
                      key={item.name}
                      onClick={() => handleMenuItemClick(item)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-semibold text-xs transition-all ${
                        active
                          ? "bg-gray-900 text-white shadow-md shadow-gray-900/10"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={active ? "text-lime-400" : "text-gray-400"}>
                          {item.icon}
                        </div>
                        <span>{item.name}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {badgeVal > 0 && (
                          <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${
                            item.badgeKey === 'pendingOrders'
                              ? 'bg-amber-500/15 text-amber-700 border-amber-500/30'
                              : 'bg-blue-500/15 text-blue-700 border-blue-500/30'
                          }`}>
                            {badgeVal}
                          </span>
                        )}
                        {active && (
                          <ChevronRight className="h-3.5 w-3.5 text-lime-400 opacity-80" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer Admin Profile */}
        <div className="p-3 border-t border-gray-100 bg-gray-50/50">
          <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-gray-200">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-lime-500 to-emerald-600 flex items-center justify-center text-black font-black text-xs shadow-xs shrink-0">
                {(admin?.fullName || admin?.email || "A").substring(0, 2).toUpperCase()}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold text-gray-900 truncate">
                  {admin?.fullName || admin?.email || "Admin"}
                </span>
                <span className="text-[9px] font-semibold text-lime-700 bg-lime-100 px-1.5 py-0.2 rounded w-max border border-lime-200 uppercase">
                  {admin?.role?.replace('_', ' ') || "Super Admin"}
                </span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="w-full min-h-screen bg-gray-50/50 pt-16">
        {children}
      </main>
    </div>
  );
}
