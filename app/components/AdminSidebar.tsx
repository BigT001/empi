"use client";

import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Image from "next/image";
import {
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
import { hasPermission } from "@/lib/permissions";
import type { Permission } from "@/lib/permissions";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { useEffect, useState } from "react";

interface SidebarItem {
  name: string;
  href: string;
  icon: React.ReactNode;
  tab?: string;
  permission?: string;
  roles?: string[];
  badgeKey?: 'pendingOrders' | 'pendingInvoices' | 'totalProducts' | 'registeredCustomers';
  badgeColor?: string;
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
        icon: <LayoutDashboard className="h-4.5 w-4.5" />,
        tab: 'dashboard',
        permission: 'view_dashboard',
      },
      {
        name: "Users",
        href: "/admin/dashboard?tab=users",
        icon: <Users className="h-4.5 w-4.5" />,
        tab: 'users',
        permission: 'view_users',
        badgeKey: 'registeredCustomers',
        badgeColor: 'bg-gray-100 text-gray-600 border-gray-200 font-medium',
      },
    ]
  },
  {
    title: "Commerce & Inventory",
    items: [
      {
        name: "Orders",
        href: "/admin/dashboard?tab=pending",
        icon: <ShoppingBag className="h-4.5 w-4.5" />,
        tab: 'pending',
        permission: 'view_orders',
        roles: ['super_admin', 'admin', 'logistics_admin', 'finance_admin', 'sales_admin'],
        badgeKey: 'pendingOrders',
        badgeColor: 'bg-amber-500/10 text-amber-700 border-amber-500/20 font-bold',
      },
      {
        name: "Products",
        href: "/admin/dashboard?tab=products",
        icon: <Package className="h-4.5 w-4.5" />,
        tab: 'products',
        permission: 'view_products',
        roles: ['super_admin', 'admin', 'sales_admin'],
        badgeKey: 'totalProducts',
        badgeColor: 'bg-gray-100 text-gray-600 border-gray-200 font-medium',
      },
      {
        name: "Logistics",
        href: "/admin/logistics",
        icon: <Truck className="h-4.5 w-4.5" />,
        permission: 'view_logistics',
        roles: ['super_admin', 'admin', 'logistics_admin', 'finance_admin'],
      },
    ]
  },
  {
    title: "Finance & Payroll",
    items: [
      {
        name: "Finance",
        href: "/admin/finance",
        icon: <TrendingUp className="h-4.5 w-4.5" />,
        permission: 'view_finance',
        roles: ['super_admin', 'admin', 'finance_admin'],
      },
      {
        name: "Payroll",
        href: "/admin/payroll",
        icon: <WalletCards className="h-4.5 w-4.5" />,
        permission: "view_finance",
        roles: ["super_admin", "admin", "finance_admin"],
      },
      {
        name: "Invoices",
        href: "/admin/invoices",
        icon: <FileText className="h-4.5 w-4.5" />,
        permission: 'view_invoices',
        roles: ['super_admin', 'admin', 'finance_admin', 'sales_admin'],
        badgeKey: 'pendingInvoices',
        badgeColor: 'bg-blue-500/10 text-blue-700 border-blue-500/20 font-bold',
      },
    ]
  },
  {
    title: "System & Comms",
    items: [
      {
        name: "Mail Room",
        href: "/admin/mail-room",
        icon: <Mail className="h-4.5 w-4.5" />,
        permission: 'view_mail_room',
        roles: ['super_admin', 'admin', 'finance_admin', 'logistics_admin', 'sales_admin'],
      },
      {
        name: "Settings",
        href: "/admin/settings",
        icon: <Settings className="h-4.5 w-4.5" />,
        permission: 'view_settings',
        roles: ['super_admin'],
      },
    ]
  }
];

export function AdminSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { state, isMobile, setOpenMobile } = useSidebar();
  const { logout, admin } = useAdmin();
  const [stats, setStats] = useState({ pendingInvoices: 0, pendingOrders: 0, totalOrders: 0, totalProducts: 0, registeredCustomers: 0 });
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  useEffect(() => {
    if (pathname === "/admin/dashboard" || pathname === "/admin") {
      const currentTab = searchParams?.get('tab') || 'dashboard';
      setActiveTab(currentTab);
    }
  }, [pathname, searchParams]);

  const isActive = (href: string, tab?: string) => {
    const isOnDashboard = pathname === "/admin" || pathname === "/admin/dashboard";
    if (tab) {
      if (!isOnDashboard) return false;
      const currentTab = searchParams?.get('tab') || activeTab || 'dashboard';
      return currentTab === tab;
    }
    const basePath = href.split('?')[0];
    if (pathname === basePath) return true;
    if (pathname.startsWith(basePath + "/")) return true;
    return false;
  };

  const isItemVisible = (item: SidebarItem): boolean => {
    if (item.permission) {
      if (!admin?.permissions) return false;
      if (!hasPermission(admin.permissions, item.permission as Permission)) return false;
    }
    return true;
  };

  const handleMenuClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setTimeout(() => {
      router.push('/admin/login');
    }, 300);
  };

  useEffect(() => {
    let mounted = true;
    const handleTabChange = (event: Event) => {
      if (mounted && event instanceof CustomEvent) {
        setActiveTab(event.detail?.tab || 'dashboard');
      }
    };
    
    window.addEventListener('adminTabChange', handleTabChange);
    
    (async () => {
      try {
        const res = await fetch('/api/admin/dashboard', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        if (!mounted) return;
        setStats({
          pendingInvoices: data.pendingInvoices || 0,
          pendingOrders: (data.pendingOrders ?? data.pendingInvoices) || 0,
          totalOrders: data.totalOrders || 0,
          totalProducts: data.totalProducts || 0,
          registeredCustomers: data.registeredCustomers || 0,
        });
      } catch (e) {
        // ignore fail silently
      }
    })();
    
    return () => { 
      mounted = false;
      window.removeEventListener('adminTabChange', handleTabChange);
    };
  }, []);

  const getBadgeValue = (key?: SidebarItem['badgeKey']) => {
    if (!key) return null;
    const val = stats[key];
    if (val === undefined || val === 0) return null;
    return val;
  };

  const isCollapsed = state === 'collapsed';

  return (
    <Sidebar className={`border-r border-gray-200/80 bg-white shadow-sm transition-all duration-300 ${isCollapsed ? 'sidebar-collapsed' : 'sidebar-expanded'}`} collapsible="icon">
      {/* Brand Header */}
      <SidebarHeader className="border-b border-gray-100 py-3.5 px-3 bg-white">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 hover:opacity-90 transition-opacity overflow-hidden" onClick={handleMenuClick}>
            <Image
              src="/logo/EMPI-2k24-LOGO-1.PNG"
              alt="EMPI Logo"
              width={100}
              height={85}
              className="h-9 w-auto object-contain shrink-0"
              priority
            />
            {!isCollapsed && (
              <div className="flex flex-col">
                <span className="text-[10px] font-bold tracking-wider uppercase text-lime-700 bg-lime-50 px-1.5 py-0.5 rounded border border-lime-200/60 inline-flex items-center gap-1 w-max">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Admin
                </span>
              </div>
            )}
          </Link>
          <SidebarTrigger className="h-8 w-8 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-colors" />
        </div>
      </SidebarHeader>

      {/* Grouped Menu List */}
      <SidebarContent className="px-2 py-3 space-y-4 overflow-y-auto">
        {sidebarGroups.map((group) => {
          const visibleItems = group.items.filter(item => isItemVisible(item));
          if (visibleItems.length === 0) return null;

          return (
            <div key={group.title} className="space-y-1">
              {!isCollapsed && (
                <h3 className="px-3 text-[10px] font-bold uppercase tracking-wider text-gray-400 select-none">
                  {group.title}
                </h3>
              )}
              <SidebarMenu className="space-y-0.5">
                {visibleItems.map((item) => {
                  const active = isActive(item.href, item.tab);
                  const badgeVal = getBadgeValue(item.badgeKey);

                  return (
                    <SidebarMenuItem key={item.name}>
                      <SidebarMenuButton
                        asChild
                        isActive={active}
                        className={`group relative w-full rounded-xl px-3 py-2 text-sm font-medium transition-all duration-150 flex items-center justify-between ${
                          active
                            ? "bg-gray-900 text-white shadow-md shadow-gray-900/10"
                            : "text-gray-600 hover:bg-gray-100/80 hover:text-gray-900"
                        }`}
                      >
                        <Link
                          href={item.href}
                          onClick={() => {
                            try {
                              if (typeof window !== 'undefined' && item.tab) {
                                setActiveTab(item.tab);
                                window.dispatchEvent(new CustomEvent('adminTabChange', { detail: { tab: item.tab } }));
                              }
                            } catch (e) {
                              /* ignore */
                            }
                            handleMenuClick();
                          }}
                          title={isCollapsed ? item.name : undefined}
                          className="flex items-center justify-between w-full"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`transition-colors shrink-0 ${
                              active ? "text-lime-400" : "text-gray-400 group-hover:text-gray-700"
                            }`}>
                              {item.icon}
                            </div>
                            {!isCollapsed && (
                              <span className="truncate text-xs font-semibold tracking-tight">{item.name}</span>
                            )}
                          </div>

                          {!isCollapsed && (
                            <div className="flex items-center gap-1.5 ml-2">
                              {badgeVal !== null && (
                                <span className={`text-[10px] px-2 py-0.5 rounded-full border ${item.badgeColor || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                                  {badgeVal}
                                </span>
                              )}
                              {active && (
                                <ChevronRight className="h-3.5 w-3.5 text-lime-400 opacity-80" />
                              )}
                            </div>
                          )}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </div>
          );
        })}
      </SidebarContent>

      {/* Admin Profile Footer */}
      <SidebarFooter className="p-2.5 border-t border-gray-100 bg-white">
        {!isCollapsed ? (
          <div className="flex items-center justify-between p-2 rounded-xl bg-gray-50/80 border border-gray-200/80">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-lime-500 to-emerald-600 flex items-center justify-center text-black font-black text-xs shadow-sm shrink-0">
                {(admin?.fullName || admin?.email || "A").substring(0, 2).toUpperCase()}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold text-gray-900 truncate">
                  {admin?.fullName || admin?.email || "Admin"}
                </span>
                <span className="text-[9px] font-semibold text-lime-700 bg-lime-100/80 px-1.5 py-0.2 rounded w-max border border-lime-200/50 uppercase">
                  {admin?.role?.replace('_', ' ') || "Super Admin"}
                </span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors shrink-0"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={handleLogout}
            className="flex items-center justify-center w-full p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
            title="Logout"
          >
            <LogOut className="h-4.5 w-4.5" />
          </button>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
