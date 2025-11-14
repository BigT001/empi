"use client";

import Image from "next/image";
import { ShoppingCart, Info } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { CURRENCY_RATES } from "./constants";

interface Product {
  id: string;
  name: string;
  sellPrice: number;
  rentPrice: number;
  image: string;
  badge: string | null;
  description?: string;
  category: string;
}

interface ProductCardProps {
  product: Product;
  formattedPrice: string;
  currency?: string;
}

export function ProductCard({ product, formattedPrice: initialFormattedPrice, currency = "NGN" }: ProductCardProps) {
  const [cardMode, setCardMode] = useState("buy");

  // Format price based on currency
  const formatPrice = (price: number) => {
    const converted = price * CURRENCY_RATES[currency].rate;
    const symbol = CURRENCY_RATES[currency].symbol;
    
    if (currency === "INR" || currency === "NGN") {
      return `${symbol}${converted.toFixed(0)}`;
    }
    return `${symbol}${converted.toFixed(2)}`;
  };

  const displayPrice = cardMode === "rent" ? formatPrice(product.rentPrice) : formatPrice(product.sellPrice);

  return (
    <article 
      className="group h-full flex flex-col border border-gray-200 rounded-xl overflow-hidden hover:border-gray-400 hover:shadow-lg transition"
    >
      {/* Image Section */}
      <div className="relative w-full aspect-[4/5] overflow-hidden flex-shrink-0">
        {product.badge && (
          <div className="absolute top-3 right-3 z-10 bg-lime-600 text-white text-xs font-bold px-3 py-1 rounded-full">
            {product.badge}
          </div>
        )}
        <Image 
          src={product.image} 
          alt={product.name} 
          fill 
          className="object-contain group-hover:scale-105 transition duration-300 p-2"
        />
      </div>

      {/* Content Section - With full background */}
      <div className="p-4 flex flex-col flex-grow bg-white">
        <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 flex-grow">{product.name}</h3>
        <p className="mt-3 text-lg font-bold text-gray-900">{displayPrice}</p>
        
        {/* Buy/Rent Toggle */}
        <div className="mt-4 relative inline-flex items-center bg-gray-100 rounded-lg p-1 border border-gray-200 w-full">
          <button
            onClick={() => setCardMode("buy")}
            className={`flex-1 px-3 py-2 rounded font-semibold text-sm transition-all ${cardMode === "buy" ? "bg-lime-600 text-white" : "text-gray-600 hover:text-gray-900"}`}
          >
            Buy
          </button>
          <button
            onClick={() => setCardMode("rent")}
            className={`flex-1 px-3 py-2 rounded font-semibold text-sm transition-all ${cardMode === "rent" ? "bg-lime-600 text-white" : "text-gray-600 hover:text-gray-900"}`}
          >
            Rent
          </button>
        </div>

        {/* Buttons Section */}
        <div className="mt-3 flex gap-3">
          <button className="flex-1 rounded-lg bg-lime-600 hover:bg-lime-700 text-white px-4 py-2 font-semibold transition flex items-center justify-center gap-2 text-sm">
            <ShoppingCart className="h-4 w-4" />
            Add to cart
          </button>
          <Link href={`/product/${product.id}`}>
            <button className="px-4 py-2 rounded-lg border-2 border-gray-300 text-gray-900 hover:bg-gray-50 font-semibold transition flex items-center justify-center gap-1 text-sm h-full">
              <Info className="h-4 w-4" />
              Info
            </button>
          </Link>
        </div>
      </div>
    </article>
  );
}
