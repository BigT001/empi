"use client";

import Image from "next/image";
import { ShoppingCart, Info, Check } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { CURRENCY_RATES } from "./constants";
import { useCart } from "./CartContext";
import { useMode } from "@/app/context/ModeContext";

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
  const { addItem } = useCart();
  const [showNotification, setShowNotification] = useState(false);
  
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
    <article 
      className="group h-full flex flex-col border border-gray-200 rounded-lg md:rounded-xl overflow-hidden hover:border-gray-400 hover:shadow-lg transition"
    >
      {/* Main Image Section - Clickable */}
      <Link href={`/product/${productId}?mode=${cardMode}`} className="relative w-full aspect-[4/5] overflow-hidden flex-shrink-0 bg-gray-50 cursor-pointer">
        {product.badge && (
          <div className="absolute top-2 md:top-3 right-2 md:right-3 z-10 bg-lime-600 text-white text-xs font-bold px-2 md:px-3 py-1 rounded-full">
            {product.badge}
          </div>
        )}
        <Image 
          src={mainImage} 
          alt={product.name} 
          fill 
          className="object-contain group-hover:scale-105 transition duration-300 p-1 md:p-2"
        />
      </Link>

      {/* Thumbnail Images Grid - Only show if multiple images */}
      {allImages.length > 1 && (
        <div className="w-full px-2 md:px-3 py-2 md:py-3 bg-white border-t border-gray-100">
          <div className="grid grid-cols-5 gap-1.5 md:gap-2">
            {allImages.map((img, index) => (
              <button
                key={index}
                onClick={() => setMainImageIndex(index)}
                className={`relative aspect-square rounded overflow-hidden border-2 transition ${
                  mainImageIndex === index 
                    ? 'border-lime-600' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Image
                  src={img}
                  alt={`${product.name} - Image ${index + 1}`}
                  fill
                  className="object-cover hover:scale-110 transition"
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Content Section - With full background */}
      <div className="p-2 md:p-4 flex flex-col flex-grow bg-white">
        <h3 className="font-semibold text-gray-900 text-xs md:text-sm line-clamp-2 flex-grow">{product.name}</h3>
        <p className="mt-2 md:mt-3 text-base md:text-lg font-bold text-gray-900">{displayPrice}</p>
        
        {/* Availability Badge */}
        {(isRentalOnly || isSaleOnly) && (
          <div className="mt-2 inline-flex">
            {isRentalOnly && (
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-100 text-blue-700">
                🎪 Rental Only
              </span>
            )}
            {isSaleOnly && (
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-green-100 text-green-700">
                🛒 For Sale Only
              </span>
            )}
          </div>
        )}
        
        {/* Buy/Rent Toggle - Always show both options, but disable unavailable ones */}
        <div className="mt-2 md:mt-4 w-full space-y-1.5">
          <div className="relative inline-flex items-center bg-gray-100 rounded-lg p-0.5 md:p-1 border border-gray-200 w-full">
            {/* Buy Button */}
            <button
              onClick={() => availableForBuy && setCardMode("buy")}
              disabled={!availableForBuy}
              className={`flex-1 px-2 md:px-3 py-1.5 md:py-2 rounded font-semibold text-xs md:text-sm transition-all ${
                availableForBuy
                  ? cardMode === "buy" 
                    ? "bg-lime-600 text-white cursor-pointer" 
                    : "text-gray-600 hover:text-gray-900 cursor-pointer"
                  : "text-gray-400 cursor-not-allowed opacity-50"
              }`}
              title={!availableForBuy ? "Not available for purchase" : ""}
            >
              🛒 Buy
            </button>
            {/* Rent Button */}
            <button
              onClick={() => availableForRent && setCardMode("rent")}
              disabled={!availableForRent}
              className={`flex-1 px-2 md:px-3 py-1.5 md:py-2 rounded font-semibold text-xs md:text-sm transition-all ${
                availableForRent
                  ? cardMode === "rent" 
                    ? "bg-lime-600 text-white cursor-pointer" 
                    : "text-gray-600 hover:text-gray-900 cursor-pointer"
                  : "text-gray-400 cursor-not-allowed opacity-50"
              }`}
              title={!availableForRent ? "Not available for rental" : ""}
            >
              🎪 Rent
            </button>
          </div>
          
          {/* Availability Message */}
          {!availableForBuy && (
            <p className="text-xs text-blue-700 bg-blue-50 px-2 py-1 rounded border border-blue-200 font-medium">
              ✨ Rental Only - Not available for purchase
            </p>
          )}
          {!availableForRent && (
            <p className="text-xs text-green-700 bg-green-50 px-2 py-1 rounded border border-green-200 font-medium">
              ✨ For Sale Only - Not available for rental
            </p>
          )}
        </div>

        {/* Buttons Section */}
        <div className="mt-2 md:mt-3 flex flex-col md:flex-row gap-2 md:gap-3 w-full">
          <button 
            onClick={handleAddToCart}
            disabled={
              (cardMode === "buy" && !availableForBuy) || 
              (cardMode === "rent" && !availableForRent)
            }
            className={`flex-1 rounded-lg px-2 md:px-4 py-1.5 md:py-2 font-semibold transition flex items-center justify-center gap-1 md:gap-2 text-xs md:text-sm w-full ${
              (cardMode === "buy" && !availableForBuy) || (cardMode === "rent" && !availableForRent)
                ? "bg-gray-300 text-gray-500 cursor-not-allowed opacity-60"
                : "bg-lime-600 hover:bg-lime-700 text-white cursor-pointer"
            }`}
            title={
              (cardMode === "buy" && !availableForBuy) ? "Not available for purchase" :
              (cardMode === "rent" && !availableForRent) ? "Not available for rental" : ""
            }
          >
            <ShoppingCart className="h-3 w-3 md:h-4 md:w-4" />
            <span>Add to cart</span>
          </button>
          <Link href={`/product/${productId}?mode=${cardMode}`} className="flex-1 w-full">
            <button className="w-full px-2 md:px-4 py-1.5 md:py-2 rounded-lg border-2 border-gray-300 text-gray-900 hover:bg-gray-50 font-semibold transition flex items-center justify-center gap-1 text-xs md:text-sm">
              <Info className="h-3 w-3 md:h-4 md:w-4" />
              <span>Info</span>
            </button>
          </Link>
        </div>
      </div>

      {/* Add to Cart Notification - Bottom of screen */}
      {showNotification && (
        <div className="fixed bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-80 z-50 animate-in slide-in-from-bottom duration-300">
          <div className="bg-lime-600 text-white rounded-lg shadow-lg p-4 flex items-center gap-3">
            <div className="flex-shrink-0">
              <Check className="h-5 w-5" />
            </div>
            <div className="flex-grow">
              <p className="font-semibold text-sm">Added to cart!</p>
              <p className="text-xs opacity-90">{product.name}</p>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}