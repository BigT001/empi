"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Plus, BarChart3, Settings, LogOut } from "lucide-react";
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
    name: "Finance",
    href: "/admin/finance",
    icon: <BarChart3 className="h-5 w-5" />,
  },
  {
    name: "Settings",
    href: "/admin/settings",
    icon: <Settings className="h-5 w-5" />,
  },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { state, isMobile, setOpenMobile } = useSidebar();

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

  return (
    <Sidebar className="border-r-2 border-gray-300 sticky top-0">
      <div className="flex flex-col h-full relative">
        {/* Sidebar Header */}
        <SidebarHeader className="border-b border-gray-200 pb-3 pt-3 flex items-center justify-center px-2 flex-shrink-0 relative">
          <Link href="/" className="flex items-center justify-center transition-all hover:opacity-80" onClick={handleMenuClick}>
            <Image
              src="/logo/EMPI-2k24-LOGO-1.PNG"
              alt="EMPI Logo"
              width={state === "expanded" ? 100 : 40}
              height={35}
              className={`h-auto object-contain cursor-pointer transition-all duration-300 ${state === "expanded" ? "w-24" : "w-10"}`}
              priority
            />
          </Link>
          {/* Toggle Button - Positioned on Right Border */}
          <div className="absolute -right-4 top-1/2 transform -translate-y-1/2 z-50">
            <SidebarTrigger className="h-8 w-8 bg-white border-2 border-gray-300 rounded-full flex items-center justify-center hover:bg-gray-100 transition-all shadow-md" />
          </div>
        </SidebarHeader>

        {/* Sidebar Navigation - scrollable */}
        <SidebarContent className="px-1 md:px-2 py-3 md:py-4 flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
          <SidebarMenu className="gap-1 md:gap-2">
            {sidebarItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={isActive(item.href)}
                  className={`${
                    isActive(item.href)
                      ? "bg-lime-100 text-lime-600 border-l-4 border-lime-600"
                      : "text-gray-700 hover:bg-gray-100"
                  } transition-all`}
                >
                  <Link href={item.href} onClick={handleMenuClick} className={`flex items-center gap-2 md:gap-3 ${state === "expanded" ? "px-2 md:px-3 py-2 md:py-3" : "justify-center py-2 md:py-3"} rounded transition-all`} title={item.name}>
                    <span className="flex-shrink-0">{item.icon}</span>
                    <span className={`${state === "expanded" ? "block" : "hidden"} text-xs md:text-sm truncate`}>{item.name}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>

        {/* Sidebar Footer - fixed at bottom */}
        <SidebarFooter className="border-t border-gray-200 bg-gray-50 flex-shrink-0 mt-auto px-1 md:px-2 py-2 md:py-3">
          <button onClick={handleMenuClick} className={`flex items-center gap-2 md:gap-3 px-2 md:px-3 py-2 md:py-3 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition text-xs md:text-sm ${state === "expanded" ? "w-full justify-start" : "w-full justify-center"}`} title="Logout">
            <LogOut className="h-4 w-4 md:h-5 md:w-5 flex-shrink-0" />
            <span className={state === "expanded" ? "block truncate" : "hidden"}>Logout</span>
          </button>
        </SidebarFooter>
      </div>
    </Sidebar>
  );
}
