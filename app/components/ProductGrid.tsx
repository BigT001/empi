"use client";

import { useEffect, useState, useRef } from "react";
import { products, CURRENCY_RATES } from "./constants";
import { ProductCard } from "./ProductCard";
import { useProducts } from "@/lib/useProducts";
import { CostumeTypeFilter } from "./CostumeTypeFilter";

interface Product {
  id?: string;
  _id?: string;
  name: string;
  description: string;
  sellPrice: number;
  rentPrice: number;
  category: string;
  costumeType?: string;
  region?: string; // legacy: keep region as fallback for Traditional Africa subfilter
  country?: string;
  badge: string | null;
  imageUrl: string;
  imageUrls: string[];
  sizes?: string;
  color?: string;
  material?: string;
  condition?: string;
  careInstructions?: string;
  availableForBuy?: boolean;
  availableForRent?: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ProductGridProps {
  currency: string;
  category: string;
  initialProducts?: Product[];
  mode?: "buy" | "rent";
  onModeChange?: (mode: "buy" | "rent") => void;
  searchQuery?: string;
}

export function ProductGrid({ currency, category, initialProducts, mode, onModeChange, searchQuery = "" }: ProductGridProps) {
  const { products: cachedProducts, loading, error, pagination, loadMore } = useProducts(category);
  const [dbProducts, setDbProducts] = useState<Product[]>(initialProducts ?? (cachedProducts as Product[]));
  const [showError, setShowError] = useState(false);
  const [selectedCostumeType, setSelectedCostumeType] = useState<string | null>(null);
  const productGridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setDbProducts(cachedProducts as Product[]);
  }, [cachedProducts]);

  // Auto-scroll to product grid when search query changes
  useEffect(() => {
    if (searchQuery && productGridRef.current) {
      setTimeout(() => {
        productGridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [searchQuery]);

  // Only show error after a delay to avoid flashing
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setShowError(true), 2000);
      return () => clearTimeout(timer);
    } else {
      setShowError(false);
    }
  }, [error]);

  const formatPrice = (price: number) => {
    const converted = price * CURRENCY_RATES[currency].rate;
    const symbol = CURRENCY_RATES[currency].symbol;

    if (currency === "INR" || currency === "NGN") {
      return `${symbol}${converted.toFixed(0)}`;
    }
    return `${symbol}${converted.toFixed(2)}`;
  };

  // Use database products and ensure they have proper IDs
  const displayProducts = dbProducts.map(p => ({
    ...p,
    id: p.id || (p as any)._id || Math.random().toString(36).substr(2, 9)
  }));

  // Filter by category and costume type
  let filteredProducts = category === "all"
    ? displayProducts
    : displayProducts.filter((product) => product.category === category);

  // Apply costume type filter if selected
  if (selectedCostumeType) {
    // Check if it's a Traditional Africa filter with a country
    if (selectedCostumeType.startsWith("Traditional Africa - ")) {
      const country = selectedCostumeType.split(" - ")[1]?.trim() || "";
      filteredProducts = filteredProducts.filter((product) => {
        const isTraditional = (product.costumeType || "").toLowerCase() === "traditional africa";
        const productCountry = (product.country || product.region || "").toLowerCase();
        return isTraditional && productCountry === country.toLowerCase();
      });
    } else {
      filteredProducts = filteredProducts.filter((product) =>
        (product.costumeType || "").toLowerCase() === (selectedCostumeType || "").toLowerCase()
      );
    }
  }

  // Apply search query filter
  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase();
    filteredProducts = filteredProducts.filter((product) =>
      product.name.toLowerCase().includes(query) ||
      product.description.toLowerCase().includes(query) ||
      product.costumeType?.toLowerCase().includes(query) ||
      product.color?.toLowerCase().includes(query) ||
      product.material?.toLowerCase().includes(query)
    );
  }

  // Sort by newest first
  filteredProducts = filteredProducts.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  // Get unique costume types for the filter
  // Always show all costume types, regardless of whether products exist
  const COSTUME_TYPES = ["Angel", "Carnival", "Western", "Traditional Africa", "Cosplay", "Other"];
  const availableCostumeTypes = COSTUME_TYPES;

  return (
    <section ref={productGridRef} className="flex-grow mx-auto w-full max-w-7xl px-6 py-12 animate-in fade-in duration-500" data-products-section>
      {/* Products Grid Header */}
      <div className={`animate-in slide-in-from-top-4 fade-in duration-500 ${category === "adults" ? "mb-0 md:mb-8" : "mb-8"}`}>
        <div className="flex items-start justify-between gap-4 md:justify-start">
          <div className="flex-1 text-center md:text-left">
            <h1 className={`text-3xl md:text-4xl font-black text-gray-900 dark:text-white mb-3 ${category === "adults" ? "hidden md:block" : ""}`}>
              {category === "kids" ? "Kids' Collection" : category === "adults" ? "Adult Collection" : "All Costumes"}
            </h1>
            {searchQuery && (
              <p className="text-lime-600 font-bold text-sm md:text-base mb-2">
                {filteredProducts.length} costume{filteredProducts.length !== 1 ? 's' : ''} found
              </p>
            )}
            <p className={`text-gray-700 dark:text-gray-400 font-medium text-sm md:text-base ${category === "adults" ? "hidden md:block" : ""}`}>
              {category === "kids"
                ? "Magical and enchanting costumes designed for kids. From superheroes to fairy tales, every costume tells a story."
                : category === "adults"
                  ? "Curated selection of premium costumes for every style."
                  : "Explore our complete range of beautifully crafted costumes for all ages and occasions."}
            </p>
          </div>
        </div>
      </div>

      {/* Costume Type Filter - Only show on Adults page */}
      {category === "adults" && (
        <CostumeTypeFilter
          category={category}
          onTypeChange={setSelectedCostumeType}
          availableTypes={availableCostumeTypes.length > 0 ? availableCostumeTypes : undefined}
        />
      )}

      {/* Loading State */}
      {loading && dbProducts.length === 0 && (
        <div className="text-center py-12 animate-in fade-in duration-300">
          <p className="text-gray-500">🔄 Loading products...</p>
        </div>
      )}

      {/* Error State - Only show if we have no products and cache failed */}
      {showError && !loading && dbProducts.length === 0 && (
        <div className="text-center py-12 animate-in fade-in duration-300">
          <p className="text-red-500">❌ Error loading products: {error}</p>
          <p className="text-gray-500 mt-2 text-sm">Please try refreshing the page. Admin must upload products to the database.</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredProducts.length === 0 && dbProducts.length > 0 && (
        <div className="text-center py-12 animate-in fade-in duration-300">
          <p className="text-gray-500">
            {selectedCostumeType
              ? `No ${selectedCostumeType} costumes available in this category`
              : "No products available in this category"}
          </p>
          {selectedCostumeType && (
            <button
              onClick={() => setSelectedCostumeType(null)}
              className="mt-4 px-4 py-2 bg-lime-600 hover:bg-lime-700 text-white rounded-lg font-medium transition"
            >
              View All Costumes
            </button>
          )}
        </div>
      )}

      {/* Products Masonry Layout */}
      {filteredProducts.length > 0 && (
        <div>
          {/* CSS Columns Masonry - Natural card flow, no fixed heights */}
          <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
            {filteredProducts.map((product, idx) => (
              <div
                key={product.id || (product as any)._id || `product-${idx}`}
                className="break-inside-avoid animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both"
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <ProductCard
                  product={product}
                  formattedPrice={formatPrice(product.sellPrice)}
                  currency={currency}
                />
              </div>
            ))}
          </div>

          {/* Load More Button */}
          {pagination?.hasMore && (
            <div className="mt-12 flex justify-center">
              <button
                onClick={loadMore}
                disabled={loading}
                className="px-8 py-3 bg-lime-600 hover:bg-lime-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition"
              >
                {loading ? "Loading..." : "Load More Products"}
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
