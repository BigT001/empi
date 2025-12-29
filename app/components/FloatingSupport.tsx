"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, Mail, Phone, Instagram, GripVertical } from "lucide-react";

export function FloatingSupport() {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [scrollY, setScrollY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [initialPosition, setInitialPosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize position on mount
  useEffect(() => {
    const initializePosition = () => {
      if (typeof window !== "undefined") {
        const x = 30; // Position on left side
        const y = 100;
        setInitialPosition({ x, y });
        setPosition({ x, y });
      }
    };

    initializePosition();
    window.addEventListener("resize", initializePosition);
    return () => window.removeEventListener("resize", initializePosition);
  }, []);

  // Handle scroll
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (containerRef.current) {
      setIsDragging(true);
      const rect = containerRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      setInitialPosition({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y - scrollY,
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, dragOffset, scrollY]);

  // Update position based on scroll
  useEffect(() => {
    setPosition({
      x: initialPosition.x,
      y: initialPosition.y - scrollY,
    });
  }, [scrollY, initialPosition]);

  return (
    <>
      {/* Floating Support Button with Label - Now draggable and scrolls with page */}
      <div
        ref={containerRef}
        className={`absolute z-40 flex flex-col items-end gap-2 transition-transform duration-100 ${
          isDragging ? "cursor-grabbing" : "cursor-grab"
        }`}
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
        }}
        onMouseDown={handleMouseDown}
      >
        {/* Drag Handle Label */}
        <div className="bg-gray-900 text-white px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap shadow-lg flex items-center gap-1.5 pointer-events-none">
          <GripVertical className="h-3 w-3" />
          Drag to move
        </div>

        {/* Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-14 h-14 rounded-full bg-gradient-to-br from-lime-600 to-green-600 hover:from-lime-700 hover:to-green-700 text-white shadow-lg hover:shadow-2xl transition-all duration-300 flex items-center justify-center group hover:scale-110 active:scale-95 pointer-events-auto"
          title="Contact Support"
          onMouseDown={(e) => e.stopPropagation()}
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
          <div
            className="absolute z-40 space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300"
            style={{
              left: `${position.x}px`,
              top: `${position.y + 100}px`,
            }}
          >
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
