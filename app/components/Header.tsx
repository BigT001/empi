"use client";

import Image from "next/image";
import Link from "next/link";

export function Header() {
  return (
    <Link href="/" className="inline-flex items-center gap-2 flex-shrink-0">
      <Image
        src="/logo/EMPI-2k24-LOGO-1.PNG"
        alt="EMPI Logo"
        width={80}
        height={80}
        className="rounded-lg"
      />
    </Link>
  );
}
