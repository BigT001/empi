"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { ShoppingCart, ArrowLeft, ChevronLeft, ChevronRight, Check, AlertCircle, X } from "lucide-react";
import { CURRENCY_RATES } from "@/app/components/constants";
import { useCart } from "@/app/components/CartContext";
import { useMode } from "@/app/context/ModeContext";

interface Product {
  id: string;
  _id?: string;
  name: string;
  description?: string | null;
  sellPrice: number;
  rentPrice: number;
  category: string;
  badge?: string | null;
  imageUrl: string;
  imageUrls: string[];
  sizes?: string | null;
  color?: string | null;
  material?: string | null;
  condition?: string | null;
  careInstructions?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

interface Props {
  product: any;
  allProducts: any[];
  currency?: string;
}

export default function ProductDetailClient({ product, allProducts, currency = "NGN" }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addItem } = useCart();
  
  // Get safe product ID first
  const productId = product.id || product._id || '';
  
  // Now use the productId with useMode
  const { mode, setMode, isHydrated } = useMode(productId);
  
  // Load mode from URL params only on initial mount
  useEffect(() => {
    const urlMode = searchParams.get('mode') as 'buy' | 'rent';
    if (urlMode && isHydrated) {
      setMode(urlMode);
    }
  }, [productId, isHydrated]);

  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState("");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [addedToCart, setAddedToCart] = useState(false);
  const [showRentalPolicy, setShowRentalPolicy] = useState(false);
  const [rentalDays, setRentalDays] = useState(1);

  const formatPrice = (price: number) => {
    const converted = price * CURRENCY_RATES[currency].rate;
    const symbol = CURRENCY_RATES[currency].symbol;
    if (currency === "INR" || currency === "NGN") {
      return `${symbol}${converted.toFixed(0)}`;
    }
    return `${symbol}${converted.toFixed(2)}`;
  };

  const displayPrice = mode === "rent" ? formatPrice(product.rentPrice) : formatPrice(product.sellPrice);

  // Rental policy constants
  const CAUTION_FEE_PERCENTAGE = 0.5; // 50% of first day rental price
  const LATE_FEE_PER_DAY = product.rentPrice; // Full rental price for each extra day

  const calculateRentalCost = (): { baseCost: number; cautionFee: number; total: number } | { baseCost: 0; cautionFee: 0; total: 0 } => {
    if (mode !== "rent") return { baseCost: 0, cautionFee: 0, total: 0 };
    const baseCost = product.rentPrice * rentalDays * quantity;
    const cautionFee = product.rentPrice * CAUTION_FEE_PERCENTAGE * quantity;
    return { baseCost, cautionFee, total: baseCost + cautionFee };
  };

  const rentalCost = calculateRentalCost();

  const handleAddToCart = () => {
    const price = mode === "rent" ? product.rentPrice : product.sellPrice;
    addItem({
      id: productId,
      name: product.name,
      price: price,
      image: product.imageUrl,
      mode: mode as "buy" | "rent",
      quantity: quantity,
      ...(mode === "rent" && {
        rentalDays,
        cautionFee: rentalCost.cautionFee,
        totalRentalCost: rentalCost.total,
      }),
    });
    
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  const nextImage = () => {
    if (product.imageUrls && product.imageUrls.length > 0) {
      setCurrentImageIndex((p) => (p + 1) % product.imageUrls.length);
    }
  };

  const prevImage = () => {
    if (product.imageUrls && product.imageUrls.length > 0) {
      setCurrentImageIndex((p) => (p - 1 + product.imageUrls.length) % product.imageUrls.length);
    }
  };

  const sizes = product.sizes ? product.sizes.split(",").map((s: string) => s.trim()) : [];
  const mainImage = product.imageUrls?.[currentImageIndex] ?? product.imageUrl;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Header */}
      <header className="border-b border-gray-200 sticky top-0 z-40 bg-white/95 backdrop-blur-sm shadow-sm">
        <div className="mx-auto max-w-7xl px-4 md:px-6 py-4 flex items-center justify-between">
          <Link href="/product" className="flex items-center gap-2 text-gray-700 hover:text-lime-600 transition font-semibold text-sm md:text-base">
            <ArrowLeft className="h-5 w-5" /> Back to Products
          </Link>
          <button onClick={() => router.push('/cart')} className="flex items-center gap-2 bg-lime-600 hover:bg-lime-700 text-white px-4 py-2.5 rounded-lg font-semibold transition shadow-lg hover:shadow-xl">
            <ShoppingCart className="h-5 w-5" /> Cart
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 md:px-6 py-8 md:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-16">
          {/* Image Gallery */}
          <div className="flex flex-col gap-4">
            {/* Main Image */}
            <div className="relative bg-white rounded-2xl overflow-hidden aspect-[4/5] shadow-lg border border-gray-100">
              <Image 
                src={mainImage} 
                alt={product.name} 
                fill 
                className="object-contain" 
                priority
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                quality={90}
              />
              {product.badge && (
                <div className="absolute top-4 right-4 bg-gradient-to-r from-lime-500 to-lime-600 text-white text-sm font-bold px-3 py-1.5 rounded-full shadow-lg">
                  {product.badge}
                </div>
              )}
              
              {/* Image Navigation */}
              {product.imageUrls && product.imageUrls.length > 1 && (
                <>
                  <button 
                    onClick={prevImage} 
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2.5 rounded-full z-10 shadow-lg transition"
                    title="Previous image"
                  >
                    <ChevronLeft className="h-6 w-6 text-gray-800" />
                  </button>
                  <button 
                    onClick={nextImage} 
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2.5 rounded-full z-10 shadow-lg transition"
                    title="Next image"
                  >
                    <ChevronRight className="h-6 w-6 text-gray-800" />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnail Gallery */}
            {product.imageUrls && product.imageUrls.length > 1 && (
              <div className="grid grid-cols-5 gap-2">
                {product.imageUrls.map((img: string, idx: number) => (
                  <button 
                    key={idx} 
                    onClick={() => setCurrentImageIndex(idx)} 
                    className={`relative aspect-square rounded-lg overflow-hidden border-2 transition cursor-pointer ${
                      idx === currentImageIndex 
                        ? 'border-lime-600 ring-2 ring-lime-300' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Image
                      src={img}
                      alt={`${product.name} - Image ${idx + 1}`}
                      fill
                      className="object-cover hover:scale-110 transition"
                      sizes="100px"
                      quality={75}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="flex flex-col justify-between">
            {/* Product Info */}
            <div>
              <div className="mb-3">
                <span className="inline-block text-xs font-semibold uppercase tracking-wider px-2 py-1 bg-lime-50 text-lime-700 rounded-full">
                  {product.category === 'kids' ? '👶 Kids Costume' : '👔 Adults Costume'}
                </span>
              </div>

              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 leading-tight">{product.name}</h1>

              {/* Buy/Rent Mode Toggle */}
              <div className="flex gap-3 mb-6">
                <button
                  onClick={() => setMode("buy")}
                  className={`flex-1 px-4 py-3 rounded-lg font-bold text-sm md:text-base transition-all ${
                    mode === "buy"
                      ? "bg-lime-600 text-white shadow-lg"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  💳 Buy
                </button>
                {product.rentPrice > 0 && (
                  <button
                    onClick={() => setMode("rent")}
                    className={`flex-1 px-4 py-3 rounded-lg font-bold text-sm md:text-base transition-all ${
                      mode === "rent"
                        ? "bg-blue-600 text-white shadow-lg"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    🎭 Rent
                  </button>
                )}
              </div>

              {/* Price Section */}
              <div className="mb-6 pb-6 border-b border-gray-200">
                <div className="flex items-baseline gap-3 mb-3">
                  <span className="text-4xl md:text-5xl font-bold text-lime-600">{displayPrice}</span>
                  {mode === 'rent' && <span className="text-lg text-gray-600">/ per day</span>}
                </div>
                {mode === 'buy' && product.rentPrice > 0 && (
                  <p className="text-sm text-gray-600">
                    💡 Or rent for <span className="font-semibold text-gray-900">{formatPrice(product.rentPrice)}/day</span>
                  </p>
                )}
              </div>

              {/* Description */}
              {product.description && (
                <p className="text-gray-700 text-base md:text-lg mb-6 leading-relaxed">
                  {product.description}
                </p>
              )}

              {/* Product Details Box */}
              {(product.color || product.material || product.condition || sizes.length > 0) && (
                <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-sm">
                  <h3 className="font-bold text-gray-900 mb-4 text-lg">Product Details</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {product.color && (
                      <div>
                        <p className="text-gray-600 font-medium">Color</p>
                        <p className="text-gray-900 font-semibold">{product.color}</p>
                      </div>
                    )}
                    {product.material && (
                      <div>
                        <p className="text-gray-600 font-medium">Material</p>
                        <p className="text-gray-900 font-semibold">{product.material}</p>
                      </div>
                    )}
                    {product.condition && (
                      <div>
                        <p className="text-gray-600 font-medium">Condition</p>
                        <p className="text-gray-900 font-semibold">{product.condition}</p>
                      </div>
                    )}
                    {sizes.length > 0 && (
                      <div>
                        <p className="text-gray-600 font-medium">Available Sizes</p>
                        <p className="text-gray-900 font-semibold">{product.sizes}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons Section */}
            <div className="space-y-4">
              {/* Size Selection */}
              {sizes.length > 0 && (
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-3">Select Size:</label>
                  <div className="flex flex-wrap gap-2">
                    {sizes.map((s: string) => (
                      <button 
                        key={s} 
                        onClick={() => setSelectedSize(s)} 
                        className={`px-4 py-2.5 rounded-lg border-2 font-semibold transition ${
                          selectedSize === s 
                            ? 'border-lime-600 bg-lime-50 text-lime-700' 
                            : 'border-gray-300 text-gray-700 hover:border-lime-300'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Rental Options - Show only when in Rent mode */}
              {mode === 'rent' && product.rentPrice > 0 && (
                <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 space-y-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900 mb-2">Rental Terms</h4>
                      <p className="text-xs text-gray-700 leading-relaxed mb-3">
                        Return required next day after use. Caution fee applies and is refundable upon proper return.
                      </p>
                      <button 
                        onClick={() => setShowRentalPolicy(true)}
                        className="text-blue-600 hover:text-blue-800 font-semibold text-xs underline"
                      >
                        View Full Rental Policy →
                      </button>
                    </div>
                  </div>

                  {/* Rental Days */}
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">Rental Duration (Days):</label>
                    <div className="flex gap-2 flex-wrap">
                      {[1, 2, 3, 7].map((days) => (
                        <button
                          key={days}
                          onClick={() => setRentalDays(days)}
                          className={`px-4 py-2 rounded-lg font-semibold transition border-2 ${
                            rentalDays === days
                              ? 'border-blue-600 bg-blue-50 text-blue-700'
                              : 'border-gray-300 text-gray-700 hover:border-blue-300'
                          }`}
                        >
                          {days}d
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Cost Breakdown */}
                  <div className="bg-white rounded-lg p-3 border border-gray-200">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700">Rental ({rentalDays} day{rentalDays !== 1 ? 's' : ''} x {quantity}):</span>
                        <span className="font-semibold text-gray-900">{formatPrice(rentalCost.baseCost)}</span>
                      </div>
                      <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                        <span className="text-gray-700">Caution Fee (50%):</span>
                        <span className="font-semibold text-gray-900">{formatPrice(rentalCost.cautionFee)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-gray-900">Total Cost:</span>
                        <span className="font-bold text-lg text-blue-600">{formatPrice(rentalCost.total)}</span>
                      </div>
                      <p className="text-xs text-gray-600 italic pt-1">Caution fee refunded upon timely return</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Quantity */}
              <div className="flex items-center gap-4">
                <label className="font-bold text-gray-900">Quantity:</label>
                <div className="flex items-center border-2 border-gray-300 rounded-lg">
                  <button 
                    onClick={() => setQuantity(Math.max(1, quantity - 1))} 
                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 transition font-bold"
                  >
                    −
                  </button>
                  <span className="px-6 py-2 font-bold text-gray-900">{quantity}</span>
                  <button 
                    onClick={() => setQuantity(quantity + 1)} 
                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 transition font-bold"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Add to Cart Button */}
              <button 
                onClick={handleAddToCart} 
                className={`w-full py-4 px-6 rounded-xl font-bold text-lg transition duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl ${
                  addedToCart
                    ? 'bg-green-500 hover:bg-green-600 text-white'
                    : 'bg-lime-600 hover:bg-lime-700 text-white'
                }`}
              >
                {addedToCart ? (
                  <>
                    <Check className="h-6 w-6" /> Added to Cart!
                  </>
                ) : (
                  <>
                    <ShoppingCart className="h-6 w-6" /> Add to Cart
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Related Products */}
      {allProducts.length > 1 && (
        <section className="border-t border-gray-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 md:px-6 py-12 md:py-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">You May Also Like</h2>
            <div className="grid gap-6 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
              {allProducts
                .filter(p => (p.id || p._id) !== productId && p.category === product.category)
                .slice(0, 4)
                .map(p => {
                  const pId = p.id || p._id;
                  return (
                    <Link key={pId} href={`/product/${pId}`}>
                      <div className="group bg-white rounded-xl overflow-hidden hover:shadow-xl transition cursor-pointer border border-gray-100 h-full flex flex-col">
                        <div className="relative w-full aspect-[4/5] overflow-hidden bg-gray-50">
                          <Image 
                            src={p.imageUrl} 
                            alt={p.name} 
                            fill 
                            className="object-cover group-hover:scale-105 transition duration-300"
                          />
                        </div>
                        <div className="p-4 flex-grow flex flex-col">
                          <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 mb-2">{p.name}</h3>
                          <p className="text-lg font-bold text-lime-600 mt-auto">{formatPrice(p.sellPrice)}</p>
                        </div>
                      </div>
                    </Link>
                  );
                })}
            </div>
          </div>
        </section>
      )}

      {/* Rental Policy Modal */}
      {showRentalPolicy && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Rental Policy</h2>
              <button 
                onClick={() => setShowRentalPolicy(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="h-6 w-6 text-gray-600" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Overview */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">Overview</h3>
                <p className="text-gray-700 leading-relaxed">
                  Our rental service offers flexible costume rental options for events and occasions. All rentals come with a refundable caution fee and must be returned according to the specified terms.
                </p>
              </div>

              {/* Rental Duration */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">Rental Duration & Return</h3>
                <div className="bg-blue-50 border-l-4 border-blue-600 p-4 rounded space-y-2">
                  <p className="font-semibold text-gray-900">📅 Return Deadline: Next Day After Use</p>
                  <ul className="list-disc list-inside space-y-1 text-gray-700 text-sm">
                    <li>Rental period starts from the date of pickup/delivery</li>
                    <li>Items must be returned by 6:00 PM on the next business day</li>
                    <li>Weekend rentals (Friday-Sunday) require return by Monday 6:00 PM</li>
                    <li>Holidays follow regular return schedule unless otherwise specified</li>
                  </ul>
                </div>
              </div>

              {/* Caution Fee */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">Caution Fee (Refundable)</h3>
                <div className="bg-green-50 border-l-4 border-green-600 p-4 rounded space-y-2">
                  <p className="font-semibold text-gray-900">🛡️ Security Deposit: 50% of First Day Rental Price</p>
                  <ul className="list-disc list-inside space-y-1 text-gray-700 text-sm">
                    <li>Required upfront with all rental bookings</li>
                    <li>Fully refundable if item returned in good condition by deadline</li>
                    <li>Protects against damage, loss, or improper care</li>
                    <li>Refund processed within 5-7 business days of return</li>
                  </ul>
                </div>
              </div>

              {/* Late Return Charges */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">Late Return Fees</h3>
                <div className="bg-orange-50 border-l-4 border-orange-600 p-4 rounded space-y-2">
                  <p className="font-semibold text-gray-900">⏰ Additional Charges for Late Returns</p>
                  <ul className="list-disc list-inside space-y-1 text-gray-700 text-sm">
                    <li><span className="font-semibold">First 24 hours late:</span> Full day rental charge applies</li>
                    <li><span className="font-semibold">Each additional day:</span> Full rental price per day</li>
                    <li><span className="font-semibold">Example:</span> If daily rental is ₦2,000 and returned 2 days late: ₦4,000 additional charge</li>
                    <li>Charges cumulative for each day overdue</li>
                    <li>After 7 days late: Item considered forfeited; full replacement cost applies</li>
                  </ul>
                </div>
              </div>

              {/* Condition & Care */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">Item Condition & Care</h3>
                <div className="space-y-3">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="font-semibold text-gray-900 mb-2">✓ Acceptable Condition</p>
                    <ul className="list-disc list-inside space-y-1 text-gray-700 text-sm">
                      <li>Normal wear and tear</li>
                      <li>Minor stains that come out with cleaning</li>
                      <li>Lint and surface dust</li>
                    </ul>
                  </div>
                  <div className="bg-red-50 p-4 rounded-lg">
                    <p className="font-semibold text-red-700 mb-2">✗ Damage (Caution Fee Deducted or Full Replacement)</p>
                    <ul className="list-disc list-inside space-y-1 text-gray-700 text-sm">
                      <li>Rips, tears, or large holes</li>
                      <li>Broken zippers, buttons, or fasteners</li>
                      <li>Permanent stains or discoloration</li>
                      <li>Missing pieces or accessories</li>
                      <li>Foul odor or biological contamination</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Cleaning & Delivery */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">Cleaning & Delivery</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-700">
                  <li>Items should be returned <span className="font-semibold">clean and dry</span></li>
                  <li>We provide delivery and pickup services for an additional fee</li>
                  <li>Direct returns at our store location are welcome</li>
                  <li>Items must be returned in original packaging when possible</li>
                </ul>
              </div>

              {/* Cancellation Policy */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">Cancellation & Modification</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-700">
                  <li>Cancellations up to 24 hours before rental: Full refund</li>
                  <li>Cancellations within 24 hours: 50% refund</li>
                  <li>No show on rental date: Caution fee forfeited</li>
                  <li>Modifications to rental period subject to availability</li>
                </ul>
              </div>

              {/* Contact & Support */}
              <div className="bg-lime-50 border-l-4 border-lime-600 p-4 rounded">
                <h4 className="font-bold text-gray-900 mb-2">Need Help?</h4>
                <p className="text-gray-700 text-sm">
                  For questions about rental terms, damage claims, or refunds, contact our customer service team. We're here to help!
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6 flex gap-3">
              <button 
                onClick={() => setShowRentalPolicy(false)}
                className="flex-1 px-4 py-3 rounded-lg font-bold bg-gray-100 text-gray-900 hover:bg-gray-200 transition"
              >
                Close
              </button>
              <button 
                onClick={() => setShowRentalPolicy(false)}
                className="flex-1 px-4 py-3 rounded-lg font-bold bg-lime-600 text-white hover:bg-lime-700 transition"
              >
                I Understand & Accept
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
