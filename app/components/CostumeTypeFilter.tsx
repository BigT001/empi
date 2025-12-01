"use client";

import { useState } from "react";

interface CostumeTypeFilterProps {
  category: string; // "adults" or "kids"
  onTypeChange: (type: string | null) => void;
  availableTypes?: string[];
}

const COSTUME_TYPE_OPTIONS = ["Angel", "Carnival", "Superhero", "Traditional", "Cosplay", "Other"];

export function CostumeTypeFilter({ category, onTypeChange, availableTypes }: CostumeTypeFilterProps) {
  const [selectedType, setSelectedType] = useState<string | null>(null);

  // Only show filter for adult and kids categories
  if (category !== "adults" && category !== "kids") {
    return null;
  }

  const handleTypeSelect = (type: string | null) => {
    setSelectedType(type);
    onTypeChange(type);
  };

  // Use available types from props, fallback to all options
  const typesToShow = availableTypes || COSTUME_TYPE_OPTIONS;

  return (
    <div className="mb-8 animate-in slide-in-from-top-4 fade-in duration-500">
      {/* Buttons always visible - both mobile and desktop */}
      <div className="flex flex-wrap gap-2 md:gap-3">
        {/* "All Types" Button */}
        <button
          onClick={() => handleTypeSelect(null)}
          className={`px-4 py-2.5 rounded-lg font-medium transition-all duration-200 ${
            selectedType === null
              ? "bg-gradient-to-r from-lime-600 to-emerald-600 text-white shadow-md"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          All Types
        </button>

        {/* Costume Type Buttons */}
        {typesToShow.map((type) => (
          <button
            key={type}
            onClick={() => handleTypeSelect(type)}
            className={`px-4 py-2.5 rounded-lg font-medium transition-all duration-200 ${
              selectedType === type
                ? "bg-gradient-to-r from-lime-600 to-emerald-600 text-white shadow-md"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Badge showing selected type */}
      {selectedType && (
        <div className="mt-3 flex items-center gap-2 text-sm text-gray-600 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 w-fit">
          <span>Showing</span>
          <span className="font-semibold text-blue-700">{selectedType}</span>
          <span>costumes</span>
        </div>
      )}
    </div>
  );
}
