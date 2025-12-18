"use client";

import Image from "next/image";
import Link from "next/link";
import { Mail, Phone, MapPin, Instagram } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-gray-200 bg-gradient-to-b from-gray-50 to-white mt-20">
      <div className="mx-auto max-w-7xl px-4 md:px-6 py-12 md:py-16">
        {/* Brand Section - Full Width on Mobile, Part of Grid on Desktop */}
        <div className="mb-8 md:mb-0 md:hidden">
          <div className="flex items-center gap-3 mb-4">
            <Image
              src="/logo/EMPI-2k24-LOGO-1.PNG"
              alt="EMPI Logo"
              width={45}
              height={45}
              className="rounded-lg shadow-md"
            />
            <div>
              <span className="text-2xl font-black bg-gradient-to-r from-lime-600 to-green-600 bg-clip-text text-transparent">EMPI</span>
              <p className="text-xs text-gray-600 font-medium">Premium Costumes</p>
            </div>
          </div>
          <p className="text-sm text-gray-700 mb-6 leading-relaxed">
            Lagos's premier destination for premium costumes. Rent or buy quality costumes for every occasion.
          </p>
          
          {/* Instagram Link */}
          <a 
            href="https://www.instagram.com/empicostumes/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-lime-600 to-green-600 hover:from-lime-700 hover:to-green-700 text-white font-semibold rounded-lg transition transform hover:scale-105 shadow-md"
          >
            <Instagram className="h-5 w-5" />
            Follow on Instagram
          </a>
        </div>

        {/* Main Footer Grid - 2 Columns on Mobile, 3 Columns on Desktop */}
        <div className="grid gap-8 md:gap-12 grid-cols-2 md:grid-cols-3 mb-12">
          {/* Brand Section - Hidden on Mobile, Shows on Desktop */}
          <div className="hidden md:block">
            <div className="flex items-center gap-3 mb-4">
              <Image
                src="/logo/EMPI-2k24-LOGO-1.PNG"
                alt="EMPI Logo"
                width={45}
                height={45}
                className="rounded-lg shadow-md"
              />
              <div>
                <span className="text-2xl font-black bg-gradient-to-r from-lime-600 to-green-600 bg-clip-text text-transparent">EMPI</span>
                <p className="text-xs text-gray-600 font-medium">Premium Costumes</p>
              </div>
            </div>
            <p className="text-sm text-gray-700 mb-6 leading-relaxed">
              Lagos's premier destination for premium costumes. Rent or buy quality costumes for every occasion.
            </p>
            
            {/* Instagram Link */}
            <a 
              href="https://www.instagram.com/empicostumes/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-lime-600 to-green-600 hover:from-lime-700 hover:to-green-700 text-white font-semibold rounded-lg transition transform hover:scale-105 shadow-md"
            >
              <Instagram className="h-5 w-5" />
              Follow on Instagram
            </a>
          </div>

          {/* Quick Navigation */}
          <div>
            <h6 className="font-bold text-gray-900 mb-5 text-sm uppercase tracking-wider">Quick Links</h6>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/?category=adults" className="text-gray-700 hover:text-lime-600 transition font-medium flex items-center gap-2">
                  <span>👔</span> Adult Costumes
                </Link>
              </li>
              <li>
                <Link href="/?category=kids" className="text-gray-700 hover:text-lime-600 transition font-medium flex items-center gap-2">
                  <span>👶</span> Kids Costumes
                </Link>
              </li>
              <li>
                <Link href="/?category=custom" className="text-gray-700 hover:text-lime-600 transition font-medium flex items-center gap-2">
                  <span>✨</span> Custom Orders
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Section */}
          <div>
            <h6 className="font-bold text-gray-900 mb-5 text-sm uppercase tracking-wider">Contact Us</h6>
            <div className="space-y-4 text-sm">
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-lime-600 flex-shrink-0 mt-0.5" />
                <a href="mailto:support@empi.ng" className="text-gray-700 hover:text-lime-600 transition font-medium">
                  support@empi.ng
                </a>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-lime-600 flex-shrink-0 mt-0.5" />
                <a href="tel:+2348012345678" className="text-gray-700 hover:text-lime-600 transition font-medium">
                  +234 801 234 5678
                </a>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-lime-600 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700 font-medium">Lagos, Nigeria</span>
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200 my-8"></div>

        {/* Bottom Footer */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-6 text-center md:text-left">
          {/* Copyright */}
          <p className="text-sm text-gray-600 font-medium">
            © {currentYear} EMPI Costumes. All rights reserved. | Proudly serving Lagos, Nigeria.
          </p>
          
          {/* Policy Links */}
          <div className="flex gap-6 text-sm justify-center md:justify-end">
            <a href="#" className="text-gray-600 hover:text-lime-600 transition font-medium">Privacy Policy</a>
            <a href="#" className="text-gray-600 hover:text-lime-600 transition font-medium">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
