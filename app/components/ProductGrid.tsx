"use client";

import { products, CURRENCY_RATES } from "./constants";
import { ProductCard } from "./ProductCard";

interface ProductGridProps {
  currency: string;
  category: string;
}

export function ProductGrid({ currency, category }: ProductGridProps) {
  const formatPrice = (price: number) => {
    const converted = price * CURRENCY_RATES[currency].rate;
    const symbol = CURRENCY_RATES[currency].symbol;
    
    if (currency === "INR" || currency === "NGN") {
      return `${symbol}${converted.toFixed(0)}`;
    }
    return `${symbol}${converted.toFixed(2)}`;
  };

  return (
    <section className="flex-grow mx-auto w-full max-w-7xl px-6 py-12">
      {/* Products Grid Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          {category === "kids" ? "Kids' Costumes" : "Adult Costumes"}
        </h1>
        <p className="text-gray-600 mt-2">
          {category === "kids"
            ? "Fun and magical costumes perfect for children"
            : "Discover our collection of handcrafted costumes"}
        </p>
      </div>

      {/* Products Grid - 12 Cards */}
      <div className="grid gap-6 grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4">
        {products
          .filter((product) => product.category === category)
          .map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              formattedPrice={formatPrice(product.sellPrice)}
              currency={currency}
            />
          ))}
      </div>
    </section>
  );
}
