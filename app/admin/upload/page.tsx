"use client";

import { useEffect, useState } from "react";
import MobileAdminUpload from "../mobile-upload";
import MobileAdminLayout from "../mobile-layout";

export default function AdminUploadPage() {
  const [isMobile, setIsMobile] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  if (!isMounted) {
    return null;
  }

  // Show mobile layout on mobile devices
  if (isMobile) {
    return (
      <MobileAdminLayout>
        <MobileAdminUpload />
      </MobileAdminLayout>
    );
  }

  // Show desktop version (MobileAdminUpload is responsive and works on desktop too)
  return (
    <div className="flex-1">
      <MobileAdminUpload />
    </div>
  );
}
