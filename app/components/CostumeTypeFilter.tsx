"use client";

import { useState } from "react";

interface CostumeTypeFilterProps {
  category: string; // "adults" or "kids"
  onTypeChange: (type: string | null) => void;
  availableTypes?: string[];
}

const COSTUME_TYPE_OPTIONS = ["Angel", "Carnival", "Superhero", "Traditional", "Cosplay", "Other"];

// Icon mapping for each costume type - REMOVED ICONS, USING PLAIN TEXT ONLY
const COSTUME_ICONS: Record<string, string> = {
  "All Styles": "",
  "Angel": "",
  "Carnival": "",
  "Superhero": "",
  "Traditional": "",
  "Cosplay": "",
  "Other": "",
};

export function CostumeTypeFilter({ category, onTypeChange, availableTypes }: CostumeTypeFilterProps) {
  const [selectedType, setSelectedType] = useState<string | null>(null);

  // Only show filter for adult and kids categories
  if (category !== "adults" && category !== "kids") {
    return null;
  }

  const handleTypeSelect = (type: string | null) => {
    setSelectedType(type);
    onTypeChange(type);
    // Scroll down to products
    setTimeout(() => {
      const productsSection = document.querySelector('[data-products-section]');
      if (productsSection) {
        productsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  // Use available types from props, fallback to all options
  const typesToShow = availableTypes || COSTUME_TYPE_OPTIONS;

  return (
    <div className="mb-8 animate-in slide-in-from-top-4 fade-in duration-500">
      <div className="mb-6 text-center md:text-left">
        <p className="text-xs font-bold text-gray-600 uppercase tracking-widest mb-4">Filter by Types</p>
        
        {/* Mobile - Text links */}
        <div className="md:hidden flex flex-wrap gap-3">
          <button
            onClick={() => handleTypeSelect(null)}
            className={`text-sm font-semibold transition-colors ${
              selectedType === null
                ? "text-lime-600 border-b-2 border-lime-600"
                : "text-gray-700 hover:text-gray-900"
            }`}
          >
            All
          </button>
          {typesToShow.map((type) => (
            <button
              key={type}
              onClick={() => handleTypeSelect(type)}
              className={`text-sm font-semibold transition-colors ${
                selectedType === type
                  ? "text-lime-600 border-b-2 border-lime-600"
                  : "text-gray-700 hover:text-gray-900"
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        {/* Desktop - Text links */}
        <div className="hidden md:flex gap-4 flex-wrap">
          <button
            onClick={() => handleTypeSelect(null)}
            className={`text-sm font-semibold transition-colors ${
              selectedType === null
                ? "text-lime-600 border-b-2 border-lime-600"
                : "text-gray-700 hover:text-gray-900"
            }`}
          >
            All Styles
          </button>
          {typesToShow.map((type) => (
            <button
              key={type}
              onClick={() => handleTypeSelect(type)}
              className={`text-sm font-semibold transition-colors ${
                selectedType === type
                  ? "text-lime-600 border-b-2 border-lime-600"
                  : "text-gray-700 hover:text-gray-900"
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
