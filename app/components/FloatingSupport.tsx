"use client";

import { useState } from "react";
import { MessageCircle, Mail, Phone, Instagram } from "lucide-react";

export function FloatingSupport() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Support Button with Label */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-2">
        {/* Contacts Label */}
        <div className="bg-gray-900 text-white px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap shadow-lg">
          Contacts
        </div>
        
        {/* Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-14 h-14 rounded-full bg-gradient-to-br from-lime-600 to-green-600 hover:from-lime-700 hover:to-green-700 text-white shadow-lg hover:shadow-2xl transition-all duration-300 flex items-center justify-center group hover:scale-110 active:scale-95"
          title="Contact Support"
        >
          <MessageCircle className="h-6 w-6 group-hover:rotate-12 transition-transform" />
        </button>
      </div>

      {/* Support Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-30"
            onClick={() => setIsOpen(false)}
          ></div>

          {/* Menu Cards */}
          <div className="fixed bottom-24 right-6 z-40 space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Email */}
            <a
              href="mailto:support@empi.ng"
              className="flex items-center gap-3 bg-white rounded-xl shadow-lg border border-gray-200 p-3 hover:shadow-xl hover:border-blue-400 transition group w-48"
              onClick={() => setIsOpen(false)}
            >
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center group-hover:bg-blue-600 transition">
                <Mail className="h-5 w-5 text-blue-600 group-hover:text-white transition" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-bold text-gray-900">Email</p>
                <p className="text-xs text-gray-600">support@empi.ng</p>
              </div>
            </a>

            {/* Phone */}
            <a
              href="tel:+2348012345678"
              className="flex items-center gap-3 bg-white rounded-xl shadow-lg border border-gray-200 p-3 hover:shadow-xl hover:border-green-400 transition group w-48"
              onClick={() => setIsOpen(false)}
            >
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center group-hover:bg-green-600 transition">
                <Phone className="h-5 w-5 text-green-600 group-hover:text-white transition" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-bold text-gray-900">Call</p>
                <p className="text-xs text-gray-600">+234 801 234 5678</p>
              </div>
            </a>

            {/* Instagram */}
            <a
              href="https://www.instagram.com/empicostumes/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 bg-white rounded-xl shadow-lg border border-gray-200 p-3 hover:shadow-xl hover:border-pink-400 transition group w-48"
              onClick={() => setIsOpen(false)}
            >
              <div className="w-10 h-10 rounded-lg bg-pink-100 flex items-center justify-center group-hover:bg-pink-600 transition">
                <Instagram className="h-5 w-5 text-pink-600 group-hover:text-white transition" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-bold text-gray-900">Instagram</p>
                <p className="text-xs text-gray-600">@empicostumes</p>
              </div>
            </a>
          </div>
        </>
      )}
    </>
  );
}
