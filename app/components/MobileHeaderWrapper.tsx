"use client";

import { usePathname } from "next/navigation";
import { MobileHeader } from "./MobileHeader";

export function MobileHeaderWrapper() {
  const pathname = usePathname();
  
  // Don't show header on auth or admin pages
  if (pathname.includes("admin") || pathname.includes("auth")) {
    return null;
  }
  
  return <MobileHeader />;
}
