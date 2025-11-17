"use client";

import Image from "next/image";
import { ShoppingCart, Info } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { CURRENCY_RATES } from "./constants";
import { addToCart } from "../../lib/cart";

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
  const [added, setAdded] = useState(false);

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
      className="group h-full flex flex-col border border-gray-200 rounded-lg md:rounded-xl overflow-hidden hover:border-gray-400 hover:shadow-lg transition"
    >
      {/* Image Section */}
      <div className="relative w-full aspect-[4/5] overflow-hidden flex-shrink-0">
        {product.badge && (
          <div className="absolute top-2 md:top-3 right-2 md:right-3 z-10 bg-lime-600 text-white text-xs font-bold px-2 md:px-3 py-1 rounded-full">
            {product.badge}
          </div>
        )}
        <Image 
          src={product.image} 
          alt={product.name} 
          fill 
          className="object-contain group-hover:scale-105 transition duration-300 p-1 md:p-2"
        />
      </div>

      {/* Content Section - With full background */}
      <div className="p-2 md:p-4 flex flex-col flex-grow bg-white">
        <h3 className="font-semibold text-gray-900 text-xs md:text-sm line-clamp-2 flex-grow">{product.name}</h3>
        <p className="mt-2 md:mt-3 text-base md:text-lg font-bold text-gray-900">{displayPrice}</p>
        
        {/* Buy/Rent Toggle */}
        <div className="mt-2 md:mt-4 relative inline-flex items-center bg-gray-100 rounded-lg p-0.5 md:p-1 border border-gray-200 w-full">
          <button
            onClick={() => setCardMode("buy")}
            className={`flex-1 px-2 md:px-3 py-1.5 md:py-2 rounded font-semibold text-xs md:text-sm transition-all ${cardMode === "buy" ? "bg-lime-600 text-white" : "text-gray-600 hover:text-gray-900"}`}
          >
            Buy
          </button>
          <button
            onClick={() => setCardMode("rent")}
            className={`flex-1 px-2 md:px-3 py-1.5 md:py-2 rounded font-semibold text-xs md:text-sm transition-all ${cardMode === "rent" ? "bg-lime-600 text-white" : "text-gray-600 hover:text-gray-900"}`}
          >
            Rent
          </button>
        </div>

        {/* Buttons Section */}
        <div className="mt-2 md:mt-3 flex flex-col md:flex-row gap-2 md:gap-3 w-full">
          <button
            onClick={() => {
              const price = cardMode === "rent" ? product.rentPrice : product.sellPrice;
              const unitPrice = Number((price * CURRENCY_RATES[currency].rate).toFixed(2));
              addToCart({
                id: product.id,
                name: product.name,
                image: product.image,
                unitPrice,
                mode: cardMode as "buy" | "rent",
                currency,
                quantity: 1,
              });
              setAdded(true);
              setTimeout(() => setAdded(false), 1500);
            }}
            className="flex-1 rounded-lg bg-lime-600 hover:bg-lime-700 text-white px-2 md:px-4 py-1.5 md:py-2 font-semibold transition flex items-center justify-center gap-1 md:gap-2 text-xs md:text-sm w-full"
          >
            <ShoppingCart className="h-3 w-3 md:h-4 md:w-4" />
            <span>{added ? "Added" : "Add to cart"}</span>
          </button>
          <Link href={`/product/${product.id}`} className="flex-1 w-full">
            <button className="w-full px-2 md:px-4 py-1.5 md:py-2 rounded-lg border-2 border-gray-300 text-gray-900 hover:bg-gray-50 font-semibold transition flex items-center justify-center gap-1 text-xs md:text-sm">
              <Info className="h-3 w-3 md:h-4 md:w-4" />
              <span>Info</span>
            </button>
          </Link>
        </div>
      </div>
    </article>
  );
}
