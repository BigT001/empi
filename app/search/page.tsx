"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center justify-center w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 transition text-gray-700"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Search className="h-5 w-5 text-gray-400" />
                <span className="text-lg font-bold text-gray-900">
                  Search Results
                </span>
              </div>
              <p className="text-sm text-gray-600">
                {query && (
                  <>
                    Results for <span className="font-semibold">"{query}"</span>
                    {category && <span> in {category}</span>}
                  </>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Error State */}
        {error && !loading && (
          <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
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
              Try adjusting your search terms or browsing by category
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
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Found {pagination.total} product{pagination.total !== 1 ? "s" : ""}
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Page {pagination.page} of {pagination.totalPages}
                  </p>
                </div>
              </div>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
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
              <div className="flex items-center justify-center gap-4 py-8">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  Previous
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(
                    (page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`w-10 h-10 rounded-lg font-semibold transition ${
                          currentPage === page
                            ? "bg-lime-600 text-white"
                            : "border border-gray-300 text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        {page}
                      </button>
                    )
                  )}
                </div>
                <button
                  onClick={() => setCurrentPage((prev) => Math.min(pagination.totalPages, prev + 1))}
                  disabled={!pagination.hasMore}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
