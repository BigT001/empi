"use client";

import { useEffect, useState } from "react";
import { products, CURRENCY_RATES } from "./constants";
import { ProductCard } from "./ProductCard";

interface Product {
  id: string;
  name: string;
  description: string;
  sellPrice: number;
  rentPrice: number;
  category: string;
  badge?: string | null;
  image: string;
  images: string[];
  sizes?: string;
  color?: string;
  material?: string;
  condition?: string;
  careInstructions?: string;
  createdAt: string;
  updatedAt: string;
}

interface ProductGridProps {
  currency: string;
  category: string;
  initialProducts?: Product[];
}

export function ProductGrid({ currency, category, initialProducts }: ProductGridProps) {
  const [dbProducts, setDbProducts] = useState<Product[]>(initialProducts ?? []);
  const [loading, setLoading] = useState(!initialProducts);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Skip fetching if initialProducts were provided by server
    if (initialProducts) {
      setLoading(false);
      return;
    }

    const fetchProducts = async () => {
      try {
        // Check localStorage cache first (5 minute TTL)
        const cacheKey = `products_${category}`;
        const cached = localStorage.getItem(cacheKey);
        const cacheTime = localStorage.getItem(`${cacheKey}_time`);
        const now = Date.now();
        
        if (cached && cacheTime && now - parseInt(cacheTime) < 5 * 60 * 1000) {
          console.log("⚡ Returning products from localStorage cache");
          setDbProducts(JSON.parse(cached));
          setLoading(false);
          return;
        }

        console.log("📦 Fetching products from API...");
        const response = await fetch("/api/products");

        if (!response.ok) {
          throw new Error(`Failed to fetch products: ${response.status}`);
        }

        const data = await response.json();
        console.log("✅ Products fetched:", data.length, "products");
        
        // Cache in localStorage
        try {
          localStorage.setItem(cacheKey, JSON.stringify(data));
          localStorage.setItem(`${cacheKey}_time`, now.toString());
        } catch (e) {
          console.warn("⚠️ localStorage cache failed (quota or disabled)");
        }
        
        setDbProducts(data);
        setError(null);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        console.error("❌ Error fetching products:", errorMessage);
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();

    // Listen for product updates from admin (other tabs) and refetch
    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel("empi-products");
      bc.onmessage = (ev) => {
        if (ev?.data === "products-updated") {
          console.log("🔔 Products update event received, refetching...");
          fetchProducts();
        }
      };
    } catch (e) {
      bc = null;
    }

    const storageHandler = (e: StorageEvent) => {
      if (e.key === "empi-products-updated") {
        console.log("🔔 Storage event for products update, refetching...");
        fetchProducts();
      }
    };

    window.addEventListener("storage", storageHandler);

    return () => {
      if (bc) {
        try { bc.close(); } catch (e) {}
      }
      window.removeEventListener("storage", storageHandler);
    };
  }, [initialProducts, category]);

  const formatPrice = (price: number) => {
    const converted = price * CURRENCY_RATES[currency].rate;
    const symbol = CURRENCY_RATES[currency].symbol;
    
    if (currency === "INR" || currency === "NGN") {
      return `${symbol}${converted.toFixed(0)}`;
    }
    return `${symbol}${converted.toFixed(2)}`;
  };

  // Use database products, fall back to hardcoded products if empty
  const displayProducts = dbProducts.length > 0 ? dbProducts : products;
  
  // Filter by category only if not "all"
  const filteredProducts = category === "all" 
    ? displayProducts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    : displayProducts
        .filter((product) => product.category === category)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <section className="flex-grow mx-auto w-full max-w-7xl px-6 py-12">
      {/* Products Grid Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          {category === "kids" ? "Kids' Costumes" : category === "adults" ? "Adult Costumes" : "All Costumes"}
        </h1>
        <p className="text-gray-600 mt-2">
          {category === "kids"
            ? "Fun and magical costumes perfect for children"
            : category === "adults"
            ? "Discover our collection of handcrafted costumes"
            : "Browse our complete collection of beautiful costumes"}
        </p>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <p className="text-gray-500">Loading products...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="text-center py-12">
          <p className="text-red-500">Error loading products: {error}</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No products available in this category</p>
        </div>
      )}

      {/* Products Grid */}
      {!loading && filteredProducts.length > 0 && (
        <div className="grid gap-6 grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              formattedPrice={formatPrice(product.sellPrice)}
              currency={currency}
            />
          ))}
        </div>
      )}
    </section>
  );
}
