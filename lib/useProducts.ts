// Hook for fetching products with offline-first caching
import { useEffect, useState } from "react";
import { getCachedProducts, setCachedProducts } from "@/lib/productCache";

export interface Product {
  id: string;
  name: string;
  description: string;
  sellPrice: number;
  rentPrice: number;
  category: string;
  image: string;
  images: string[];
  badge: string | null;
  sizes?: string;
  color?: string;
  material?: string;
  condition?: string;
  careInstructions?: string;
  createdAt?: string;
  updatedAt?: string;
}

export function useProducts(category?: string) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFromCache, setIsFromCache] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError(null);
      setIsFromCache(false);

      try {
        // Step 1: Try to get from cache first (offline-first)
        const cached = getCachedProducts(category);
        if (cached && cached.length > 0) {
          console.log("📦 Loading products from cache");
          setProducts(cached);
          setIsFromCache(true);
        }

        // Step 2: Fetch fresh data from API in background
        const url = `/api/products${category ? `?category=${category}` : ""}`;
        console.log(`🌐 Fetching fresh products from ${url}`);

        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(`API returned ${response.status}`);
        }

        const data = await response.json();

        console.log(`✅ Fetched ${data.length} products from database`);

        // Cache successful API response
        if (data.length > 0) {
          setCachedProducts(data, category);
        }

        setProducts(data);
        setIsFromCache(false);
        setError(null);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Failed to fetch products";
        console.error("❌ Error fetching products:", errorMsg);
        setError(errorMsg);

        // If we have cached products, use them silently
        if (products.length === 0) {
          const cached = getCachedProducts(category);
          if (cached && cached.length > 0) {
            console.log("📦 Using cache as fallback due to error");
            setProducts(cached);
            setIsFromCache(true);
            setError(null); // Clear error if we have cache
          }
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [category]);

  return {
    products,
    loading,
    error,
    isFromCache,
    retry: () => {
      setLoading(true);
      setError(null);
    },
  };
}
