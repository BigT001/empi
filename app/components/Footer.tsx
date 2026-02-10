"use client";

import Image from "next/image";
import Link from "next/link";
import { Mail, Phone, MapPin, Instagram } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

export function Footer() {
  const currentYear = new Date().getFullYear();
  const { theme } = useTheme();

  return (
    <footer className={`relative pt-16 md:pt-24 mt-20 overflow-hidden transition-colors duration-1000 ${theme === 'dark' ? 'bg-[#050505] text-slate-400' : 'bg-slate-900 text-slate-300'
      }`}>
      {/* Background Decorative Elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-lime-500/10 rounded-full -mr-48 -mt-48 blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-green-500/10 rounded-full -ml-48 -mb-48 blur-3xl pointer-events-none"></div>

      <div className="mx-auto max-w-7xl px-4 md:px-6 relative z-10">
        {/* Main Footer Grid */}
        <div className="grid gap-12 lg:grid-cols-4 mb-20">
          {/* Brand Info */}
          <div className="lg:col-span-1 space-y-6">
            <Link href="/" className="inline-flex items-center gap-3 group">
              <div className="relative">
                <Image
                  src="/logo/EMPI-2k24-LOGO-1.PNG"
                  alt="EMPI Logo"
                  width={50}
                  height={50}
                  className="rounded-xl shadow-xl transition-transform group-hover:scale-110 duration-500"
                />
                <div className="absolute -inset-1 bg-lime-500/20 rounded-xl blur-sm opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </div>
              <div>
                <span className="text-3xl font-black text-white tracking-tighter">EMPI</span>
                <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-lime-500">Costume Maker</p>
              </div>
            </Link>

            <p className="text-sm leading-relaxed text-slate-400 font-medium">
              Lagos&apos;s premier destination for premium costumes. We craft vision into reality, one costume at a time. Professional rentals and bespoke creation for every occasion.
            </p>

            <div className="flex items-center gap-4">
              <a
                href="https://www.instagram.com/empicostumes/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-lime-500 hover:text-slate-950 transition-all duration-300 group shadow-lg"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href="https://www.tiktok.com/@empicostumes"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-lime-500 hover:text-slate-950 transition-all duration-300 group shadow-lg"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-5 w-5 fill-current"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.17-2.89-.6-4.09-1.47-1.26-.93-2.15-2.32-2.39-3.84h-.05v10.2c0 .28-.03.55-.07.82-.2 1.39-1.04 2.7-2.24 3.47-1.2.77-2.77 1.05-4.14.73-1.37-.32-2.59-1.25-3.23-2.51-.64-1.26-.7-2.8-.16-4.1.54-1.29 1.65-2.34 2.99-2.76.54-.17 1.11-.25 1.68-.25.13 0 .26.01.39.02v4.03c-.15-.02-.3-.03-.45-.03-1.09 0-2.1.66-2.52 1.66-.42 1-.16 2.19.64 2.9.8.71 1.99.82 2.91.27.92-.55 1.39-1.63 1.15-2.66.02-.36.01-.72.01-1.08V.02z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Nav Links - Shop */}
          <div className="space-y-6">
            <h4 className="text-white font-bold uppercase tracking-[0.15em] text-xs">The Shop</h4>
            <ul className="space-y-4">
              <li>
                <Link href="/?category=adults" className="text-slate-400 hover:text-lime-400 transition flex items-center gap-2 group">
                  <span className="w-1 h-1 bg-slate-700 rounded-full group-hover:bg-lime-500 transition-colors"></span>
                  Adult Costumes
                </Link>
              </li>
              <li>
                <Link href="/?category=kids" className="text-slate-400 hover:text-lime-400 transition flex items-center gap-2 group">
                  <span className="w-1 h-1 bg-slate-700 rounded-full group-hover:bg-lime-500 transition-colors"></span>
                  Kids Costumes
                </Link>
              </li>
              <li>
                <Link href="/?category=custom" className="text-slate-400 hover:text-lime-400 transition flex items-center gap-2 group">
                  <span className="w-1 h-1 bg-slate-700 rounded-full group-hover:bg-lime-500 transition-colors"></span>
                  Bespoke Orders
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-slate-400 hover:text-lime-400 transition flex items-center gap-2 group">
                  <span className="w-1 h-1 bg-slate-700 rounded-full group-hover:bg-lime-500 transition-colors"></span>
                  My Story
                </Link>
              </li>
            </ul>
          </div>

          {/* Nav Links - Support Support */}
          <div className="space-y-6">
            <h4 className="text-white font-bold uppercase tracking-[0.15em] text-xs">Resources</h4>
            <ul className="space-y-4">
              <li>
                <Link href="/privacy" className="text-slate-400 hover:text-lime-400 transition flex items-center gap-2 group">
                  <span className="w-1 h-1 bg-slate-700 rounded-full group-hover:bg-lime-500 transition-colors"></span>
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-slate-400 hover:text-lime-400 transition flex items-center gap-2 group">
                  <span className="w-1 h-1 bg-slate-700 rounded-full group-hover:bg-lime-500 transition-colors"></span>
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/#product-grid" className="text-slate-400 hover:text-lime-400 transition flex items-center gap-2 group">
                  <span className="w-1 h-1 bg-slate-700 rounded-full group-hover:bg-lime-500 transition-colors"></span>
                  Help Center
                </Link>
              </li>
              <li>
                <Link href="/admin/login" className="text-slate-400 hover:text-lime-400 transition flex items-center gap-2 group">
                  <span className="w-1 h-1 bg-slate-700 rounded-full group-hover:bg-lime-500 transition-colors"></span>
                  Partner Login
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-6">
            <h4 className="text-white font-bold uppercase tracking-[0.15em] text-xs">Contact Us</h4>
            <div className="space-y-5">
              <div className="flex items-start gap-4 group">
                <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-lime-500 group-hover:bg-lime-500 group-hover:text-slate-950 transition-all duration-300 shadow-lg">
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-500 mb-1">Email Support</p>
                  <a href="mailto:empicostumes@gmail.com" className="text-slate-200 hover:text-lime-400 transition font-bold break-all">
                    empicostumes@gmail.com
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4 group">
                <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-lime-500 group-hover:bg-lime-500 group-hover:text-slate-950 transition-all duration-300 shadow-lg">
                  <Phone className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-500 mb-1">Call Center</p>
                  <a href="tel:+2348085779180" className="text-slate-200 hover:text-lime-400 transition font-bold">
                    +234 808 577 9180
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4 group">
                <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-lime-500 group-hover:bg-lime-500 group-hover:text-slate-950 transition-all duration-300 shadow-lg">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-500 mb-1">Studio Location</p>
                  <p className="text-slate-200 font-bold">Lagos, Nigeria</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className={`py-8 border-t flex flex-col md:flex-row justify-between items-center gap-6 transition-colors duration-1000 ${theme === 'dark' ? 'border-white/5' : 'border-slate-800'
          }`}>
          <p className="text-sm text-slate-500 font-medium text-center md:text-left">
            &copy; {currentYear} EMPI Premium Costumes. All rights reserved. <span className="hidden md:inline mx-2 text-slate-700">|</span> Made with ❤️ in Lagos.
          </p>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all duration-500">
              <span className="text-[10px] uppercase font-bold text-slate-600">Secure Payments via</span>
              <div className="flex gap-2">
                <div className="h-6 w-12 bg-slate-800 rounded flex items-center justify-center text-[8px] font-black text-white">VISA</div>
                <div className="h-6 w-12 bg-slate-800 rounded flex items-center justify-center text-[8px] font-black text-white">MSTC</div>
                <div className="h-6 w-12 bg-slate-800 rounded flex items-center justify-center text-[8px] font-black text-white">PAYSTK</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
