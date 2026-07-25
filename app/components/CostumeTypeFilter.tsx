"use client";

import { useState } from "react";
import Image from "next/image";
import {
  ChevronDown,
  Feather,
  Globe2,
  HatGlasses,
  PartyPopper,
  Shapes,
  Swords,
  X,
} from "lucide-react";

interface CostumeTypeFilterProps {
  category: string;
  onTypeChange: (type: string | null) => void;
  initialType?: string | null;
}

const FILTER_OPTIONS = [
  {
    label: "Fantasy Costume",
    value: "Angel",
    image: "/empiimages/IMG_0794.JPG",
    icon: Feather,
    hasDropdown: true,
  },
  {
    label: "Carnival",
    value: "Carnival",
    image: "/empiimages/IMG_9906.JPG",
    icon: PartyPopper,
  },
  {
    label: "Western",
    value: "Western",
    image: "/empiimages/IMG_9345.JPG",
    icon: HatGlasses,
  },
  {
    label: "Traditional Africa",
    value: "Traditional Africa",
    image: "/empiimages/d7376ba7-6379-410e-bd4a-627a6e521ffc.JPG",
    icon: Globe2,
    hasDropdown: true,
  },
  {
    label: "Cosplay",
    value: "Cosplay",
    image:
      "https://res.cloudinary.com/dtxbk2uid/image/upload/v1770802824/empi/kssxgbjqzymeqbcdvjzl.jpg",
    icon: Swords,
  },
  {
    label: "Other",
    value: "Other",
    image:
      "https://res.cloudinary.com/dtxbk2uid/image/upload/v1784721550/empi/hgd2cukqt5psbw29tcd4.jpg",
    icon: Shapes,
  },
];

const FANTASY_SUBFILTERS = [
  "White Wings",
  "Black Wings",
  "Fairies",
  "Night Life",
];

const TRADITIONAL_AFRICA_SUBFILTERS = [
  "Nigeria",
  "Ghana",
  "South Africa",
  "Egypt",
  "Algeria",
  "Congo",
  "Kenya",
];

export function CostumeTypeFilter({
  category,
  onTypeChange,
  initialType = null,
}: CostumeTypeFilterProps) {
  const initialBaseType = initialType?.split(" - ")[0] ?? null;
  const initialSubfilter = initialType?.includes(" - ")
    ? initialType.split(" - ").slice(1).join(" - ")
    : null;
  const [selectedType, setSelectedType] = useState<string | null>(initialBaseType);
  const [selectedSubfilter, setSelectedSubfilter] = useState<string | null>(
    initialSubfilter,
  );

  if (category !== "adults" && category !== "kids" && category !== "all") {
    return null;
  }

  const selectType = (type: string | null) => {
    setSelectedType(type);
    setSelectedSubfilter(null);
    onTypeChange(type);
  };

  const selectSubfilter = (subfilter: string | null) => {
    setSelectedSubfilter(subfilter);
    onTypeChange(subfilter ? `${selectedType} - ${subfilter}` : selectedType);
  };

  const subfilters =
    selectedType === "Angel"
      ? FANTASY_SUBFILTERS
      : selectedType === "Traditional Africa"
        ? TRADITIONAL_AFRICA_SUBFILTERS
        : null;

  return (
    <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.28em] text-lime-600 dark:text-lime-500">
            Find your style
          </p>
          <h2 className="mt-1 font-playfair text-2xl font-black text-slate-950 dark:text-white md:text-3xl">
            Filter by costume
          </h2>
        </div>
        {selectedType && (
          <button
            type="button"
            onClick={() => selectType(null)}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[9px] font-black uppercase tracking-wider text-slate-500 transition hover:border-lime-500/40 hover:text-slate-950 dark:border-white/10 dark:bg-white/5 dark:text-white/55 dark:hover:text-white"
          >
            <X className="h-3 w-3" />
            All styles
          </button>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2.5 md:gap-4 lg:grid-cols-6">
        {FILTER_OPTIONS.map((option) => {
          const Icon = option.icon;
          const active = selectedType === option.value;

          return (
            <button
              type="button"
              key={option.value}
              onClick={() => selectType(option.value)}
              aria-pressed={active}
              className={`group relative h-[112px] overflow-hidden rounded-2xl border text-left transition duration-300 active:scale-95 md:h-[148px] md:rounded-3xl ${
                active
                  ? "border-lime-500 ring-2 ring-lime-500/25"
                  : "border-slate-200 hover:-translate-y-0.5 hover:border-lime-500/50 dark:border-white/10"
              }`}
            >
              <Image
                src={option.image}
                alt=""
                fill
                sizes="(max-width: 1024px) 33vw, 16vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <span className="absolute inset-0 bg-gradient-to-t from-black via-black/25 to-black/5" />
              <span
                className={`absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-lg border backdrop-blur-md md:right-3 md:top-3 md:h-8 md:w-8 ${
                  active
                    ? "border-lime-400 bg-lime-500 text-black"
                    : "border-white/15 bg-black/50 text-lime-400"
                }`}
              >
                <Icon className="h-3.5 w-3.5" strokeWidth={1.8} />
              </span>
              <span className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-1 p-2.5 md:p-4">
                <span className="text-[8px] font-black uppercase leading-3 tracking-[0.04em] text-white drop-shadow-lg md:text-[10px] md:leading-4">
                  {option.label}
                </span>
                {option.hasDropdown && (
                  <ChevronDown
                    className={`h-3 w-3 shrink-0 text-white transition-transform ${
                      active ? "rotate-180" : ""
                    }`}
                  />
                )}
              </span>
            </button>
          );
        })}
      </div>

      {subfilters && (
        <div className="mt-4 animate-in fade-in slide-in-from-top-2 rounded-2xl border border-slate-200 bg-slate-50 p-4 duration-300 dark:border-white/10 dark:bg-white/[0.03]">
          <p className="mb-3 text-center text-[9px] font-black uppercase tracking-[0.18em] text-slate-400 md:text-left">
            {selectedType === "Angel"
              ? "Choose a fantasy style"
              : "Choose a country"}
          </p>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
            <button
              type="button"
              onClick={() => selectSubfilter(null)}
              className={`rounded-xl border px-3 py-2.5 text-[9px] font-black uppercase tracking-wider transition ${
                selectedSubfilter === null
                  ? "border-lime-500 bg-lime-500 text-black"
                  : "border-slate-200 bg-white text-slate-500 hover:border-lime-500/40 dark:border-white/10 dark:bg-white/5 dark:text-white/60"
              }`}
            >
              {selectedType === "Angel" ? "All Fantasy" : "All Countries"}
            </button>
            {subfilters.map((subfilter) => (
              <button
                type="button"
                key={subfilter}
                onClick={() => selectSubfilter(subfilter)}
                className={`rounded-xl border px-3 py-2.5 text-[9px] font-black uppercase tracking-wider transition ${
                  selectedSubfilter === subfilter
                    ? "border-lime-500 bg-lime-500 text-black"
                    : "border-slate-200 bg-white text-slate-500 hover:border-lime-500/40 dark:border-white/10 dark:bg-white/5 dark:text-white/60"
                }`}
              >
                {subfilter}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
