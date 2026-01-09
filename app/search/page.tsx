"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Search, AlertCircle, ChevronDown } from "lucide-react";
import { ProductCard } from "@/app/components/ProductCard";
import { CURRENCY_RATES } from "@/app/components/constants";

interface Product {
  id: string;
  _id?: string;
  name: string;
  description: string;
  sellPrice: number;
  rentPrice: number;
  category: string;
  costumeType?: string;
  country?: string; // For Traditional Africa subfilter
  imageUrl: string;
  imageUrls?: string[];
  badge: string | null;
  color?: string;
  material?: string;
  sizes?: string;
}

interface PaginationData {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean; 
}

const COSTUME_TYPES = ['Angel', 'Carnival', 'Western', 'Traditional Africa', 'Cosplay', 'Other'];
const TRADITIONAL_AFRICA_COUNTRIES = ['Nigeria', 'Ghana', 'South Africa', 'Egypt', 'Algeria', 'Congo', 'Kenya'];
const COLORS = ['Red', 'Blue', 'Black', 'White', 'Gold', 'Silver', 'Purple', 'Green', 'Pink', 'Yellow', 'Orange', 'Brown'];
const MATERIALS = ['Cotton', 'Polyester', 'Satin', 'Silk', 'Velvet', 'Leather', 'Synthetic'];

export default function SearchResults() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  const category = searchParams.get("category") || "";
  const currency = searchParams.get("currency") || "NGN";

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pagination, setPagination] = useState<PaginationData>({
    total: 0,
    page: 1,
    limit: 12,
    totalPages: 0,
    hasMore: false,
  });
  const [currentPage, setCurrentPage] = useState(1);

  // Filter states
  const [selectedType, setSelectedType] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedMaterial, setSelectedMaterial] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  
  // Header visibility state
  const [headerVisible, setHeaderVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  const formatPrice = (price: number) => {
    const converted = price * (CURRENCY_RATES[currency]?.rate || 1);
    const symbol = CURRENCY_RATES[currency]?.symbol || "₦";
    
    if (currency === "INR" || currency === "NGN") {
      return `${symbol}${converted.toFixed(0)}`;
    }
    return `${symbol}${converted.toFixed(2)}`;
  };

  useEffect(() => {
    const fetchSearchResults = async () => {
      if (!query.trim()) {
        setError("Please enter a search term");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const params = new URLSearchParams();
        params.append("search", query);
        if (category) params.append("category", category);
        if (selectedType) params.append("costumeType", selectedType);
        if (selectedCountry) params.append("country", selectedCountry);
        if (selectedColor) params.append("color", selectedColor);
        if (selectedMaterial) params.append("material", selectedMaterial);
        params.append("page", currentPage.toString());
        params.append("limit", "12");

        const response = await fetch(`/api/products?${params.toString()}`);
        if (!response.ok) throw new Error("Failed to fetch search results");

        const data = await response.json();
        setProducts(data.data);
        setPagination(data.pagination);
      } catch (err) {
        setError("Failed to fetch search results. Please try again.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchSearchResults();
  }, [query, category, selectedType, selectedCountry, selectedColor, selectedMaterial, currentPage]);

  // Handle scroll to hide/show header
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Show header when scrolling up or at top
      if (currentScrollY < lastScrollY || currentScrollY < 50) {
        setHeaderVisible(true);
      } else if (currentScrollY > lastScrollY && currentScrollY > 50) {
        // Hide header when scrolling down
        setHeaderVisible(false);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Header with Search and Filters */}
      <div className={`fixed md:sticky top-16 md:top-0 left-0 right-0 z-30 bg-white border-b border-gray-200 shadow-md transition-all duration-300 ${
        headerVisible ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0 pointer-events-none"
      }`}>
        <div className="max-w-7xl mx-auto px-4 py-3">
          {/* Search Bar */}
          <div className="flex items-center gap-2 mb-3">
            <Link
              href="/"
              className="flex items-center justify-center w-9 h-9 rounded-lg bg-gray-100 hover:bg-gray-200 transition text-gray-700 flex-shrink-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div className="flex-1">
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-300 rounded-lg px-3 py-2">
                <Search className="h-4 w-4 text-gray-400" />
                <span className="text-base font-semibold text-gray-900 flex-1 truncate">
                  {query || "Search costumes..."}
                </span>
              </div>
            </div>
          </div>

          {/* Results Info and Horizontal Filters */}
          <div className="space-y-2">
            {/* Info */}
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-bold text-gray-900">
                  {pagination.total} result{pagination.total !== 1 ? "s" : ""} found
                </p>
                {query && <p className="text-xs text-gray-600">for <span className="font-semibold">&quot;{query}&quot;</span></p>}
              </div>
              {(selectedType || selectedCountry || selectedColor || selectedMaterial) && (
                <button
                  onClick={() => {
                    setSelectedType("");
                    setSelectedCountry("");
                    setSelectedColor("");
                    setSelectedMaterial("");
                    setCurrentPage(1);
                  }}
                  className="px-3 py-1 bg-red-100 text-red-700 rounded-lg font-semibold hover:bg-red-200 transition text-xs ml-2 flex-shrink-0"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Horizontal Filters */}
            <div className="flex flex-wrap gap-2 pb-1">
              {/* Costume Type Filter */}
              <div className="flex items-center gap-1.5">
                <label className="text-xs font-semibold text-gray-600 whitespace-nowrap">TYPE:</label>
                <select
                  value={selectedType}
                  onChange={(e) => {
                    setSelectedType(e.target.value);
                    setSelectedCountry(""); // Reset country when type changes
                    setCurrentPage(1);
                  }}
                  className="px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-lime-500 text-xs bg-white hover:border-lime-400 transition cursor-pointer"
                >
                  <option value="">All</option>
                  {COSTUME_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              {/* Country Filter - Only show if Traditional Africa is selected */}
              {selectedType === "Traditional Africa" && (
                <div className="flex items-center gap-1.5">
                  <label className="text-xs font-semibold text-gray-600 whitespace-nowrap">COUNTRY:</label>
                  <select
                    value={selectedCountry}
                    onChange={(e) => {
                      setSelectedCountry(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-lime-500 text-xs bg-white hover:border-lime-400 transition cursor-pointer"
                  >
                    <option value="">All Countries</option>
                    {TRADITIONAL_AFRICA_COUNTRIES.map(country => (
                      <option key={country} value={country}>{country}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Color Filter */}
              <div className="flex items-center gap-1.5">
                <label className="text-xs font-semibold text-gray-600 whitespace-nowrap">COLOR:</label>
                <select
                  value={selectedColor}
                  onChange={(e) => {
                    setSelectedColor(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-lime-500 text-xs bg-white hover:border-lime-400 transition cursor-pointer"
                >
                  <option value="">All</option>
                  {COLORS.map(color => (
                    <option key={color} value={color}>{color}</option>
                  ))}
                </select>
              </div>

              {/* Material Filter */}
              <div className="flex items-center gap-1.5">
                <label className="text-xs font-semibold text-gray-600 whitespace-nowrap">MATERIAL:</label>
                <select
                  value={selectedMaterial}
                  onChange={(e) => {
                    setSelectedMaterial(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-lime-500 text-xs bg-white hover:border-lime-400 transition cursor-pointer"
                >
                  <option value="">All</option>
                  {MATERIALS.map(material => (
                    <option key={material} value={material}>{material}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-4 pt-44 md:pt-4">
        {/* Error State */}
        {error && !loading && (
          <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 mb-6">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lime-600"></div>
            <p className="mt-4 text-gray-600">Searching for products...</p>
          </div>
        )}

        {/* No Results */}
        {!loading && !error && products.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="text-6xl mb-4">🔍</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              No products found
            </h2>
            <p className="text-gray-600 mb-6">
              Try adjusting your search terms or filters
            </p>
            <Link
              href="/"
              className="px-6 py-3 bg-lime-600 hover:bg-lime-700 text-white font-semibold rounded-lg transition"
            >
              Browse All Products
            </Link>
          </div>
        )}

        {/* Results */}
        {!loading && !error && products.length > 0 && (
          <>
            {/* Products Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {products.map((product) => {
                const productId = product.id || product._id || '';
                return (
                  <ProductCard
                    key={productId}
                    product={{
                      ...product,
                      id: productId,
                      badge: product.badge || null,
                    }}
                    formattedPrice={formatPrice(product.sellPrice)}
                    currency={currency}
                  />
                );
              })}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 py-8">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition font-semibold"
                >
                  ← Previous
                </button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(pagination.totalPages, 7) }, (_, i) => {
                    const pageNum = i + 1;
                    const isActive = currentPage === pageNum;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-10 h-10 rounded-lg font-semibold transition ${
                          isActive
                            ? "bg-lime-600 text-white shadow-lg"
                            : "border border-gray-300 text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => setCurrentPage((prev) => Math.min(pagination.totalPages, prev + 1))}
                  disabled={!pagination.hasMore}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition font-semibold"
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
