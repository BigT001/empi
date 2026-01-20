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
import { PresaleNotice } from "@/app/components/PresaleNotice";

interface Product {
  id: string;
  _id?: string;
  name: string;
  description?: string | null;
  sellPrice: number;
  rentPrice: number;
  category: string;
  costumeType?: string | null;
  country?: string | null;
  badge?: string | null;
  imageUrl: string;
  imageUrls: string[];
  sizes?: string | null;
  color?: string | null;
  material?: string | null;
  condition?: string | null;
  careInstructions?: string | null;
  availableForBuy?: boolean;
  availableForRent?: boolean;
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
  const { addItem, items } = useCart();
  
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

  const formatPrice = (price: number) => {
    const converted = price * CURRENCY_RATES[currency].rate;
    const symbol = CURRENCY_RATES[currency].symbol;
    if (currency === "INR" || currency === "NGN") {
      return `${symbol}${converted.toFixed(0)}`;
    }
    return `${symbol}${converted.toFixed(2)}`;
  };

  const displayPrice = mode === "rent" ? formatPrice(product.rentPrice) : formatPrice(product.sellPrice);

  const handleAddToCart = () => {
    const price = mode === "rent" ? product.rentPrice : product.sellPrice;
    const productImage = product.imageUrl || (product.imageUrls && product.imageUrls[0]) || '';
    const cartItem: any = {
      id: productId,
      name: product.name,
      price: price,
      image: productImage,
      mode: mode as "buy" | "rent",
      quantity: quantity,
    };

    console.log('[ProductDetail] Adding to cart:', { name: product.name, hasImage: !!productImage, image: productImage ? productImage.substring(0, 50) : 'NO' });
    addItem(cartItem);
    
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-lime-50">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-transparent backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 md:px-6 py-4 flex items-center justify-between">
          <Link href="/product" className="flex items-center gap-2 text-gray-700 hover:text-lime-600 transition font-semibold text-sm md:text-base group">
            <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition" /> Back to Products
          </Link>
          <button onClick={() => router.push('/cart')} className="flex items-center gap-2 bg-gradient-to-r from-lime-600 to-green-600 hover:from-lime-700 hover:to-green-700 text-white px-4 py-2.5 rounded-xl font-semibold transition shadow-lg hover:shadow-xl relative">
            <ShoppingCart className="h-5 w-5" /> 
            <span className="hidden sm:inline">Cart</span>
            {items.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
                {items.length}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 md:px-6 py-8 md:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-16">
          {/* Image Gallery */}
          <div className="flex flex-col gap-4">
            {/* Main Image */}
            <div className="relative bg-gradient-to-br from-white to-gray-50 rounded-2xl overflow-hidden aspect-[4/5] shadow-xl border border-gray-200 hover:shadow-2xl transition duration-300">
              <Image 
                src={mainImage} 
                alt={product.name} 
                fill 
                className="object-contain p-4" 
                priority
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                quality={90}
              />
              {product.badge && (
                <div className="absolute top-4 right-4 bg-gradient-to-r from-lime-500 via-green-500 to-emerald-600 text-white text-sm font-black px-4 py-2 rounded-full shadow-xl transform -rotate-1 hover:rotate-0 transition">
                  ✨ {product.badge}
                </div>
              )}
              
              {/* Image Navigation */}
              {product.imageUrls && product.imageUrls.length > 1 && (
                <>
                  <button 
                    onClick={prevImage} 
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/95 hover:bg-white p-3 rounded-full z-10 shadow-xl transition hover:scale-110 active:scale-95"
                    title="Previous image"
                  >
                    <ChevronLeft className="h-6 w-6 text-gray-800" />
                  </button>
                  <button 
                    onClick={nextImage} 
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/95 hover:bg-white p-3 rounded-full z-10 shadow-xl transition hover:scale-110 active:scale-95"
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
                    className={`relative aspect-square rounded-xl overflow-hidden border-2 transition cursor-pointer transform hover:scale-105 ${
                      idx === currentImageIndex 
                        ? 'border-lime-600 ring-2 ring-lime-300 shadow-lg' 
                        : 'border-gray-300 hover:border-gray-400 shadow-md'
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
              <div className="mb-4 flex items-center gap-2">
                <span className="inline-block text-xs font-bold uppercase tracking-widest px-3 py-1.5 bg-gradient-to-r from-lime-100 to-green-100 text-lime-800 rounded-full border border-lime-300">
                  {product.category === 'kids' ? '👶 Kids Costume' : '👔 Adults Costume'}
                </span>
              </div>

              <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-4 leading-tight">{product.name}</h1>

              {/* Buy/Rent Mode Toggle */}
              <div className="flex gap-3 mb-6">
                {product.availableForBuy !== false && (
                  <button
                    onClick={() => setMode("buy")}
                    className={`flex-1 px-4 py-3 rounded-xl font-bold text-sm md:text-base transition-all transform ${
                      mode === "buy"
                        ? "bg-gradient-to-r from-lime-600 to-green-600 text-white shadow-lg hover:shadow-xl scale-105"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    💳 Buy
                  </button>
                )}
                {product.availableForRent !== false && product.rentPrice > 0 && (
                  <button
                    onClick={() => setMode("rent")}
                    className={`flex-1 px-4 py-3 rounded-xl font-bold text-sm md:text-base transition-all transform ${
                      mode === "rent"
                        ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg hover:shadow-xl scale-105"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    � Rent
                  </button>
                )}
                {product.availableForBuy === false && product.availableForRent !== false && (
                  <div className="flex-1 px-4 py-3 rounded-xl bg-blue-100 text-blue-800 font-bold text-center text-sm md:text-base border-2 border-blue-300 flex items-center justify-center gap-2">
                    <span>🎪</span> Rental Only
                  </div>
                )}
                {product.availableForRent === false && product.availableForBuy !== false && (
                  <div className="flex-1 px-4 py-3 rounded-xl bg-green-100 text-green-800 font-bold text-center text-sm md:text-base border-2 border-green-300 flex items-center justify-center gap-2">
                    <span>🛒</span> For Sale Only
                  </div>
                )}
                {product.availableForBuy === false && product.availableForRent === false && (
                  <div className="flex-1 px-4 py-3 rounded-xl bg-red-100 text-red-800 font-bold text-center text-sm md:text-base border-2 border-red-300 flex items-center justify-center gap-2">
                    <span>⚠️</span> Unavailable
                  </div>
                )}
              </div>

              {/* Price Section */}
              <div className="mb-6 pb-6 border-b-2 border-gray-200">
                <div className="flex items-baseline gap-3 mb-3">
                  <span className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-lime-600 to-green-600">{displayPrice}</span>
                  {mode === 'rent' && <span className="text-lg font-semibold text-gray-600">/ per day</span>}
                </div>
                {mode === 'buy' && product.rentPrice > 0 && (
                  <p className="text-sm text-gray-600 flex items-center gap-2">
                    💡 <span>Or rent for <span className="font-bold text-gray-900">{formatPrice(product.rentPrice)}/day</span></span>
                  </p>
                )}
                
                {/* Rental Policy Button - Only show when in Rent mode */}
                {mode === 'rent' && product.rentPrice > 0 && (
                  <button 
                    onClick={() => setShowRentalPolicy(true)}
                    className="mt-4 w-full px-5 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-black rounded-lg transition transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                  >
                    <span>📋</span>
                    <span>View Rental Policy</span>
                    <span>→</span>
                  </button>
                )}
              </div>

              {/* Description */}
              {product.description && (
                <p className="text-gray-700 text-base md:text-lg mb-6 leading-relaxed bg-white p-4 rounded-xl border border-gray-200">
                  {product.description}
                </p>
              )}

              {/* Product Details Box */}
              {(product.costumeType || product.country || product.color || product.material || product.condition || sizes.length > 0) && (
                <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl border-2 border-gray-200 p-6 mb-6 shadow-md hover:shadow-lg transition">
                  <h3 className="font-black text-gray-900 mb-4 text-lg flex items-center gap-2">
                    <span>📦</span> Product Details
                  </h3>
                  <div className="grid grid-cols-2 gap-5 text-sm">
                    {product.costumeType && (
                      <div className="bg-white p-3 rounded-lg border border-gray-200">
                        <p className="text-gray-600 font-bold text-xs uppercase tracking-wide">Costume Type</p>
                        <p className="text-gray-900 font-black mt-1 text-base">{product.costumeType}</p>
                      </div>
                    )}
                    {product.country && product.costumeType === 'Traditional Africa' && (
                      <div className="bg-white p-3 rounded-lg border border-gray-200">
                        <p className="text-gray-600 font-bold text-xs uppercase tracking-wide">Country/Region</p>
                        <p className="text-gray-900 font-black mt-1 text-base">{product.country}</p>
                      </div>
                    )}
                    {product.color && (
                      <div className="bg-white p-3 rounded-lg border border-gray-200">
                        <p className="text-gray-600 font-bold text-xs uppercase tracking-wide">Color</p>
                        <p className="text-gray-900 font-black mt-1 text-base">{product.color}</p>
                      </div>
                    )}
                    {product.material && (
                      <div className="bg-white p-3 rounded-lg border border-gray-200">
                        <p className="text-gray-600 font-bold text-xs uppercase tracking-wide">Material</p>
                        <p className="text-gray-900 font-black mt-1 text-base">{product.material}</p>
                      </div>
                    )}
                    {product.condition && (
                      <div className="bg-white p-3 rounded-lg border border-gray-200">
                        <p className="text-gray-600 font-bold text-xs uppercase tracking-wide">Condition</p>
                        <p className="text-gray-900 font-black mt-1 text-base">{product.condition}</p>
                      </div>
                    )}
                    {sizes.length > 0 && (
                      <div className="bg-white p-3 rounded-lg border border-gray-200">
                        <p className="text-gray-600 font-bold text-xs uppercase tracking-wide">Sizes</p>
                        <p className="text-gray-900 font-black mt-1 text-base">{product.sizes}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Presale Notice */}
            <PresaleNotice variant="compact" />

            {/* Action Buttons Section */}
            <div className="space-y-4">
              {/* Quantity */}
              <div className="flex items-center gap-4 bg-white p-4 rounded-xl border-2 border-gray-200">
                <label className="font-bold text-gray-900 flex items-center gap-2">
                  <span>📦</span> Qty:
                </label>
                <div className="flex items-center border-2 border-gray-300 rounded-lg bg-gray-50">
                  <button 
                    onClick={() => setQuantity(Math.max(1, quantity - 1))} 
                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 transition font-bold"
                  >
                    −
                  </button>
                  <span className="px-6 py-2 font-black text-gray-900">{quantity}</span>
                  <button 
                    onClick={() => setQuantity(quantity + 1)} 
                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 transition font-bold"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Add to Cart Button */}
              {(mode === 'buy' && product.availableForBuy !== false) || (mode === 'rent' && product.availableForRent !== false) ? (
                <button 
                  onClick={handleAddToCart} 
                  className={`w-full py-4 px-6 rounded-xl font-black text-lg transition duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-2xl transform hover:scale-105 active:scale-95 ${
                    addedToCart
                      ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white'
                      : 'bg-gradient-to-r from-lime-600 to-green-600 hover:from-lime-700 hover:to-green-700 text-white'
                  }`}
                >
                  {addedToCart ? (
                    <>
                      <Check className="h-6 w-6 animate-bounce" /> Added to Cart!
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="h-6 w-6" /> Add to Cart
                    </>
                  )}
                </button>
              ) : (
                <div className="w-full py-4 px-6 rounded-xl bg-gray-200 text-gray-600 font-black text-lg flex items-center justify-center gap-2 cursor-not-allowed opacity-60">
                  <AlertCircle className="h-6 w-6" />
                  {mode === 'buy' ? 'Not Available for Purchase' : 'Not Available for Rental'}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Related Products */}
      {allProducts.length > 1 && (
        <section className="border-t-2 border-gray-300 bg-gradient-to-br from-white to-gray-50">
          <div className="mx-auto max-w-7xl px-4 md:px-6 py-12 md:py-16">
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-8 flex items-center gap-3">
              <span>✨</span> You May Also Like
            </h2>
            <div className="grid gap-6 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
              {allProducts
                .filter(p => (p.id || p._id) !== productId && p.category === product.category)
                .slice(0, 4)
                .map(p => {
                  const pId = p.id || p._id;
                  return (
                    <Link key={pId} href={`/product/${pId}`}>
                      <div className="group bg-white rounded-xl overflow-hidden hover:shadow-2xl transition cursor-pointer border-2 border-gray-200 h-full flex flex-col transform hover:scale-105">
                        <div className="relative w-full aspect-[4/5] overflow-hidden bg-gradient-to-br from-gray-50 to-white">
                          <Image 
                            src={p.imageUrl} 
                            alt={p.name} 
                            fill 
                            className="object-cover group-hover:scale-110 transition duration-300"
                          />
                        </div>
                        <div className="p-4 flex-grow flex flex-col">
                          <h3 className="font-bold text-gray-900 text-sm line-clamp-2 mb-2">{p.name}</h3>
                          {(p.costumeType || p.country) && (
                            <div className="text-xs text-gray-600 mb-2">
                              {p.costumeType && <span>{p.costumeType}</span>}
                              {p.country && p.costumeType === 'Traditional Africa' && (
                                <span> • {p.country}</span>
                              )}
                            </div>
                          )}
                          <p className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-lime-600 to-green-600 mt-auto">{formatPrice(p.sellPrice)}</p>
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-cyan-600 text-white border-b-4 border-blue-700 p-6 flex items-center justify-between">
              <h2 className="text-2xl font-black flex items-center gap-2">
                <span>📋</span> Rental Policy
              </h2>
              <button 
                onClick={() => setShowRentalPolicy(false)}
                className="p-2 hover:bg-white/20 rounded-lg transition"
              >
                <X className="h-6 w-6 text-white" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Overview */}
              <div>
                <h3 className="text-lg font-black text-gray-900 mb-3 flex items-center gap-2">
                  <span>🎯</span> Overview
                </h3>
                <p className="text-gray-700 leading-relaxed">
                  Our rental service offers flexible costume rental options for events and occasions. All rentals come with a refundable caution fee and must be returned according to the specified terms.
                </p>
              </div>

              {/* Rental Duration */}
              <div>
                <h3 className="text-lg font-black text-gray-900 mb-3 flex items-center gap-2">
                  <span>📅</span> Rental Duration & Return
                </h3>
                <div className="bg-blue-50 border-l-4 border-blue-600 p-4 rounded-lg space-y-2">
                  <p className="font-black text-gray-900">Return Deadline: Next Day After Use</p>
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
                <h3 className="text-lg font-black text-gray-900 mb-3 flex items-center gap-2">
                  <span>🛡️</span> Caution Fee (Refundable)
                </h3>
                <div className="bg-green-50 border-l-4 border-green-600 p-4 rounded-lg space-y-2">
                  <p className="font-black text-gray-900">Security Deposit: 50% of First Day Rental Price</p>
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
                <h3 className="text-lg font-black text-gray-900 mb-3 flex items-center gap-2">
                  <span>⏰</span> Late Return Fees
                </h3>
                <div className="bg-orange-50 border-l-4 border-orange-600 p-4 rounded-lg space-y-2">
                  <p className="font-black text-gray-900">Additional Charges for Late Returns</p>
                  <ul className="list-disc list-inside space-y-1 text-gray-700 text-sm">
                    <li><span className="font-bold">First 24 hours late:</span> Full day rental charge applies</li>
                    <li><span className="font-bold">Each additional day:</span> Full rental price per day</li>
                    <li><span className="font-bold">Example:</span> If daily rental is ₦2,000 and returned 2 days late: ₦4,000 additional charge</li>
                    <li>Charges cumulative for each day overdue</li>
                    <li>After 7 days late: Item considered forfeited; full replacement cost applies</li>
                  </ul>
                </div>
              </div>

              {/* Condition & Care */}
              <div>
                <h3 className="text-lg font-black text-gray-900 mb-3 flex items-center gap-2">
                  <span>✨</span> Item Condition & Care
                </h3>
                <div className="space-y-3">
                  <div className="bg-gradient-to-r from-green-50 to-lime-50 p-4 rounded-lg border-l-4 border-green-600">
                    <p className="font-black text-green-900 mb-2">✓ Acceptable Condition</p>
                    <ul className="list-disc list-inside space-y-1 text-gray-700 text-sm">
                      <li>Normal wear and tear</li>
                      <li>Minor stains that come out with cleaning</li>
                      <li>Lint and surface dust</li>
                    </ul>
                  </div>
                  <div className="bg-gradient-to-r from-red-50 to-orange-50 p-4 rounded-lg border-l-4 border-red-600">
                    <p className="font-black text-red-900 mb-2">✗ Damage (Caution Fee Deducted or Full Replacement)</p>
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
                <h3 className="text-lg font-black text-gray-900 mb-3 flex items-center gap-2">
                  <span>🚚</span> Cleaning & Delivery
                </h3>
                <ul className="list-disc list-inside space-y-2 text-gray-700">
                  <li>Items should be returned <span className="font-bold">clean and dry</span></li>
                  <li>We provide delivery and pickup services for an additional fee</li>
                  <li>Direct returns at our store location are welcome</li>
                  <li>Items must be returned in original packaging when possible</li>
                </ul>
              </div>

              {/* Cancellation Policy */}
              <div>
                <h3 className="text-lg font-black text-gray-900 mb-3 flex items-center gap-2">
                  <span>🔄</span> Cancellation & Modification
                </h3>
                <ul className="list-disc list-inside space-y-2 text-gray-700">
                  <li>Cancellations up to 24 hours before rental: Full refund</li>
                  <li>Cancellations within 24 hours: 50% refund</li>
                  <li>No show on rental date: Caution fee forfeited</li>
                  <li>Modifications to rental period subject to availability</li>
                </ul>
              </div>

              {/* Contact & Support */}
              <div className="bg-gradient-to-r from-lime-50 to-green-50 border-l-4 border-lime-600 p-4 rounded-lg">
                <h4 className="font-black text-gray-900 mb-2 flex items-center gap-2">
                  <span>💬</span> Need Help?
                </h4>
                <p className="text-gray-700 text-sm">
                  For questions about rental terms, damage claims, or refunds, contact our customer service team. We're here to help!
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-gradient-to-r from-gray-100 to-gray-50 border-t-2 border-gray-300 p-6 flex gap-3">
              <button 
                onClick={() => setShowRentalPolicy(false)}
                className="flex-1 px-4 py-3 rounded-lg font-bold bg-gray-300 text-gray-900 hover:bg-gray-400 transition"
              >
                Close
              </button>
              <button 
                onClick={() => setShowRentalPolicy(false)}
                className="flex-1 px-4 py-3 rounded-lg font-bold bg-gradient-to-r from-lime-600 to-green-600 text-white hover:from-lime-700 hover:to-green-700 transition"
              >
                ✓ I Understand & Accept
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
