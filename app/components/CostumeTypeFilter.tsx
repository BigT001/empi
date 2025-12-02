"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";

interface CostumeTypeFilterProps {
  category: string; // "adults" or "kids"
  onTypeChange: (type: string | null) => void;
  availableTypes?: string[];
}

const COSTUME_TYPE_OPTIONS = ["Angel", "Carnival", "Superhero", "Traditional", "Cosplay", "Other"];

export function CostumeTypeFilter({ category, onTypeChange, availableTypes }: CostumeTypeFilterProps) {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [showScrollHint, setShowScrollHint] = useState(true);

  // Only show filter for adult and kids categories
  if (category !== "adults" && category !== "kids") {
    return null;
  }

  const handleTypeSelect = (type: string | null) => {
    setSelectedType(type);
    onTypeChange(type);
    // Hide scroll hint after first interaction
    setShowScrollHint(false);
  };

  const handleScroll = () => {
    setShowScrollHint(false);
  };

  // Use available types from props, fallback to all options
  const typesToShow = availableTypes || COSTUME_TYPE_OPTIONS;

  return (
    <div className="mb-8 animate-in slide-in-from-top-4 fade-in duration-500">
      {/* Mobile - Horizontal Scroll with Indicator */}
      <div className="md:hidden relative">
        {/* Scroll Indicator Label - Compact */}
        {showScrollHint && (
          <div className="flex justify-end mb-1">
            <div className="flex items-center gap-1 text-xs text-teal-600 font-medium">
              <span>scroll right</span>
              <ChevronRight className="w-3 h-3 animate-bounce" />
            </div>
          </div>
        )}

        {/* Scroll Container */}
        <div 
          className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-hide"
          style={{ scrollBehavior: "smooth" }}
          onScroll={handleScroll}
        >
          {/* "All Types" Button */}
          <button
            onClick={() => handleTypeSelect(null)}
            className={`flex-shrink-0 px-4 py-2 rounded-full font-semibold text-sm transition-all duration-200 whitespace-nowrap ${
              selectedType === null
                ? "bg-teal-600 text-white shadow-md"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            All Types
          </button>

          {/* Costume Type Buttons */}
          {typesToShow.map((type) => (
            <button
              key={type}
              onClick={() => handleTypeSelect(type)}
              className={`flex-shrink-0 px-4 py-2 rounded-full font-semibold text-sm transition-all duration-200 whitespace-nowrap ${
                selectedType === type
                  ? "bg-teal-600 text-white shadow-md"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Desktop - Flex Layout */}
      <div className="hidden md:flex gap-2.5 flex-wrap">
        {/* "All Types" Button */}
        <button
          onClick={() => handleTypeSelect(null)}
          className={`px-4 py-2 rounded-full font-semibold text-sm transition-all duration-200 ${
            selectedType === null
              ? "bg-teal-600 text-white shadow-md hover:shadow-lg"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          All Types
        </button>

        {/* Costume Type Buttons */}
        {typesToShow.map((type) => (
          <button
            key={type}
            onClick={() => handleTypeSelect(type)}
            className={`px-4 py-2 rounded-full font-semibold text-sm transition-all duration-200 ${
              selectedType === type
                ? "bg-teal-600 text-white shadow-md hover:shadow-lg"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Tailwind Scrollbar Hide Class */}
      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
