"use client";

import Image from "next/image";
import Link from "next/link";
import { Mail, Phone, MapPin, Instagram } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-gray-200 bg-white mt-16 md:mt-20 pb-0">
      <div className="mx-auto max-w-7xl px-4 md:px-6 py-6 md:py-12 pb-0">
        {/* Brand Section - Mobile Only */}
        <div className="md:hidden mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Image
              src="/logo/EMPI-2k24-LOGO-1.PNG"
              alt="EMPI Logo"
              width={40}
              height={40}
              className="rounded-lg shadow-md"
            />
            <div>
              <span className="text-xl font-black bg-gradient-to-r from-lime-600 to-green-600 bg-clip-text text-transparent">EMPI</span>
              <p className="text-xs text-gray-600 font-medium">Premium Costumes</p>
            </div>
          </div>
          <p className="text-xs text-gray-700 mb-4 leading-relaxed">
            Lagos's premier destination for premium costumes. Rent or buy quality costumes for every occasion.
          </p>
          
          <a 
            href="https://www.instagram.com/empicostumes/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-lime-600 to-green-600 hover:from-lime-700 hover:to-green-700 text-white font-semibold rounded-lg transition text-sm"
          >
            <Instagram className="h-4 w-4" />
            Follow Instagram
          </a>
        </div>

        {/* Main Footer Grid - 2 Columns on Mobile, 3 Columns on Desktop */}
        <div className="grid gap-6 md:gap-12 grid-cols-2 md:grid-cols-3 mb-8 md:mb-12">
          {/* Brand Section - Desktop Only */}
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
            <h6 className="font-bold text-gray-900 mb-3 text-xs uppercase tracking-wider md:mb-5">Quick Links</h6>
            <ul className="space-y-2 md:space-y-3 text-xs md:text-sm">
              <li>
                <Link href="/?category=adults" className="text-gray-700 hover:text-lime-600 transition font-medium">
                  Adult Costumes
                </Link>
              </li>
              <li>
                <Link href="/?category=kids" className="text-gray-700 hover:text-lime-600 transition font-medium">
                  Kids Costumes
                </Link>
              </li>
              <li>
                <Link href="/?category=custom" className="text-gray-700 hover:text-lime-600 transition font-medium">
                  Custom Orders
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Section */}
          <div>
            <h6 className="font-bold text-gray-900 mb-3 text-xs uppercase tracking-wider md:mb-5">Contact Us</h6>
            <div className="space-y-3 text-xs md:text-sm">
              <div className="flex items-start gap-2 md:gap-3">
                <Mail className="h-4 w-4 md:h-5 md:w-5 text-lime-600 flex-shrink-0 mt-0.5" />
                <a href="mailto:support@empicostumes.com" className="text-gray-700 hover:text-lime-600 transition font-medium break-all">
                  support@empicostumes.com
                </a>
              </div>
              <div className="flex items-start gap-2 md:gap-3">
                <Phone className="h-4 w-4 md:h-5 md:w-5 text-lime-600 flex-shrink-0 mt-0.5" />
                <a href="tel:+2348085779180" className="text-gray-700 hover:text-lime-600 transition font-medium">
                  +234 808 577 9180
                </a>
              </div>
              <div className="flex items-start gap-2 md:gap-3">
                <MapPin className="h-4 w-4 md:h-5 md:w-5 text-lime-600 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700 font-medium">Lagos, Nigeria</span>
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200 my-6 md:my-8"></div>

        {/* Bottom Footer */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3 md:gap-4 text-center md:text-left py-4 md:py-6 border-t border-gray-200 m-0 p-0">
          {/* Copyright */}
          <p className="text-xs md:text-sm text-gray-600 font-medium m-0">
            © {currentYear} EMPI Costumes. All rights reserved. | Proudly serving Lagos, Nigeria.
          </p>
          
          {/* Policy Links */}
          <div className="flex gap-3 md:gap-4 text-xs md:text-sm justify-center md:justify-end m-0">
            <a href="#" className="text-gray-600 hover:text-lime-600 transition font-medium">Privacy Policy</a>
            <a href="#" className="text-gray-600 hover:text-lime-600 transition font-medium">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
