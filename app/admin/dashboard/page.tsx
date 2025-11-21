"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import MobileAdminDashboard from "../mobile-dashboard";
import MobileAdminLayout from "../mobile-layout";

export default function AdminDashboardPage() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  if (!isMobile) {
    return null;
  }

  return (
    <MobileAdminLayout>
      <MobileAdminDashboard />
    </MobileAdminLayout>
  );
}
