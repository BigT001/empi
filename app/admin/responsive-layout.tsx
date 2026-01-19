"use client";

import { ReactNode } from "react";
import { AdminSidebar } from "@/app/components/AdminSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";

/**
 * Responsive Admin Layout Component
 * 
 * This is the ONLY layout wrapper needed for admin pages.
 * It works responsively across all screen sizes:
 * - Desktop (>=1024px): Full sidebar + content
 * - Tablet (768px-1024px): Collapsible sidebar + content
 * - Mobile (<768px): Hamburger menu + full-width content
 * 
 * All responsive behavior is handled by:
 * 1. Shadcn Sidebar component (built-in responsive)
 * 2. Tailwind CSS responsive classes
 * 3. No custom mobile/desktop duplicate code needed
 */

export function ResponsiveAdminLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex w-full min-h-screen bg-gray-50">
        {/* Sidebar - automatically responsive via Shadcn */}
        <AdminSidebar />
        
        {/* Main Content - responsive padding based on sidebar state */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}
