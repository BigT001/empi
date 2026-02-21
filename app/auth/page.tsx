"use client";

import { AuthForm } from "../components/AuthForm";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Sparkles } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

export default function AuthPage() {
  const { theme } = useTheme();

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-gray-100 flex flex-col md:flex-row transition-colors duration-1000 overflow-hidden">
      {/* Left Side: Auth Form */}
      <div className="flex-1 flex flex-col relative z-20 bg-white dark:bg-[#0a0a0a]">
        {/* Back Button */}
        <div className="p-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-lime-600 hover:text-lime-700 font-bold transition text-xs uppercase tracking-widest"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Home
          </Link>
        </div>

        <main className="flex-1 flex items-center justify-center px-6 pb-12 lg:px-20">
          <div className="w-full max-w-md">
            <AuthForm />
          </div>
        </main>
      </div>

      {/* Right Side: Premium Branding (Desktop/Tablet Only) */}
      <div className="hidden lg:flex flex-1 relative items-center justify-center overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/empiimages/IMG_0793.JPG"
            alt="EMPI Artisan Craftsmanship"
            fill
            className="object-cover opacity-90"
            priority
          />
          {/* Gradients for elite feel */}
          <div className="absolute inset-0 bg-gradient-to-r from-white dark:from-[#0a0a0a] via-transparent to-transparent z-10" />
          <div className="absolute inset-0 bg-black/40 z-10" />
        </div>

        {/* Branding Content */}
        <div className="relative z-20 px-20 text-white max-w-2xl">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-lime-400 text-[10px] font-black uppercase tracking-[0.3em] mb-8">
            <Sparkles className="w-4 h-4 animate-pulse" />
            Lagos's Premier Costume Maker
          </div>

          <h2 className="text-6xl font-black leading-tight mb-8 font-playfair tracking-tight">
            Vision <br />
            <span className="italic text-transparent bg-clip-text bg-gradient-to-r from-lime-400 to-lime-600">
              Unfolded.
            </span>
          </h2>

          <p className="text-lg text-gray-200 leading-relaxed font-medium">
            Join the EMPI community to track your bespoke orders, save your favorite designs, and access professional costume rentals with ease.
          </p>

          <div className="mt-12 pt-12 border-t border-white/10 grid grid-cols-2 gap-8">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-lime-400 mb-2">Bespoke Design</p>
              <p className="text-xs text-gray-300 font-bold uppercase tracking-widest leading-relaxed">Artisan quality tailoring tailored to you.</p>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-lime-400 mb-2">Elite Rentals</p>
              <p className="text-xs text-gray-300 font-bold uppercase tracking-widest leading-relaxed">Premium costume units for every event.</p>
            </div>
          </div>
        </div>

        {/* Floating Decals */}
        <div className="absolute top-10 right-10 w-32 h-32 bg-lime-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-10 left-10 w-64 h-64 bg-lime-500/5 rounded-full blur-[100px] animate-pulse" />
      </div>
    </div>
  );
}
