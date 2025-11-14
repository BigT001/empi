"use client";

import Image from "next/image";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-gray-900 text-gray-100 mt-16">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid gap-8 md:grid-cols-4 mb-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Image
                src="/logo/EMPI-2k24-LOGO-1.PNG"
                alt="EMPI Logo"
                width={32}
                height={32}
                className="rounded-lg"
              />
              <span className="text-lg font-bold">EMPI</span>
            </div>
            <p className="text-sm text-gray-400">Handcrafted costumes since 2025. Premium quality, exceptional service.</p>
          </div>

          {/* Shop */}
          <div>
            <h6 className="font-semibold text-white mb-4">Shop</h6>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link href="/products" className="hover:text-lime-400 transition">All Products</Link></li>
              <li><Link href="/collections" className="hover:text-lime-400 transition">Collections</Link></li>
              <li><Link href="/new" className="hover:text-lime-400 transition">New Arrivals</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h6 className="font-semibold text-white mb-4">Support</h6>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link href="/contact" className="hover:text-lime-400 transition">Contact Us</Link></li>
              <li><Link href="/shipping" className="hover:text-lime-400 transition">Shipping Info</Link></li>
              <li><Link href="/returns" className="hover:text-lime-400 transition">Returns</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h6 className="font-semibold text-white mb-4">Company</h6>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link href="/about" className="hover:text-lime-400 transition">About Us</Link></li>
              <li><Link href="/blog" className="hover:text-lime-400 transition">Blog</Link></li>
              <li><Link href="/careers" className="hover:text-lime-400 transition">Careers</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <p className="text-sm text-gray-400">© {new Date().getFullYear()} EMPI Costumes. All rights reserved.</p>
          <div className="flex gap-6 text-sm text-gray-400">
            <Link href="/privacy" className="hover:text-lime-400 transition">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-lime-400 transition">Terms of Service</Link>
            <Link href="/cookies" className="hover:text-lime-400 transition">Cookie Settings</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
