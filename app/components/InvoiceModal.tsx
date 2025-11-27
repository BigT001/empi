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

  useEffect(() => {
    if (invoice && mounted) {
      // Calculate actual scrollbar width
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      const originalOverflow = document.documentElement.style.overflow;
      const originalPaddingRight = document.documentElement.style.paddingRight;
      
      document.documentElement.style.overflow = 'hidden';
      if (scrollbarWidth > 0) {
        document.documentElement.style.paddingRight = `${scrollbarWidth}px`;
      }
      
      return () => {
        document.documentElement.style.overflow = originalOverflow;
        document.documentElement.style.paddingRight = originalPaddingRight;
      };
    }
  }, [invoice, mounted]);

  if (!mounted || !invoice) return null;

  return (
    <>
      {/* Backdrop - White with transparency */}
      <div 
        className="fixed inset-0 bg-white z-[9998]"
        onClick={onClose}
      ></div>
      
      {/* Modal */}
      <div 
        className="fixed inset-0 z-[9999] flex items-center justify-center p-2 md:p-4 pointer-events-none overflow-y-auto"
      >
        <div 
          className="bg-white rounded-2xl md:rounded-3xl shadow-2xl w-full max-w-5xl my-8 pointer-events-auto flex flex-col"
          onClick={(e) => e.stopPropagation()}
          style={{ maxHeight: "90vh" }}
        >
          {/* CLOSE BUTTON */}
          <div className="sticky top-0 right-0 p-4 flex justify-end bg-white rounded-t-2xl md:rounded-t-3xl border-b border-gray-200 z-10 flex-shrink-0">
            <button
              onClick={onClose}
              className="text-gray-600 hover:text-gray-900 p-2 rounded-full hover:bg-gray-100 transition"
              title="Close"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          
          {/* PROFESSIONAL INVOICE CONTENT */}
          <div className="p-4 md:p-8 overflow-y-auto flex-1" dangerouslySetInnerHTML={{ __html: generateProfessionalInvoiceHTML(invoice) }} />
        </div>
      </div>
    </>
  );
}
