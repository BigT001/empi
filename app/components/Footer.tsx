"use client";

import Image from "next/image";
import Link from "next/link";
import { Mail, Phone, Instagram, MapPin } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

export function Footer() {
  const currentYear = new Date().getFullYear();
  const { theme } = useTheme();

  return (
    <footer className={`relative pt-20 pb-10 border-t transition-colors duration-500 ${theme === 'dark' ? 'bg-[#050505] text-slate-500 border-white/5' : 'bg-white text-slate-400 border-slate-100'
      }`}>
      {/* Footer Container with Desktop Padding */}
      <div className="mx-auto max-w-6xl px-8 lg:px-24">

        {/* Main Content Area */}
        <div className="flex flex-col lg:flex-row justify-between items-start gap-12 lg:gap-20 mb-16">

          {/* Brand Column - Centered on Mobile */}
          <div className="w-full lg:w-auto space-y-8 flex flex-col items-center lg:items-start text-center lg:text-left">
            <div className="space-y-4">
              <Image
                src="/logo/EMPI-2k24-LOGO-1.PNG"
                alt="EMPI Logo"
                width={120}
                height={120}
                className="opacity-95 mx-auto lg:mx-0 dark:invert transition-transform hover:scale-105"
              />
              <p className="text-sm font-bold leading-relaxed max-w-[280px] lg:max-w-xs text-slate-900 dark:text-slate-300">
                Premium costume design and elite rentals in Lagos. Crafted with artistry for visionaries.
              </p>
            </div>

            {/* Social Media - Very Visible & Colored */}
            <div className="flex items-center gap-6">
              <a
                href="https://www.instagram.com/empicostumes/"
                target="_blank"
                rel="noopener noreferrer"
                className="group relative flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] text-white shadow-lg hover:scale-110 transition-transform duration-300"
              >
                <Instagram className="w-6 h-6" />
                <span className="absolute -bottom-6 text-[10px] font-black uppercase tracking-tighter opacity-0 group-hover:opacity-100 transition-opacity">Instagram</span>
              </a>

              <a
                href="https://www.tiktok.com/@empicostumes"
                target="_blank"
                rel="noopener noreferrer"
                className="group relative flex items-center justify-center w-12 h-12 rounded-2xl bg-black text-white shadow-lg hover:scale-110 transition-transform duration-300 border-2 border-transparent hover:border-cyan-400/50"
              >
                <div className="relative">
                  <TiktokIcon />
                  {/* Cyan/Pink Glow Effect for TikTok */}
                  <div className="absolute inset-0 blur-[2px] opacity-50 group-hover:opacity-100 transition-opacity">
                    <TiktokIcon />
                  </div>
                </div>
                <span className="absolute -bottom-6 text-[10px] font-black uppercase tracking-tighter opacity-0 group-hover:opacity-100 transition-opacity">TikTok</span>
              </a>
            </div>
          </div>

          {/* Links Area - Side by Side on Mobile with separator */}
          <div className="w-full lg:flex-1 grid grid-cols-2 lg:grid-cols-2 gap-0 lg:gap-16 pt-8 lg:pt-0 border-t lg:border-t-0 border-slate-100 dark:border-white/5">

            {/* Legal Links (Left) */}
            <div className="space-y-6 pr-4 lg:pr-0">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-lime-600 dark:text-lime-500">Governance</h4>
              <ul className="space-y-4 text-sm font-bold text-slate-900 dark:text-white">
                <li><Link href="/privacy" className="hover:text-lime-600 transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-lime-600 transition-colors">Terms of Service</Link></li>
                <li><Link href="/about" className="hover:text-lime-600 transition-colors">About EMPI</Link></li>
              </ul>
            </div>

            {/* Contact Details (Right) with Line Separator on Mobile */}
            <div className="space-y-6 pl-8 lg:pl-0 border-l lg:border-l-0 border-slate-100 dark:border-white/5">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-lime-600 dark:text-lime-500">Support</h4>
              <div className="space-y-4 text-xs font-bold text-slate-900 dark:text-white">
                <a href="mailto:empicostumes@gmail.com" className="flex items-center gap-2 hover:text-lime-600 transition-colors group">
                  <Mail className="w-3.5 h-3.5 text-slate-400 group-hover:text-lime-500 flex-shrink-0" />
                  <span className="break-all">empicostumes@gmail.com</span>
                </a>
                <a href="tel:+2348085779180" className="flex items-center gap-2 hover:text-lime-600 transition-colors group">
                  <Phone className="w-3.5 h-3.5 text-slate-400 group-hover:text-lime-500 flex-shrink-0" />
                  <span>+234 808 577 9180</span>
                </a>
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-white/5 mt-2">
                  <MapPin className="w-3.5 h-3.5 opacity-50 flex-shrink-0" />
                  <span className="text-[10px] uppercase tracking-wider">Lagos, Nigeria</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Bottom Bar - Centered Content */}
        <div className="pt-12 border-t border-slate-100 dark:border-white/5 flex flex-col lg:flex-row justify-between items-center gap-8">
          <div className="flex flex-col items-center lg:items-start gap-2">
            <div className="text-[10px] font-black tracking-[0.3em] uppercase text-slate-900 dark:text-white opacity-80">
              &copy; {currentYear} EMPI COSTUMES
            </div>
            <div className="flex items-center gap-4 text-[9px] uppercase tracking-widest text-slate-400 font-bold">
              <span>Secure Payments via Paystack</span>
              <span className="w-1 h-1 rounded-full bg-slate-300" />
              <span>Worldwide Shipping</span>
            </div>
          </div>

          <div className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-white/5 text-[11px] lg:text-xs">
            <span className="font-bold text-slate-400 uppercase tracking-widest">Built with passion by</span>
            <a
              href="mailto:info.samuelstanley@gmail.com"
              className="font-black text-slate-900 dark:text-white hover:text-lime-500 transition-all flex items-center gap-1.5 group"
            >
              Samuel Stanley
              <div className="w-1.5 h-1.5 rounded-full bg-lime-500 group-hover:animate-ping" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

function TiktokIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-6 w-6 fill-current"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Cyan/Pink Shadow Effect integrated in SVG paths if needed, but we use CSS blur instead */}
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.17-2.89-.6-4.09-1.47-1.26-.93-2.15-2.32-2.39-3.84h-.05v10.2c0 .28-.03.55-.07.82-.2 1.39-1.04 2.7-2.24 3.47-1.2.77-2.77 1.05-4.14.73-1.37-.32-2.59-1.25-3.23-2.51-.64-1.26-.7-2.8-.16-4.1.54-1.29 1.65-2.34 2.99-2.76.54-.17 1.11-.25 1.68-.25.13 0 .26.01.39.02v4.03c-.15-.02-.3-.03-.45-.03-1.09 0-2.1.66-2.52 1.66-.42 1-.16 2.19.64 2.9.8.71 1.99.82 2.91.27.92-.55 1.39-1.63 1.15-2.66.02-.36.01-.72.01-1.08V.02z" />
    </svg>
  );
}
