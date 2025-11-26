"use client";

import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { AuthForm } from "../components/AuthForm";

export default function AuthPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-lime-50 via-white to-gray-50 text-gray-900 flex flex-col">
      <header className="border-b border-gray-200 sticky top-0 z-40 bg-white shadow-sm">
        <div className="mx-auto w-full px-2 md:px-6 py-2 md:py-4 flex items-center justify-between">
          <Header />
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <AuthForm />
        </div>
      </main>

      <Footer />
    </div>
  );
}
