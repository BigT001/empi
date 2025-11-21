"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
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

  if (!isMobile) {
    return null;
  }

  return (
    <MobileAdminLayout>
      <MobileAdminUpload />
    </MobileAdminLayout>
  );
}
