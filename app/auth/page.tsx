"use client";

import { Footer } from "../components/Footer";
import { AuthForm } from "../components/AuthForm";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function AuthPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-lime-50 via-white to-gray-50 text-gray-900 flex flex-col">
      {/* Back Button - Top Left */}
      <Link 
        href="/" 
        className="inline-flex items-center gap-2 text-lime-600 hover:text-lime-700 font-semibold m-6 transition text-sm"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Home
      </Link>

      <main className="flex-1 flex items-center justify-center px-4 pb-12">
        <AuthForm />
      </main>

      <Footer />
    </div>
  );
}
