"use client";

import { useEffect, useState } from "react";
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
}

export function ProductGrid({ currency, category, initialProducts, mode, onModeChange }: ProductGridProps) {
  const { products: cachedProducts, loading, error, pagination, loadMore } = useProducts(category);
  const [dbProducts, setDbProducts] = useState<Product[]>(initialProducts ?? (cachedProducts as Product[]));
  const [showError, setShowError] = useState(false);
  const [selectedCostumeType, setSelectedCostumeType] = useState<string | null>(null);

  useEffect(() => {
    setDbProducts(cachedProducts as Product[]);
  }, [cachedProducts]);

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
    filteredProducts = filteredProducts.filter(
      (product) => product.costumeType === selectedCostumeType
    );
  }

  // Sort by newest first
  filteredProducts = filteredProducts.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  // Get unique costume types for the filter
  // Always show all costume types, regardless of whether products exist
  const COSTUME_TYPES = ["Angel", "Carnival", "Superhero", "Traditional", "Cosplay", "Other"];
  const availableCostumeTypes = COSTUME_TYPES;

  return (
    <section className="flex-grow mx-auto w-full max-w-7xl px-6 py-12 animate-in fade-in duration-500" data-products-section>
      {/* Products Grid Header */}
      <div className="mb-8 animate-in slide-in-from-top-4 fade-in duration-500">
        <div className="flex items-start justify-between gap-4 md:justify-start">
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-3">
              {category === "kids" ? "Kids' Collection" : category === "adults" ? "Adult Collection" : "All Costumes"}
            </h1>
            <p className="text-gray-700 font-medium text-sm md:text-base">
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

      {/* Products Bento Grid */}
      {filteredProducts.length > 0 && (
        <div>
          {/* Bento Grid Layout - 4 columns on desktop, 3 on tablet, 2 on mobile */}
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 auto-rows-max">
            {filteredProducts.map((product, idx) => {
              // Simple pattern - mostly small cards
              let size: "small" | "medium" | "large" = "small";
              const pattern = idx % 12;
              
              if (pattern === 0 || pattern === 6) {
                size = "medium"; // Occasional featured items
              }
              
              return (
                <div
                  key={product.id || (product as any)._id || `product-${idx}`}
                  className="animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both"
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  <ProductCard
                    product={product}
                    formattedPrice={formatPrice(product.sellPrice)}
                    currency={currency}
                  />
                </div>
              );
            })}
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
