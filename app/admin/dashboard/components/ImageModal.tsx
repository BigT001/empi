"use client";

import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useState } from "react";
import Image from "next/image";

interface ImageModalProps {
  open: boolean;
  onClose: () => void;
  images: string[];
  orderName: string;
}

export function ImageModal({ open, onClose, images, orderName }: ImageModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!open || images.length === 0) return null;

  const currentImage = images[currentIndex];
  const nextImage = () => setCurrentIndex((prev) => (prev + 1) % images.length);
  const prevImage = () => setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">{orderName}</h3>
          <button
            onClick={onClose}
            className="p-1 text-gray-500 hover:text-gray-900 transition"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Main Image Container */}
        <div className="relative w-full bg-gray-50 min-h-96">
          <img
            src={currentImage}
            alt={`${orderName} design ${currentIndex + 1}`}
            className="w-full h-96 object-contain"
          />
        </div>

        {/* Navigation Bar */}
        <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-t border-gray-200">
          <button
            onClick={prevImage}
            className="p-2 text-gray-700 hover:bg-gray-200 rounded-lg transition"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <span className="text-sm font-medium text-gray-600">
            {currentIndex + 1} / {images.length}
          </span>

          <button
            onClick={nextImage}
            className="p-2 text-gray-700 hover:bg-gray-200 rounded-lg transition"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* Thumbnail Strip */}
        {images.length > 1 && (
          <div className="flex gap-2 p-4 bg-white overflow-x-auto border-t border-gray-200">
            {images.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`flex-shrink-0 relative w-16 h-16 rounded-lg overflow-hidden border-2 transition ${
                  idx === currentIndex ? "border-blue-500 ring-2 ring-blue-300" : "border-gray-300 hover:border-gray-400"
                }`}
              >
                <img
                  src={img}
                  alt={`Thumbnail ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
