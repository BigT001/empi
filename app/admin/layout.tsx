"use client";

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
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
        <SidebarInset className="flex-1 w-full overflow-hidden">
          <main className="w-full h-full overflow-auto bg-gray-50">
            <div className="w-full h-full">
              {children}
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
