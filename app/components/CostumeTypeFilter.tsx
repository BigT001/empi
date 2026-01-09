"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

interface CostumeTypeFilterProps {
  category: string; // "adults" or "kids"
  onTypeChange: (type: string | null) => void;
  availableTypes?: string[];
}

const COSTUME_TYPE_OPTIONS = ["Angel", "Carnival", "Western", "Traditional Africa", "Cosplay", "Other"];

const TRADITIONAL_AFRICA_SUBFILTERS = ["Nigeria", "Ghana", "South Africa", "Egypt", "Algeria", "Congo", "Kenya"];

// Icon mapping for each costume type - REMOVED ICONS, USING PLAIN TEXT ONLY
const COSTUME_ICONS: Record<string, string> = {
  "All Styles": "",
  "Angel": "",
  "Carnival": "",
  "Western": "",
  "Traditional Africa": "",
  "Cosplay": "",
  "Other": "",
};

export function CostumeTypeFilter({ category, onTypeChange, availableTypes }: CostumeTypeFilterProps) {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedSubfilter, setSelectedSubfilter] = useState<string | null>(null);
  const [showSubfilters, setShowSubfilters] = useState(false);

  // Only show filter for adult and kids categories
  if (category !== "adults" && category !== "kids") {
    return null;
  }

  const handleTypeSelect = (type: string | null) => {
    setSelectedType(type);
    setSelectedSubfilter(null);
    
    // If Traditional Africa is selected, show subfilters
    if (type === "Traditional Africa") {
      setShowSubfilters(true);
      setSelectedSubfilter(null);
      // Apply the "All Countries" behavior immediately so the grid shows
      // only Traditional Africa costumes by default.
      onTypeChange("Traditional Africa");
    } else {
      setShowSubfilters(false);
      onTypeChange(type);
    }
    
    // Scroll down to products
    setTimeout(() => {
      const productsSection = document.querySelector('[data-products-section]');
      if (productsSection) {
        productsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const handleSubfilterSelect = (subfilter: string | null) => {
    setSelectedSubfilter(subfilter);
    
    // Pass the combination of type and subfilter
    if (subfilter) {
      onTypeChange(`Traditional Africa - ${subfilter}`);
    } else {
      onTypeChange("Traditional Africa");
    }
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
              className={`text-sm font-semibold transition-colors flex items-center gap-1 ${
                selectedType === type
                  ? "text-lime-600 border-b-2 border-lime-600"
                  : "text-gray-700 hover:text-gray-900"
              }`}
            >
              {type}
              {type === "Traditional Africa" && selectedType === type && (
                <ChevronDown className="h-4 w-4" />
              )}
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
              className={`text-sm font-semibold transition-colors flex items-center gap-1 ${
                selectedType === type
                  ? "text-lime-600 border-b-2 border-lime-600"
                  : "text-gray-700 hover:text-gray-900"
              }`}
            >
              {type}
              {type === "Traditional Africa" && selectedType === type && (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>
          ))}
        </div>

        {/* Traditional Africa Subfilters */}
        {showSubfilters && selectedType === "Traditional Africa" && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-xs font-bold text-gray-600 uppercase tracking-widest mb-3">Select Country</p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleSubfilterSelect(null)}
                className={`text-sm font-semibold transition-colors ${
                  selectedSubfilter === null
                    ? "text-lime-600 border-b-2 border-lime-600"
                    : "text-gray-700 hover:text-gray-900"
                }`}
              >
                All Countries
              </button>
              {TRADITIONAL_AFRICA_SUBFILTERS.map((country) => (
                <button
                  key={country}
                  onClick={() => handleSubfilterSelect(country)}
                  className={`text-sm font-semibold transition-colors ${
                    selectedSubfilter === country
                      ? "text-lime-600 border-b-2 border-lime-600"
                      : "text-gray-700 hover:text-gray-900"
                  }`}
                >
                  {country}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
