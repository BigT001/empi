// Hook for fetching products with pagination
import { useEffect, useState, useCallback } from "react";

export interface Product {
  id?: string;
  _id?: string;
  name: string;
  description: string;
  sellPrice: number;
  rentPrice: number;
  category: string;
  imageUrl: string;
  imageUrls: string[];
  badge: string | null;
  sizes?: string;
  color?: string;
  material?: string;
  condition?: string;
  careInstructions?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface PaginationData {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
}

export function useProducts(category?: string) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationData | null>(null);

  const fetchProducts = useCallback(async (pageNum: number = 1, append: boolean = false) => {
    if (pageNum === 1) {
      setLoading(true);
    }
    setError(null);

    try {
      // Fetch fresh data from API (HTTP caching is handled by next.config)
      const url = `/api/products${category ? `?category=${category}` : "?"}${category ? "&" : "?"}page=${pageNum}&limit=12`;
      console.log(`🌐 Fetching products from ${url}`);

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`API returned ${response.status}`);
      }

      const data = await response.json();
      
      // Handle both old format (array) and new format (with pagination)
      const newProducts = Array.isArray(data) ? data : data.data;
      const paginationData = data.pagination;

      console.log(`✅ Fetched ${newProducts.length} products from database`);

      if (append && pageNum > 1) {
        setProducts(prev => [...prev, ...newProducts]);
      } else {
        setProducts(newProducts);
      }
      
      if (paginationData) {
        setPagination(paginationData);
      }
      setPage(pageNum);
      setError(null);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to fetch products";
      console.error("❌ Error fetching products:", errorMsg);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [category]);

  useEffect(() => {
    fetchProducts(1, false);
  }, [category, fetchProducts]);

  const loadMore = useCallback(() => {
    if (pagination?.hasMore && !loading) {
      fetchProducts(page + 1, true);
    }
  }, [pagination?.hasMore, loading, page, fetchProducts]);

  return {
    products,
    loading,
    error,
    pagination,
    loadMore,
    retry: () => {
      setLoading(true);
      setError(null);
      fetchProducts(1, false);
    },
  };
}
