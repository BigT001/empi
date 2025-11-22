"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useAdmin } from "@/app/context/AdminContext";

// Mobile components
const MobileAdminLayout = dynamic(() => import("./mobile-layout"), { ssr: false });
const MobileAdminUpload = dynamic(() => import("./mobile-upload"), { ssr: false });

export default function AdminPage() {
  const [isMobile, setIsMobile] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();
  const { admin, isLoading } = useAdmin();

  // Check if user is authenticated
  useEffect(() => {
    if (!isLoading && !admin) {
      router.push("/admin/login");
    }
  }, [admin, isLoading, router]);

  // Detect device size and redirect desktop to dashboard
  useEffect(() => {
    setIsMounted(true);
    const checkDevice = () => {
      const isMobileDevice = window.innerWidth < 768;
      setIsMobile(isMobileDevice);
      if (!isMobileDevice) {
        router.push("/admin/dashboard");
      }
    };

    checkDevice();
    window.addEventListener("resize", checkDevice);
    return () => window.removeEventListener("resize", checkDevice);
  }, [router]);

  if (!isMounted || isLoading || !admin) return null;

  if (isMobile) {
    return (
      <MobileAdminLayout>
        <MobileAdminUpload />
      </MobileAdminLayout>
    );
  }

  // Return null if redirecting to dashboard (desktop)
  return null;
}
