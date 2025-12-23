"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { StoredInvoice } from "@/lib/invoiceStorage";
import { generateProfessionalInvoiceHTML } from "@/lib/professionalInvoice";

interface InvoiceModalProps {
  invoice: StoredInvoice | null;
  onClose: () => void;
}

export function InvoiceModal({ invoice, onClose }: InvoiceModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted || !invoice) return null;

  return (
    <>
      {/* Backdrop - Blur background */}
      <div 
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9998]"
        onClick={onClose}
      ></div>
      
      {/* Modal - No scroll lock, just display modal */}
      <div 
        className="fixed inset-0 z-[9999] flex items-center justify-center p-2 md:p-4 pointer-events-none"
      >
        <div 
          className="bg-white rounded-2xl md:rounded-3xl shadow-2xl w-full max-w-5xl my-8 pointer-events-auto flex flex-col max-h-[90vh] relative"
          onClick={(e) => e.stopPropagation()}
        >
          {/* CLOSE BUTTON - Positioned on card */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-600 hover:text-gray-900 p-2 rounded-full hover:bg-gray-100 transition z-20"
            title="Close"
          >
            <X className="h-6 w-6" />
          </button>
          
          {/* PROFESSIONAL INVOICE CONTENT - Scrollable */}
          <div className="p-4 md:p-8 overflow-y-auto flex-1" dangerouslySetInnerHTML={{ __html: generateProfessionalInvoiceHTML(invoice) }} />
        </div>
      </div>
    </>
  );
}
