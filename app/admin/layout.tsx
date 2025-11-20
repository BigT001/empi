"use client";

import { SidebarProvider } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/app/components/AdminSidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <div className="flex w-full h-screen overflow-hidden">
        <AdminSidebar />
        <main className="flex-1 w-full overflow-auto bg-gray-50">
          <div className="w-full h-full">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
