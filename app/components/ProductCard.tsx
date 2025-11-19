"use client";

import Image from "next/image";
import { ShoppingCart, Info, Trash2 } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { CURRENCY_RATES } from "./constants";
import { deleteProduct } from "@/app/product/actions";
import { useRouter } from "next/navigation";
import { useCart } from "./CartContext";

interface Product {
  id: string;
  name: string;
  sellPrice: number;
  rentPrice: number;
  image: string;
  images?: string[];
  badge: string | null;
  description?: string;
  category: string;
}

interface ProductCardProps {
  product: Product;
  formattedPrice: string;
  currency?: string;
  onDelete?: (productId: string) => void;
}

export function ProductCard({ product, formattedPrice: initialFormattedPrice, currency = "NGN", onDelete }: ProductCardProps) {
  const router = useRouter();
  const { addItem } = useCart();
  const [cardMode, setCardMode] = useState("buy");
  const [mainImageIndex, setMainImageIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleDeleteProduct = async () => {
    setIsDeleting(true);
    try {
      console.log("🗑️ Deleting product:", product.id);
      const result = await deleteProduct(product.id);
      
      if (!result.success) {
        console.error("❌ Delete failed:", result.error);
        alert(`Failed to delete: ${result.error}`);
        setIsDeleting(false);
        setShowDeleteModal(false);
        return;
      }
      
      console.log("✅ Product deleted successfully");
      
      // Clear localStorage cache for all categories
      ['all', 'adults', 'kids'].forEach(cat => {
        localStorage.removeItem(`products_${cat}`);
        localStorage.removeItem(`products_${cat}_time`);
      });
      
      // Notify other tabs/pages to refetch products
      try {
        const bc = new BroadcastChannel("empi-products");
        bc.postMessage("products-updated");
        bc.close();
      } catch (e) {
        // ignore if BroadcastChannel not supported
      }
      try {
        localStorage.setItem("empi-products-updated", Date.now().toString());
      } catch (e) {
        // ignore
      }
      
      // Remove from UI immediately
      if (onDelete) {
        onDelete(product.id);
      }
      setShowDeleteModal(false);
    } catch (e) {
      console.error("❌ Unexpected error:", e);
      alert("Error deleting product. Please try again.");
      setIsDeleting(false);
    }
  };

  const handleAddToCart = () => {
    const price = cardMode === "rent" ? product.rentPrice : product.sellPrice;
    addItem({
      id: product.id,
      name: product.name,
      price: price,
      image: product.image,
      mode: cardMode as "buy" | "rent",
      quantity: 1,
    });
    // Optional: Show a brief success message
    console.log(`✅ Added ${product.name} (${cardMode}) to cart`);
  };

  // Get all images - use images array if available, otherwise use main image
  const allImages = (product.images && product.images.length > 0) 
    ? product.images 
    : [product.image];
  
  const mainImage = allImages[mainImageIndex] || product.image;

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
      {/* Main Image Section */}
      <div className="relative w-full aspect-[4/5] overflow-hidden flex-shrink-0 bg-gray-50">
        {product.badge && (
          <div className="absolute top-2 md:top-3 right-2 md:right-3 z-10 bg-lime-600 text-white text-xs font-bold px-2 md:px-3 py-1 rounded-full">
            {product.badge}
          </div>
        )}
        <button
          onClick={() => setShowDeleteModal(true)}
          disabled={isDeleting}
          className="absolute top-2 md:top-3 left-2 md:left-3 z-10 bg-red-500 hover:bg-red-600 text-white p-1.5 md:p-2 rounded-full transition disabled:opacity-50"
          title="Delete product"
        >
          <Trash2 className="h-3 w-3 md:h-4 md:w-4" />
        </button>
        <Image 
          src={mainImage} 
          alt={product.name} 
          fill 
          className="object-contain group-hover:scale-105 transition duration-300 p-1 md:p-2"
        />
      </div>

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
            onClick={handleAddToCart}
            className="flex-1 rounded-lg bg-lime-600 hover:bg-lime-700 text-white px-2 md:px-4 py-1.5 md:py-2 font-semibold transition flex items-center justify-center gap-1 md:gap-2 text-xs md:text-sm w-full">
            <ShoppingCart className="h-3 w-3 md:h-4 md:w-4" />
            <span>Add to cart</span>
          </button>
          <Link href={`/product/${product.id}`} className="flex-1 w-full">
            <button className="w-full px-2 md:px-4 py-1.5 md:py-2 rounded-lg border-2 border-gray-300 text-gray-900 hover:bg-gray-50 font-semibold transition flex items-center justify-center gap-1 text-xs md:text-sm">
              <Info className="h-3 w-3 md:h-4 md:w-4" />
              <span>Info</span>
            </button>
          </Link>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Product?</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete <strong>{product.name}</strong>? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 rounded-lg border-2 border-gray-300 text-gray-900 hover:bg-gray-50 font-semibold transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteProduct}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white font-semibold transition disabled:opacity-50"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}
