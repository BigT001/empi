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
      <div className="mb-4">
        <p className="text-xs font-bold text-gray-600 uppercase tracking-widest">✨ Filter by Types</p>
      </div>
      
      {/* Mobile - Grid Layout (5 per row) */}
      <div className="md:hidden">
        <div className="grid grid-cols-5 gap-2">
          {/* All Styles Button */}
          <button
            onClick={() => handleTypeSelect(null)}
            className={`flex flex-col items-center justify-center py-3 px-1 rounded-lg font-semibold text-xs transition-all duration-200 border-2 ${ 
              selectedType === null
                ? "bg-lime-600 text-white border-lime-600 shadow-md"
                : "bg-white text-gray-700 border-gray-200 hover:border-gray-300"
            }`}
          >
            <span className="text-xl mb-1">{COSTUME_ICONS["All Styles"]}</span>
            <span className="line-clamp-1 text-center leading-tight text-xs">All</span>
          </button>

          {/* Costume Type Buttons */}
          {typesToShow.map((type) => (
            <button
              key={type}
              onClick={() => handleTypeSelect(type)}
              className={`flex flex-col items-center justify-center py-3 px-1 rounded-lg font-semibold text-xs transition-all duration-200 border-2 ${
                selectedType === type
                  ? "bg-lime-600 text-white border-lime-600 shadow-md"
                  : "bg-white text-gray-700 border-gray-200 hover:border-gray-300"
              }`}
              title={type}
            >
              <span className="text-xl mb-1">{COSTUME_ICONS[type] || "🎭"}</span>
              <span className="line-clamp-1 text-center leading-tight text-xs">{type}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Desktop - Flex Layout */}
      <div className="hidden md:flex gap-2 flex-wrap">
        {/* "All Styles" Button */}
        <button
          onClick={() => handleTypeSelect(null)}
          className={`px-4 py-2.5 rounded-lg font-semibold text-sm transition-all duration-200 border-2 flex items-center gap-2 ${
            selectedType === null
              ? "bg-lime-600 text-white border-lime-600 shadow-md hover:shadow-lg"
              : "bg-white text-gray-700 border-gray-200 hover:border-gray-300"
          }`}
        >
          <span className="text-lg">{COSTUME_ICONS["All Styles"]}</span>
          All Styles
        </button>

        {/* Costume Type Buttons */}
        {typesToShow.map((type) => (
          <button
            key={type}
            onClick={() => handleTypeSelect(type)}
            className={`px-4 py-2.5 rounded-lg font-semibold text-sm transition-all duration-200 border-2 flex items-center gap-2 ${
              selectedType === type
                ? "bg-lime-600 text-white border-lime-600 shadow-md hover:shadow-lg"
                : "bg-white text-gray-700 border-gray-200 hover:border-gray-300"
            }`}
          >
            <span className="text-lg">{COSTUME_ICONS[type] || "🎭"}</span>
            {type}
          </button>
        ))}
      </div>
    </div>
  );
}
