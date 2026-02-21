"use client";

import Image from "next/image";
import { ShoppingCart, Info } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { CURRENCY_RATES } from "./constants";
import { useCart } from "./CartContext";
import { useMode } from "@/app/context/ModeContext";
import { Toast } from "./Toast";
import { Portal } from "./Portal";

interface Product {
  id?: string;
  _id?: string;
  name: string;
  sellPrice: number;
  rentPrice: number;
  imageUrl: string;
  imageUrls?: string[];
  badge: string | null;
  description?: string;
  category: string;
  availableForBuy?: boolean;
  availableForRent?: boolean;
}

interface ProductCardProps {
  product: Product;
  formattedPrice: string;
  currency?: string;
}

export function ProductCard({ product, formattedPrice: initialFormattedPrice, currency = "NGN" }: ProductCardProps) {
  const { addItem, canAddItem, getCartMode } = useCart();
  const [showNotification, setShowNotification] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Get safe product ID (handle both id and _id from MongoDB)
  const productId = product.id || (product as any)._id || '';

  // Determine availability
  const availableForBuy = product.availableForBuy !== false; // Default true
  const availableForRent = product.availableForRent !== false; // Default true
  const isRentalOnly = availableForRent && !availableForBuy;
  const isSaleOnly = availableForBuy && !availableForRent;

  // Set initial mode based on availability
  const initialMode = !availableForBuy ? "rent" : !availableForRent ? "buy" : "buy";
  const { mode: cardMode, setMode: setCardMode, isHydrated } = useMode(productId, initialMode as any);
  const [mainImageIndex, setMainImageIndex] = useState(0);

  const handleAddToCart = () => {
    // Validate cart mode compatibility
    const validation = canAddItem(cardMode);
    if (!validation.canAdd) {
      setErrorMessage(validation.message);
      setShowError(true);
      setTimeout(() => setShowError(false), 4000);
      return;
    }

    const price = cardMode === "rent" ? product.rentPrice : product.sellPrice;

    // For rental items, default to 1 day when adding from card
    let rentalMetadata = {};
    if (cardMode === "rent") {
      const rentalDays = 1; // Default to 1 day when adding from card
      rentalMetadata = {
        rentalDays,
      };
    }

    addItem({
      id: productId,
      name: product.name,
      price: price,
      image: product.imageUrl,
      mode: cardMode as "buy" | "rent",
      quantity: 1,
      ...rentalMetadata,
    });

    // Show notification
    setShowNotification(true);

    // Hide notification after 3 seconds
    setTimeout(() => {
      setShowNotification(false);
    }, 3000);
  };

  // Get all images - use imageUrls array if available, otherwise use main imageUrl
  const allImages = (product.imageUrls && product.imageUrls.length > 0)
    ? product.imageUrls
    : [product.imageUrl];

  const mainImage = allImages[mainImageIndex] || product.imageUrl;

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
    <>
      <article
        className="group relative flex flex-col bg-white dark:bg-[#0a0a0a] rounded-2xl md:rounded-[2.5rem] overflow-hidden transition-all duration-700 md:hover:-translate-y-2"
      >
        {/* Main Image Section */}
        <div className="relative w-full aspect-[4/5] overflow-hidden bg-gray-50 dark:bg-zinc-900/50">
          <Link href={`/product/${productId}?mode=${cardMode}`} className="block w-full h-full">
            <Image
              src={mainImage}
              alt={product.name}
              fill
              className="object-cover transition-transform duration-1000 group-hover:scale-110"
              priority
            />
            {/* Soft Gradient Overlay for Readability */}
            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          </Link>

          {/* Premium Badge */}


          {/* Quick Info Overlay - Appears on Hover on desktop, always partially visible or accessible on mobile */}
          <div className="absolute inset-x-2 bottom-2 md:inset-x-5 md:bottom-5 z-20 flex items-center justify-between opacity-100 md:opacity-0 md:group-hover:opacity-100 translate-y-0 md:translate-y-4 md:group-hover:translate-y-0 transition-all duration-500">
            <div className="flex gap-2">
              <Link
                href={`/product/${productId}?mode=${cardMode}`}
                className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/20 md:bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white hover:bg-lime-500 hover:text-slate-950 transition-colors"
                title="View Details"
              >
                <Info className="w-3 h-3 md:w-4 md:h-4" />
              </Link>
            </div>
            <button
              onClick={handleAddToCart}
              disabled={(cardMode === "buy" && !availableForBuy) || (cardMode === "rent" && !availableForRent)}
              className="h-8 md:h-10 px-3 md:px-6 rounded-full bg-lime-500 text-slate-950 font-black text-[8px] md:text-[10px] uppercase tracking-widest shadow-xl shadow-lime-500/20 active:scale-95 transition-all"
            >
              Add
            </button>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-4 md:p-8 flex flex-col flex-grow">
          <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-1 md:gap-4 mb-4">
            <div className="flex-grow">
              <Link href={`/product/${productId}?mode=${cardMode}`}>
                <h3 className="text-lg md:text-2xl font-black text-slate-900 dark:text-white font-playfair leading-tight hover:text-lime-600 transition-colors line-clamp-2 md:line-clamp-1">
                  {product.name}
                </h3>
              </Link>
            </div>
            <p className="text-lg md:text-lg font-black text-lime-600 font-outfit shrink-0">
              {displayPrice}
            </p>
          </div>

          {/* Buy/Rent Toggle - Refined Pill Design */}
          <div className="mt-auto pt-4 md:pt-6 border-t border-slate-100 dark:border-white/5 flex flex-col gap-3 md:gap-4">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Service Option</span>
              <div className="flex p-1 bg-slate-100 dark:bg-white/5 rounded-full border border-slate-200 dark:border-white/10">
                <button
                  onClick={() => availableForBuy && setCardMode("buy")}
                  disabled={!availableForBuy}
                  className={`px-3 md:px-4 py-1 md:py-1.5 rounded-full text-[8px] md:text-[10px] font-black uppercase tracking-widest transition-all ${cardMode === "buy"
                    ? "bg-slate-900 text-white shadow-md"
                    : "text-slate-500 hover:text-slate-900 opacity-60"
                    }`}
                >
                  Buy
                </button>
                <button
                  onClick={() => availableForRent && setCardMode("rent")}
                  disabled={!availableForRent}
                  className={`px-3 md:px-4 py-1 md:py-1.5 rounded-full text-[8px] md:text-[10px] font-black uppercase tracking-widest transition-all ${cardMode === "rent"
                    ? "bg-slate-900 text-white shadow-md"
                    : "text-slate-500 hover:text-slate-900 opacity-60"
                    }`}
                >
                  Rent
                </button>
              </div>
            </div>

            {/* Availability Messaging with subtle icons */}
            {(!availableForBuy || !availableForRent) && (
              <p className="flex items-center gap-2 text-[10px] font-bold text-slate-500 dark:text-slate-400 italic">
                <span className="w-1 h-1 rounded-full bg-lime-500" />
                {isRentalOnly ? "This exclusive piece is reserved for rental only." : "This limited edition is available for sale only."}
              </p>
            )}
          </div>
        </div>

        {/* Hover Highlight Border */}
        <div className="absolute inset-0 border-2 border-lime-500/0 md:group-hover:border-lime-500/10 pointer-events-none rounded-2xl md:rounded-[2.5rem] transition-colors duration-500" />
      </article>

      {/* Add to Cart Success Toast - Using Portal to escape stacking context */}
      {showNotification && (
        <Portal>
          <Toast
            message="Added to Cart!"
            subtitle={product.name}
            type="success"
            duration={3000}
            onClose={() => setShowNotification(false)}
          />
        </Portal>
      )}

      {/* Cart Mode Conflict Error Toast - Using Portal to escape stacking context */}
      {showError && (
        <Portal>
          <Toast
            message="Cannot Mix Order Types"
            subtitle={errorMessage}
            type="error"
            duration={4000}
            onClose={() => setShowError(false)}
          />
        </Portal>
      )}
    </>
  );
}