// Hook for fetching products
import { useEffect, useState } from "react";

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

export function useProducts(category?: string) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch fresh data from API (HTTP caching is handled by next.config)
        const url = `/api/products${category ? `?category=${category}` : ""}`;
        console.log(`🌐 Fetching products from ${url}`);

        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(`API returned ${response.status}`);
        }

        const data = await response.json();
        console.log(`✅ Fetched ${data.length} products from database`);

        setProducts(data);
        setError(null);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Failed to fetch products";
        console.error("❌ Error fetching products:", errorMsg);
        setError(errorMsg);
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
    retry: () => {
      setLoading(true);
      setError(null);
    },
  };
}
