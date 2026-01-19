"use client";

import { useEffect, useState } from "react";
import { useResponsive } from "@/app/hooks/useResponsive";
import MobileAdminUpload from "../mobile-upload";

export default function AdminUploadPage() {
  const { mounted } = useResponsive();

  if (!mounted) {
    return null;
  }

  // Show responsive version
  return (
    <div className="flex-1">
      <MobileAdminUpload />
    </div>
  );
}
