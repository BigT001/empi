"use client";

import { ReactNode, useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Plus, Image as ImageIcon, BarChart3, FileText, Settings, Home, LogOut } from "lucide-react";

interface NavItem {
  name: string;
  href: string;
  icon: ReactNode;
  label: string;
}

const navItems: NavItem[] = [
  {
    name: "Upload",
    href: "/admin",
    icon: <Plus className="h-6 w-6" />,
    label: "Add Product",
  },
  {
    name: "Products",
    href: "/admin/products",
    icon: <ImageIcon className="h-6 w-6" />,
    label: "View Products",
  },
  {
    name: "Finance",
    href: "/admin/finance",
    icon: <BarChart3 className="h-6 w-6" />,
    label: "Analytics",
  },
  {
    name: "Invoices",
    href: "/admin/invoices",
    icon: <FileText className="h-6 w-6" />,
    label: "Invoices",
  },
  {
    name: "Settings",
    href: "/admin/settings",
    icon: <Settings className="h-6 w-6" />,
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
    if (href === "/admin") {
      return pathname === "/admin";
    }
    return pathname.startsWith(href);
  };

  if (!isMounted) return null;

  return (
    <div className="flex flex-col h-screen bg-white overflow-hidden md:hidden">
      {/* Mobile Header */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <Link href="/admin" className="flex items-center">
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
      <main className="flex-1 overflow-y-auto pb-20">
        <div className="w-full">
          {children}
        </div>
      </main>

      {/* Bottom Navigation Bar - Instagram Style */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 md:hidden">
        <div className="flex justify-around items-center h-20">
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center w-full h-full py-2 px-1 relative transition-all ${
                  active
                    ? "text-lime-600"
                    : "text-gray-600 hover:text-gray-900"
                }`}
                title={item.label}
              >
                {/* Active indicator dot */}
                {active && (
                  <div className="absolute top-1 w-2 h-2 bg-lime-600 rounded-full" />
                )}

                {/* Icon */}
                <div className={`transition-transform ${active ? "scale-110" : ""}`}>
                  {item.icon}
                </div>

                {/* Label - very small on mobile */}
                <span className="text-xs font-medium mt-0.5 line-clamp-1">
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
