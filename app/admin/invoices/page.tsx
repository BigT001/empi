"use client";

import { useEffect, useState } from "react";
import { Footer } from "../../components/Footer";
import { ManualInvoiceGenerator } from "./ManualInvoiceGenerator";
import { SavedInvoices } from "./SavedInvoices";
import { useResponsive } from "@/app/hooks/useResponsive";

export default function AdminInvoicesPage() {
  const { mounted } = useResponsive();
  const [activeTab, setActiveTab] = useState<"manual" | "saved">("saved");
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  if (!mounted || !isHydrated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 text-gray-900 flex flex-col">
      <main className="flex-1 max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8 w-full">
        {/* Page Header */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">Invoice Management</h1>
          
          {/* Tab Navigation */}
          <div className="flex gap-2 border-b border-gray-200 overflow-x-auto">
            <button
              onClick={() => setActiveTab("manual")}
              className={`px-4 py-3 font-semibold transition-colors border-b-2 whitespace-nowrap ${
                activeTab === "manual"
                  ? "border-blue-600 text-blue-600 bg-blue-50"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              Generate Invoice
            </button>
            <button
              onClick={() => setActiveTab("saved")}
              className={`px-4 py-3 font-semibold transition-colors border-b-2 whitespace-nowrap ${
                activeTab === "saved"
                  ? "border-purple-600 text-purple-600 bg-purple-50"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              Invoice
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="animate-fadeIn">
          {activeTab === "manual" && <ManualInvoiceGenerator />}
          {activeTab === "saved" && <SavedInvoices />}
        </div>
      </main>

      <Footer />
    </div>
  );
}

