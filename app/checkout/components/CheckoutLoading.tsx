"use client";

import { Footer } from "@/app/components/Footer";

export function CheckoutLoading() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-gray-200 sticky top-0 z-40 bg-white shadow-sm">
        <div className="mx-auto w-full px-2 md:px-6 py-2 md:py-4">
          <h1 className="text-2xl font-bold text-gray-900">⏳ Loading Quote...</h1>
        </div>
      </header>
      <main className="flex-1 max-w-4xl mx-auto px-4 py-12 w-full">
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lime-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading quote details...</p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
