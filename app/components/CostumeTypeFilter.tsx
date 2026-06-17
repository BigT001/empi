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

export function CostumeTypeFilter({ category, onTypeChange, availableTypes }: CostumeTypeFilterProps) {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedSubfilter, setSelectedSubfilter] = useState<string | null>(null);
  const [showSubfilters, setShowSubfilters] = useState(false);

  // Only show filter for adult, kids and all categories
  if (category !== "adults" && category !== "kids" && category !== "all") {
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
      <div className="mb-6">
        <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-4 text-center md:text-left">
          Filter by Types
        </p>

        {/* Premium Pills Filter Container */}
        <div className="flex items-center gap-3 overflow-x-auto md:flex-wrap md:overflow-visible no-scrollbar pb-3 md:pb-0 -mx-4 px-4 md:-mx-0 md:px-0">
          <button
            onClick={() => handleTypeSelect(null)}
            className={`flex-none px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 shadow-sm border active:scale-95 hover:scale-[1.02] ${
              selectedType === null
                ? "bg-lime-600 text-white border-transparent shadow-lg shadow-lime-500/25 dark:bg-lime-500"
                : "bg-slate-50 dark:bg-white/5 text-slate-500 dark:text-slate-400 border-slate-200/60 dark:border-white/5 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            All Styles
          </button>
          {typesToShow.map((type) => (
            <button
              key={type}
              onClick={() => handleTypeSelect(type)}
              className={`flex-none px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 shadow-sm border active:scale-95 hover:scale-[1.02] flex items-center gap-2 ${
                selectedType === type
                  ? "bg-lime-600 text-white border-transparent shadow-lg shadow-lime-500/25 dark:bg-lime-500"
                  : "bg-slate-50 dark:bg-white/5 text-slate-500 dark:text-slate-400 border-slate-200/60 dark:border-white/5 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <span>{type}</span>
              {type === "Traditional Africa" && (
                <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-300 ${selectedType === type ? "rotate-180" : ""}`} />
              )}
            </button>
          ))}
        </div>

        {/* Traditional Africa Subfilters */}
        {showSubfilters && selectedType === "Traditional Africa" && (
          <div className="mt-6 pt-6 border-t border-gray-100 dark:border-white/5 animate-in slide-in-from-top-2 fade-in duration-300">
            <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3 pl-1 text-center md:text-left">
              Select Country
            </p>
            <div className="flex items-center gap-2 overflow-x-auto md:flex-wrap md:overflow-visible no-scrollbar pb-3 md:pb-0 -mx-4 px-4 md:-mx-0 md:px-0">
              <button
                onClick={() => handleSubfilterSelect(null)}
                className={`flex-none px-4 py-2 rounded-xl text-[9px] font-bold uppercase tracking-wider transition-all duration-300 shadow-sm border active:scale-95 hover:scale-[1.02] ${
                  selectedSubfilter === null
                    ? "bg-lime-600/10 text-lime-600 dark:text-lime-400 border-lime-500/20"
                    : "bg-slate-50/50 dark:bg-white/5 text-slate-500 dark:text-slate-400 border-slate-200/40 dark:border-white/5 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                All Countries
              </button>
              {TRADITIONAL_AFRICA_SUBFILTERS.map((country) => (
                <button
                  key={country}
                  onClick={() => handleSubfilterSelect(country)}
                  className={`flex-none px-4 py-2 rounded-xl text-[9px] font-bold uppercase tracking-wider transition-all duration-300 shadow-sm border active:scale-95 hover:scale-[1.02] ${
                    selectedSubfilter === country
                      ? "bg-lime-600/10 text-lime-600 dark:text-lime-400 border-lime-500/20"
                      : "bg-slate-50/50 dark:bg-white/5 text-slate-500 dark:text-slate-400 border-slate-200/40 dark:border-white/5 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white"
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
