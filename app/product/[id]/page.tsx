"use client";

import { useState, use } from "react";
import Image from "next/image";
import Link from "next/link";
import { ShoppingCart, ArrowLeft, Heart } from "lucide-react";
import { products, CURRENCY_RATES } from "@/app/components/constants";

export default function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const product = products.find((p) => p.id === id);
  const [mode, setMode] = useState("buy");
  const [quantity, setQuantity] = useState(1);
  const [currency, setCurrency] = useState("NGN");
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Product not found</h1>
          <Link href="/" className="text-lime-600 hover:text-lime-700 font-semibold">
            Back to shop
          </Link>
        </div>
      </div>
    );
  }

  // Format price based on currency
  const formatPrice = (price: number) => {
    const converted = price * CURRENCY_RATES[currency].rate;
    const symbol = CURRENCY_RATES[currency].symbol;

    if (currency === "INR" || currency === "NGN") {
      return `${symbol}${converted.toFixed(0)}`;
    }
    return `${symbol}${converted.toFixed(2)}`;
  };

  const displayPrice = mode === "rent" ? formatPrice(product.rentPrice) : formatPrice(product.sellPrice);

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Header */}
      <header className="border-b border-gray-100 sticky top-0 z-40 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-gray-700 hover:text-lime-600 transition font-semibold">
            <ArrowLeft className="h-5 w-5" />
            Back to Shop
          </Link>
          <div className="flex items-center gap-4">
            <button className="p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition">
              <Heart className="h-5 w-5" />
            </button>
            <button className="flex items-center gap-2 bg-lime-600 hover:bg-lime-700 text-white px-4 py-2 rounded-lg font-semibold transition">
              <ShoppingCart className="h-4 w-4" />
              <span className="text-sm">Cart</span>
            </button>
          </div>
        </div>
      </header>

      {/* Product Details */}
      <main className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Image */}
          <div className="flex items-center justify-center bg-gray-50 rounded-2xl p-8 h-96 lg:h-auto">
            <div className="relative w-full h-full">
              <Image
                src={product.image}
                alt={product.name}
                fill
                className="object-contain"
              />
              {product.badge && (
                <div className="absolute top-4 right-4 bg-lime-600 text-white text-sm font-bold px-4 py-2 rounded-full">
                  {product.badge}
                </div>
              )}
            </div>
          </div>

          {/* Product Info */}
          <div className="flex flex-col justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-4">{product.name}</h1>

              {/* Price */}
              <div className="mb-8">
                <div className="flex items-baseline gap-4 mb-4">
                  <span className="text-4xl font-bold text-gray-900">{displayPrice}</span>
                  {mode === "rent" && (
                    <span className="text-gray-600 text-lg">/ per day</span>
                  )}
                </div>
                {mode === "buy" && product.rentPrice > 0 && (
                  <p className="text-gray-600">
                    Or rent for {formatPrice(product.rentPrice)} <span className="text-sm">/ per day</span>
                  </p>
                )}
              </div>

              {/* Description */}
              <p className="text-gray-700 text-lg mb-8 leading-relaxed">{product.description}</p>

              {/* Product Details */}
              <div className="bg-gray-50 rounded-xl p-6 mb-8">
                <h3 className="font-semibold text-gray-900 mb-4">Product Details</h3>
                <ul className="space-y-3 text-gray-700">
                  <li className="flex justify-between">
                    <span>Category:</span>
                    <span className="font-semibold">Premium Costume</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Condition:</span>
                    <span className="font-semibold">Brand New</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Material:</span>
                    <span className="font-semibold">High-Quality Fabric</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Size:</span>
                    <span className="font-semibold">One Size Fits Most</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Action Section */}
            <div className="space-y-6">
              {/* Buy/Rent Toggle */}
              <div className="relative inline-flex items-center bg-gray-100 rounded-lg p-1 border border-gray-200 w-full">
                <button
                  onClick={() => setMode("buy")}
                  className={`flex-1 px-4 py-3 rounded font-semibold transition-all ${
                    mode === "buy" ? "bg-lime-600 text-white" : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Buy
                </button>
                <button
                  onClick={() => setMode("rent")}
                  className={`flex-1 px-4 py-3 rounded font-semibold transition-all ${
                    mode === "rent" ? "bg-lime-600 text-white" : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Rent
                </button>
              </div>

              {/* Quantity */}
              <div className="flex items-center gap-4">
                <label className="font-semibold text-gray-900">Quantity:</label>
                <div className="flex items-center border border-gray-300 rounded-lg">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 transition"
                  >
                    −
                  </button>
                  <span className="px-6 py-2 font-semibold">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 transition"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Currency Selector */}
              <div className="relative">
                <label className="block text-sm font-semibold text-gray-900 mb-2">Currency:</label>
                <button
                  onClick={() => setShowCurrencyDropdown(!showCurrencyDropdown)}
                  className="w-full text-left flex items-center justify-between px-4 py-3 border border-gray-300 rounded-lg hover:border-lime-600 transition"
                >
                  <span>{CURRENCY_RATES[currency].symbol} {currency}</span>
                  <span className="text-gray-600">▼</span>
                </button>
                {showCurrencyDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg border border-gray-200 shadow-lg z-50">
                    {Object.entries(CURRENCY_RATES).map(([code, data]) => (
                      <button
                        key={code}
                        onClick={() => {
                          setCurrency(code);
                          setShowCurrencyDropdown(false);
                        }}
                        className={`w-full text-left px-4 py-2 hover:bg-lime-50 hover:text-lime-600 transition ${
                          currency === code ? "bg-lime-100 text-lime-600 font-semibold" : "text-gray-700"
                        }`}
                      >
                        {data.symbol} {code} - {data.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Add to Cart Button */}
              <button className="w-full bg-lime-600 hover:bg-lime-700 text-white px-6 py-4 rounded-lg font-bold text-lg transition flex items-center justify-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Add {quantity} to Cart ({mode === "rent" ? "Rent" : "Buy"})
              </button>

              {/* Additional Info */}
              <div className="pt-6 border-t border-gray-200">
                <p className="text-sm text-gray-600 text-center">
                  {mode === "rent" ? "Rental period: 3 days" : "Free shipping on orders over $100"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Related Products Section */}
      <section className="mx-auto max-w-7xl px-6 py-12 border-t border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-8">You May Also Like</h2>
        <div className="grid gap-6 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
          {products
            .filter((p) => p.id !== product.id)
            .slice(0, 4)
            .map((relatedProduct) => (
              <Link key={relatedProduct.id} href={`/product/${relatedProduct.id}`}>
                <div className="bg-gray-50 rounded-xl overflow-hidden hover:shadow-lg transition cursor-pointer">
                  <div className="relative w-full aspect-[4/5]">
                    <Image
                      src={relatedProduct.image}
                      alt={relatedProduct.name}
                      fill
                      className="object-contain p-2"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 mb-2">
                      {relatedProduct.name}
                    </h3>
                    <p className="text-sm font-bold text-gray-900">
                      {formatPrice(relatedProduct.sellPrice)}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
        </div>
      </section>
    </div>
  );
}
