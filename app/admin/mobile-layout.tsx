"use client";

import { ReactNode, useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Plus, BarChart3, FileText, Settings, Home, LogOut, MessageCircle, Truck } from "lucide-react";

interface NavItem {
  name: string;
  href: string;
  icon: ReactNode;
  label: string;
}

const navItems: NavItem[] = [
  {
    name: "Dashboard",
    href: "/admin/dashboard",
    icon: <Home className="h-5 w-5" />,
    label: "Overview",
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

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const isActive = (href: string) => {
    if (href === "/admin/dashboard") {
      return pathname === "/admin/dashboard" || pathname === "/admin";
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
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 md:hidden">
        <div className="flex items-center justify-between h-16 w-full px-0.5">
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center flex-1 h-full py-1 relative transition-colors ${
                  active
                    ? "text-lime-600"
                    : "text-gray-500 hover:text-gray-900"
                }`}
                title={item.label}
              >
                {/* Active indicator dot */}
                {active && (
                  <div className="absolute top-1 w-1 h-1 bg-lime-600 rounded-full" />
                )}

                {/* Icon - size optimized */}
                <div className="mb-0.5">
                  {item.icon}
                </div>

                {/* Label - very small on mobile */}
                <span className="text-[8px] font-semibold leading-none line-clamp-1 px-0.5">
                  {item.name}
                </span>
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
