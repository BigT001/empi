"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Plus, BarChart3, FileText, Settings } from "lucide-react";

interface SidebarItem {
  name: string;
  href: string;
  icon: React.ReactNode;
}

const sidebarItems: SidebarItem[] = [
  {
    name: "Dashboard",
    href: "/admin/dashboard",
    icon: <Home className="h-6 w-6" />,
  },
  {
    name: "Add Product",
    href: "/admin/upload",
    icon: <Plus className="h-6 w-6" />,
  },
  {
    name: "Finance",
    href: "/admin/finance",
    icon: <BarChart3 className="h-6 w-6" />,
  },
  {
    name: "Invoices",
    href: "/admin/invoices",
    icon: <FileText className="h-6 w-6" />,
  },
  {
    name: "Settings",
    href: "/admin/settings",
    icon: <Settings className="h-6 w-6" />,
  },
];

export function MobileBottomSidebar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/admin") {
      return pathname === "/admin";
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden z-50">
      <div className="flex items-center justify-around">
        {sidebarItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 px-2 transition-all ${
              isActive(item.href)
                ? 'text-lime-600 bg-lime-50'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
            title={item.name}
          >
            {item.icon}
            <span className="text-xs font-medium text-center">{item.name}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
