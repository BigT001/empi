"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Plus, BarChart3, Settings, LogOut, FileText, Database, Menu, Home, Truck, MessageCircle, Clock, Package, Users } from "lucide-react";
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
  tab?: string; // optional dashboard tab id when href === '/admin/dashboard'
  permission?: string; // required permission to view this item
  roles?: string[]; // array of roles that can access this item (all roles if not specified)
}

const sidebarItems: SidebarItem[] = [
  {
    name: "Dashboard",
    href: "/admin/dashboard",
    icon: <Home className="h-5 w-5" />,
    tab: 'dashboard',
    permission: 'view_dashboard',
  },
  {
    name: "Users",
    href: "/admin/dashboard",
    icon: <Users className="h-5 w-5" />,
    tab: 'users',
    permission: 'view_dashboard',
    roles: ['super_admin', 'admin'], // Finance and Logistics cannot access
  },
  {
    name: "Orders",
    href: "/admin/dashboard",
    icon: <Clock className="h-5 w-5" />,
    tab: 'pending',
    permission: 'view_orders',
    roles: ['super_admin', 'admin', 'logistics_admin'], // Finance cannot access
  },
  {
    name: "Products",
    href: "/admin/dashboard",
    icon: <Package className="h-5 w-5" />,
    tab: 'products',
    permission: 'view_products',
    roles: ['super_admin', 'admin'], // Finance and Logistics cannot access
  },
  {
    name: "Add Product",
    href: "/admin/upload",
    icon: <Plus className="h-5 w-5" />,
    permission: 'view_products',
    roles: ['super_admin', 'admin'], // Finance and Logistics cannot access
  },
  {
    name: "Finance",
    href: "/admin/finance",
    icon: <BarChart3 className="h-5 w-5" />,
    permission: 'view_finance',
    roles: ['super_admin', 'admin', 'finance_admin'], // Finance team can access
  },
  {
    name: "Invoices",
    href: "/admin/invoices",
    icon: <FileText className="h-5 w-5" />,
    permission: 'view_invoices',
    roles: ['super_admin', 'admin'], // Finance and Logistics cannot access
  },
  {
    name: "Reviews",
    href: "/admin/reviews",
    icon: <MessageCircle className="h-5 w-5" />,
    permission: 'view_products',
    roles: ['super_admin', 'admin'], // Finance and Logistics cannot access
  },
  {
    name: "Logistics",
    href: "/admin/logistics",
    icon: <Truck className="h-5 w-5" />,
    permission: 'view_logistics',
    roles: ['super_admin', 'admin', 'logistics_admin'], // Finance cannot access
  },
  {
    name: "Settings",
    href: "/admin/settings",
    icon: <Settings className="h-5 w-5" />,
    permission: 'view_settings',
    roles: ['super_admin', 'admin'], // Finance and Logistics cannot access
  },
];

export function AdminSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { state, isMobile, setOpenMobile } = useSidebar();
  const { logout, admin } = useAdmin();
  const [stats, setStats] = useState({ pendingInvoices: 0, pendingOrders: 0, totalOrders: 0, totalProducts: 0, registeredCustomers: 0 });

  const isActive = (href: string, tab?: string) => {
    // If the item points to the dashboard, resolve active state from pathname
    if (href === "/admin/dashboard") {
      if (!(pathname === "/admin" || pathname.startsWith("/admin/dashboard"))) return false;
      // Default to 'dashboard' tab - removed localStorage
      return tab === 'dashboard' && (pathname === '/admin' || pathname === '/admin/dashboard');
    }

    return pathname.startsWith(href);
  };

  // Check if item should be visible based on permissions and role
  const isItemVisible = (item: SidebarItem): boolean => {
    // Check if admin has the required permission
    if (item.permission) {
      if (!admin?.permissions) return false;
      if (!hasPermission(admin.permissions, item.permission as Permission)) return false;
    }

    // Check if admin's role is allowed for this item
    if (item.roles && item.roles.length > 0) {
      if (!admin?.role) return false;
      if (!item.roles.includes(admin.role)) return false;
    }

    return true;
  };

  const handleMenuClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const handleLogout = async () => {
    console.log('[AdminSidebar] handleLogout() called');
    await logout();
    console.log('[AdminSidebar] logout() promise resolved, waiting 300ms before redirect');
    // Delay to ensure state update and re-renders propagate through React
    setTimeout(() => {
      console.log('[AdminSidebar] 300ms elapsed, redirecting to /admin/login');
      router.push('/admin/login');
    }, 300);
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch('/api/admin/dashboard', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        if (!mounted) return;
        setStats({
          pendingInvoices: data.pendingInvoices || 0,
          // prefer explicit pendingOrders if API provides it (includes custom orders)
          pendingOrders: (data.pendingOrders ?? data.pendingInvoices) || 0,
          totalOrders: data.totalOrders || 0,
          totalProducts: data.totalProducts || 0,
          registeredCustomers: data.registeredCustomers || 0,
        });
      } catch (e) {
        // ignore fail silently
      }
    })();
    return () => { mounted = false; };
  }, []);

  return (
    <Sidebar className={`border-r border-gray-200 bg-gradient-to-b from-white via-gray-50 to-gray-50 ${state === 'collapsed' ? 'sidebar-collapsed' : 'sidebar-expanded'}`} collapsible="icon">
      <SidebarHeader className="border-b border-gray-200 pb-4 bg-white">
        <div className="flex items-center justify-between px-2">
          <Link href="/" className="flex items-center justify-center flex-1 hover:opacity-80 transition-opacity" onClick={handleMenuClick}>
            <Image
              src="/logo/EMPI-2k24-LOGO-1.PNG"
              alt="EMPI Logo"
              width={120}
              height={105}
              className="h-auto object-contain"
              priority
            />
          </Link>
          <SidebarTrigger className="ml-auto" />
        </div>
      </SidebarHeader>

      <SidebarContent className="py-4">
        <SidebarMenu className="gap-2">
          {sidebarItems
            .filter(item => isItemVisible(item))
            .map((item) => (
            <SidebarMenuItem key={item.name}>
              <SidebarMenuButton
                asChild
                isActive={isActive(item.href, item.tab)}
                className={`rounded-lg transition-all duration-200 px-3 py-2.5 flex items-center gap-3 justify-between ${
                  isActive(item.href, item.tab)
                    ? "bg-gradient-to-r from-lime-500 to-lime-600 text-white shadow-md shadow-lime-200 font-semibold"
                    : "text-gray-700 hover:bg-gray-100 hover:text-gray-900 border border-transparent"
                }`}
              >
                <Link
                  href={item.href}
                  onClick={() => {
                    try {
                      if (typeof window !== 'undefined') {
                        if (item.tab) {
                          // Notify same-window listeners that the tab changed
                          window.dispatchEvent(new CustomEvent('adminTabChange', { detail: { tab: item.tab } }));
                        }
                      }
                    } catch (e) {
                      /* ignore */
                    }
                    handleMenuClick();
                  }}
                  className="font-medium text-sm flex items-center gap-3 w-full"
                  title={state === 'collapsed' ? item.name : undefined}
                >
                  <div className="flex items-center gap-3">
                    <div className="text-gray-500">{item.icon}</div>
                    <span className="sidebar-text truncate">{item.name}</span>
                  </div>

                  {/* Badges for key items */}
                  <div className="ml-3 flex items-center">
                    {item.tab === 'pending' && stats.pendingOrders > 0 && (
                      <span aria-hidden className="inline-block w-2 h-2 rounded-full bg-amber-500" />
                    )}
                  </div>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="border-t border-gray-100 pt-4">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-4 py-2.5 text-gray-600 hover:text-white hover:bg-red-500 rounded-lg font-medium transition-all duration-200 text-sm border border-gray-200 hover:border-red-500 shadow-sm hover:shadow-md"
          title="Logout"
        >
          <LogOut className="h-5 w-5" />
          <span className="sidebar-text">Logout</span>
        </button>
      </SidebarFooter>
    </Sidebar>
  );
}
