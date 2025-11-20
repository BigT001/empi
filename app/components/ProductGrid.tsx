"use client";

import { useEffect, useState } from "react";
import { products, CURRENCY_RATES } from "./constants";
import { ProductCard } from "./ProductCard";
import { useProducts } from "@/lib/useProducts";

interface Product {
  id?: string;
  _id?: string;
  name: string;
  description: string;
  sellPrice: number;
  rentPrice: number;
  category: string;
  badge: string | null;
  imageUrl: string;
  imageUrls: string[];
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
  const { products: cachedProducts, loading, error } = useProducts(category);
  const [dbProducts, setDbProducts] = useState<Product[]>(initialProducts ?? (cachedProducts as Product[]));
  const [showError, setShowError] = useState(false);

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
      {loading && dbProducts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">🔄 Loading products...</p>
        </div>
      )}

      {/* Error State - Only show if we have no products and cache failed */}
      {showError && !loading && dbProducts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-red-500">❌ Error loading products: {error}</p>
          <p className="text-gray-500 mt-2 text-sm">Please try refreshing the page. Admin must upload products to the database.</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredProducts.length === 0 && dbProducts.length > 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No products available in this category</p>
        </div>
      )}

      {/* Products Grid */}
      {filteredProducts.length > 0 && (
        <div className="grid gap-6 grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4">
          {filteredProducts.map((product, idx) => (
            <ProductCard
              key={product.id || (product as any)._id || `product-${idx}`}
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
