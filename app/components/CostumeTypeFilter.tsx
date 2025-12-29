"use client";

import { useState } from "react";

interface CostumeTypeFilterProps {
  category: string; // "adults" or "kids"
  onTypeChange: (type: string | null) => void;
  availableTypes?: string[];
}

const COSTUME_TYPE_OPTIONS = ["Angel", "Carnival", "Superhero", "Traditional", "Cosplay", "Other"];

// Icon mapping for each costume type
const COSTUME_ICONS: Record<string, string> = {
  "All Styles": "✨",
  "Angel": "👼",
  "Carnival": "🎪",
  "Superhero": "🦸",
  "Traditional": "🥁",
  "Cosplay": "🎭",
  "Other": "🎨",
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
      <div className="mb-4 text-center md:text-left">
        <p className="text-xs font-bold text-gray-600 uppercase tracking-widest">✨ Filter by Types</p>
      </div>
      
      {/* Mobile - Grid Layout (4 per row) */}
      <div className="md:hidden">
        <div className="grid grid-cols-4 gap-2">
          {/* All Styles Button */}
          <div className="flex flex-col items-center gap-1">
            <button
              onClick={() => handleTypeSelect(null)}
              className={`flex items-center justify-center w-full py-3 rounded-xl font-semibold transition-all duration-200 border-2 shadow-sm hover:shadow-md ${ 
                selectedType === null
                  ? "bg-gradient-to-br from-lime-500 to-lime-600 text-white border-lime-600 shadow-lg"
                  : "bg-white text-gray-700 border-gray-300 hover:border-lime-400"
              }`}
            >
              <span className="text-xl">{COSTUME_ICONS["All Styles"]}</span>
            </button>
            <span className="text-[10px] font-bold text-gray-900 text-center">All</span>
          </div>

          {/* Costume Type Buttons */}
          {typesToShow.map((type) => (
            <div key={type} className="flex flex-col items-center gap-1">
              <button
                onClick={() => handleTypeSelect(type)}
                className={`flex items-center justify-center w-full py-3 rounded-xl font-semibold transition-all duration-200 border-2 shadow-sm hover:shadow-md ${
                  selectedType === type
                    ? "bg-gradient-to-br from-lime-500 to-lime-600 text-white border-lime-600 shadow-lg"
                    : "bg-white text-gray-700 border-gray-300 hover:border-lime-400"
                }`}
                title={type}
              >
                <span className="text-xl">{COSTUME_ICONS[type] || "🎭"}</span>
              </button>
              <span className="text-[10px] font-bold text-gray-900 text-center leading-tight">{type}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Desktop - Flex Layout */}
      <div className="hidden md:flex gap-2 flex-wrap">
        {/* "All Styles" Button */}
        <button
          onClick={() => handleTypeSelect(null)}
          className={`px-3 py-2 rounded-lg font-semibold text-xs transition-all duration-200 border-2 flex items-center gap-1.5 ${
            selectedType === null
              ? "bg-lime-600 text-white border-lime-600 shadow-md hover:shadow-lg"
              : "bg-white text-gray-700 border-gray-200 hover:border-gray-300"
          }`}
        >
          <span className="text-base">{COSTUME_ICONS["All Styles"]}</span>
          All Styles
        </button>

        {/* Costume Type Buttons */}
        {typesToShow.map((type) => (
          <button
            key={type}
            onClick={() => handleTypeSelect(type)}
            className={`px-3 py-2 rounded-lg font-semibold text-xs transition-all duration-200 border-2 flex items-center gap-1.5 ${
              selectedType === type
                ? "bg-lime-600 text-white border-lime-600 shadow-md hover:shadow-lg"
                : "bg-white text-gray-700 border-gray-200 hover:border-gray-300"
            }`}
          >
            <span className="text-base">{COSTUME_ICONS[type] || "🎭"}</span>
            {type}
          </button>
        ))}
      </div>
    </div>
  );
}
