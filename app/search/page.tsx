"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Search, AlertCircle } from "lucide-react";
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

function SearchResultsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get("q") || "";
  const category = searchParams.get("category") || "";
  const currency = searchParams.get("currency") || "NGN";

  const [localQuery, setLocalQuery] = useState(query);

  // Sync local query when URL query changes
  useEffect(() => {
    // The URL is the source of truth when users navigate with browser history.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLocalQuery(query);
  }, [query]);

  const handleLocalSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (localQuery.trim()) {
      const params = new URLSearchParams(window.location.search);
      params.set('q', localQuery.trim());
      params.set('page', '1'); // reset page
      router.push(`/search?${params.toString()}`);
    }
  };

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

  // Header visibility state
  const [headerVisible, setHeaderVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  const formatPrice = (price: number | undefined | null) => {
    if (price === undefined || price === null || price <= 0) {
      return "Price on Request";
    }
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
  }, [query, category, currentPage]);

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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white dark:from-[#0a0a0a] dark:to-zinc-950 text-slate-900 dark:text-white transition-colors duration-300">
      {/* Header with search and result count */}
      <div className={`fixed md:sticky top-0 left-0 right-0 z-30 bg-white dark:bg-black border-b border-gray-200 dark:border-white/5 shadow-md transition-all duration-300 ${
        headerVisible ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0 pointer-events-none"
      }`}>
        <div className="max-w-7xl mx-auto px-4 py-3">
          {/* Search Bar */}
          <div className="flex items-center gap-2 mb-3">
            <Link
              href="/"
              className="flex items-center justify-center w-9 h-9 rounded-lg bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 transition text-gray-700 dark:text-gray-300 flex-shrink-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <form onSubmit={handleLocalSearchSubmit} className="flex-1">
              <div className="flex items-center gap-2 bg-gray-50 dark:bg-zinc-900 border border-gray-300 dark:border-white/10 rounded-lg px-3 py-1.5 focus-within:ring-2 focus-within:ring-lime-500/20">
                <Search className="h-4 w-4 text-gray-400 dark:text-gray-400" />
                <input
                  type="text"
                  placeholder="Search costumes..."
                  value={localQuery}
                  onChange={(e) => setLocalQuery(e.target.value)}
                  className="text-sm font-semibold text-gray-900 dark:text-white bg-transparent outline-none flex-1 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                />
              </div>
            </form>
          </div>

          <div>
            <p className="text-sm font-bold text-gray-900 dark:text-white">
              {pagination.total} result{pagination.total !== 1 ? "s" : ""} found
            </p>
            {query && <p className="text-xs text-gray-600 dark:text-gray-300">for <span className="font-semibold text-gray-900 dark:text-white">&quot;{query}&quot;</span></p>}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 pt-28 md:pt-4">
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
            <p className="mt-4 text-gray-600 dark:text-gray-400">Searching for products...</p>
          </div>
        )}

        {/* No Results */}
        {!loading && !error && products.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="text-6xl mb-4">🔍</div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              No products found
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Try adjusting your search term
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
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 mb-8">
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
                    compactOnMobile
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
                  className="px-4 py-2 rounded-lg border border-gray-300 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition font-semibold"
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
                            ? "bg-lime-600 text-white shadow-lg shadow-lime-600/20"
                            : "border border-gray-300 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5"
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
                  className="px-4 py-2 rounded-lg border border-gray-300 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition font-semibold"
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

export default function SearchResults() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a] flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lime-600"></div>
        <p className="mt-4 text-gray-600 dark:text-gray-400 font-bold uppercase tracking-wider text-xs">Loading Search...</p>
      </div>
    }>
      <SearchResultsContent />
    </Suspense>
  );
}
