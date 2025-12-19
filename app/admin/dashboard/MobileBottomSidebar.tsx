"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Home, Plus, BarChart3, FileText, Settings, MessageCircle, Truck } from "lucide-react";

interface SidebarItem {
  name: string;
  href: string;
  icon: React.ReactNode;
}

const sidebarItems: SidebarItem[] = [
  {
    name: "Dashboard",
    href: "/admin/dashboard",
    icon: <Home className="h-5 w-5" />,
  },
  {
    name: "Add",
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

export function MobileBottomSidebar() {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  const isActive = (href: string) => {
    if (href === "/admin") {
      return pathname === "/admin";
    }
    return pathname.startsWith(href);
  };

  useEffect(() => {
    // Find the scrollable container (main element)
    const mainElement = document.querySelector('main');
    if (!mainElement) return;

    const handleScroll = () => {
      const currentScrollY = mainElement.scrollTop;
      
      // Show navbar when scrolling up or at top
      if (currentScrollY < lastScrollY || currentScrollY < 50) {
        setIsVisible(true);
      }
      // Hide navbar when scrolling down past 50px
      else if (currentScrollY > lastScrollY && currentScrollY > 50) {
        setIsVisible(false);
      }
      
      setLastScrollY(currentScrollY);
    };

    mainElement.addEventListener('scroll', handleScroll);
    return () => mainElement.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  return (
    <div className={`fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden z-50 transition-transform duration-300 ease-in-out ${
      isVisible ? 'translate-y-0' : 'translate-y-full'
    }`}>
      <div className="flex items-center justify-between px-0.5 h-16 overflow-x-auto">
        {sidebarItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-center flex-1 h-full py-1 relative transition-colors min-w-max ${
              isActive(item.href)
                ? 'text-lime-600'
                : 'text-gray-500 hover:text-gray-900'
            }`}
            title={item.name}
          >
            {/* Active indicator dot */}
            {isActive(item.href) && (
              <div className="absolute top-1 w-1 h-1 bg-lime-600 rounded-full" />
            )}
            
            {/* Icon */}
            <div className="mb-0.5">
              {item.icon}
            </div>
            
            {/* Label - very small text */}
            <span className="text-[8px] font-semibold leading-none line-clamp-1 px-0.5">
              {item.name}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
