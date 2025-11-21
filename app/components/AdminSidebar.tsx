"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Plus, BarChart3, Settings, LogOut, FileText, Database, Image as ImageIcon, Menu } from "lucide-react";
import { useAdmin } from "@/app/context/AdminContext";
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

interface SidebarItem {
  name: string;
  href: string;
  icon: React.ReactNode;
}

const sidebarItems: SidebarItem[] = [
  {
    name: "Add Product",
    href: "/admin",
    icon: <Plus className="h-5 w-5" />,
  },
  {
    name: "Products",
    href: "/admin/products",
    icon: <ImageIcon className="h-5 w-5" />,
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
    name: "Settings",
    href: "/admin/settings",
    icon: <Settings className="h-5 w-5" />,
  },
];

export function AdminSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { state, isMobile, setOpenMobile } = useSidebar();
  const { logout } = useAdmin();

  const isActive = (href: string) => {
    if (href === "/admin") {
      return pathname === "/admin";
    }
    return pathname.startsWith(href);
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

  return (
    <Sidebar className={`border-r border-gray-200 bg-white ${state === 'collapsed' ? 'sidebar-collapsed' : 'sidebar-expanded'}`} collapsible="icon">
      <SidebarHeader className="border-b border-gray-100 pb-4">
        <div className="flex items-center justify-between px-2">
          <Link href="/" className="flex items-center justify-center flex-1" onClick={handleMenuClick}>
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
          {sidebarItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={isActive(item.href)}
                className={`rounded-lg transition-all ${ 
                  isActive(item.href) 
                    ? "bg-lime-50 text-lime-700 border border-lime-200 shadow-sm" 
                    : "text-gray-700 hover:bg-gray-50 border border-transparent"
                }`}
              >
                <Link href={item.href} onClick={handleMenuClick} className="font-medium text-sm" title={item.name}>
                  {item.icon}
                  <span className="sidebar-text">{item.name}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="border-t border-gray-100 pt-4">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-4 py-2.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg font-medium transition text-sm border border-transparent hover:border-red-200"
          title="Logout"
        >
          <LogOut className="h-5 w-5" />
          <span>Logout</span>
        </button>
      </SidebarFooter>
    </Sidebar>
  );
}
