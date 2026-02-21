"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { ShoppingCart, ArrowLeft, ChevronLeft, ChevronRight, AlertCircle, X } from "lucide-react";
import { CURRENCY_RATES } from "@/app/components/constants";
import { useCart } from "@/app/components/CartContext";
import { useMode } from "@/app/context/ModeContext";

import { Toast } from "@/app/components/Toast";
import { Portal } from "@/app/components/Portal";
import { ScrollReveal } from "@/app/components/ScrollReveal";

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
  const { addItem, items, canAddItem } = useCart();

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
  const [cartConflict, setCartConflict] = useState<{ hasConflict: boolean; message: string }>({ hasConflict: false, message: "" });

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
    // Validate cart mode compatibility
    const validation = canAddItem(mode);
    if (!validation.canAdd) {
      setCartConflict({ hasConflict: true, message: validation.message });
      setTimeout(() => setCartConflict({ hasConflict: false, message: "" }), 4000);
      return;
    }

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
    setTimeout(() => setAddedToCart(false), 3000);
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
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a] transition-colors duration-700">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-gray-100 dark:border-white/5">
        <div className="mx-auto max-w-7xl px-4 md:px-6 py-4 flex items-center justify-between">
          <Link href="/product" className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-lime-600 dark:hover:text-lime-400 transition font-bold text-xs uppercase tracking-widest group">
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition" /> Back to Products
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
          <div className="flex flex-col gap-6">
            {/* Main Image */}
            <div className="relative bg-gray-50 dark:bg-white/5 rounded-3xl overflow-hidden aspect-[4/5] border border-gray-100 dark:border-white/5 shadow-2xl transition-all duration-500 overflow-hidden">
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
                    className="absolute left-6 top-1/2 -translate-y-1/2 bg-white/90 dark:bg-black/90 backdrop-blur-md p-4 rounded-full z-10 shadow-xl transition-all hover:scale-110 active:scale-95 group/btn"
                    title="Previous image"
                  >
                    <ChevronLeft className="h-6 w-6 text-gray-900 dark:text-white group-hover/btn:text-lime-600 dark:group-hover/btn:text-lime-400" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-6 top-1/2 -translate-y-1/2 bg-white/90 dark:bg-black/90 backdrop-blur-md p-4 rounded-full z-10 shadow-xl transition-all hover:scale-110 active:scale-95 group/btn"
                    title="Next image"
                  >
                    <ChevronRight className="h-6 w-6 text-gray-900 dark:text-white group-hover/btn:text-lime-600 dark:group-hover/btn:text-lime-400" />
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
                    className={`relative aspect-square rounded-2xl overflow-hidden border transition-all duration-300 cursor-pointer transform hover:scale-105 ${idx === currentImageIndex
                      ? 'border-lime-500 ring-4 ring-lime-500/20 shadow-lg'
                      : 'border-gray-100 dark:border-white/10 hover:border-lime-500/50'
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
              <div className="mb-6 flex items-center gap-2">
                <span className="inline-block text-[10px] font-black uppercase tracking-[0.2em] px-4 py-2 bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-400 rounded-full border border-gray-100 dark:border-white/5">
                  {product.category === 'kids' ? '👶 Kids Boutique' : '👔 Elite Adults'}
                </span>
              </div>

              <h1 className="text-5xl md:text-7xl font-black text-gray-900 dark:text-white mb-6 leading-tight font-playfair tracking-tight">{product.name}</h1>

              {/* Buy/Rent Mode Toggle */}
              <div className="flex gap-3 mb-6">
                {product.availableForBuy !== false && (
                  <button
                    onClick={() => setMode("buy")}
                    className={`flex-1 px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all transform ${mode === "buy"
                      ? "bg-lime-600 text-white shadow-[0_10px_20px_rgba(101,163,13,0.3)] scale-105"
                      : "bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-400 hover:bg-white dark:hover:bg-white/10"
                      }`}
                  >
                    💳 Purchase
                  </button>
                )}
                {product.availableForRent !== false && product.rentPrice > 0 && (
                  <button
                    onClick={() => setMode("rent")}
                    className={`flex-1 px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all transform ${mode === "rent"
                      ? "bg-blue-600 text-white shadow-[0_10px_20px_rgba(37,99,235,0.3)] scale-105"
                      : "bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-400 hover:bg-white dark:hover:bg-white/10"
                      }`}
                  >
                    🎭 Rental
                  </button>
                )}
                {product.availableForBuy === false && product.availableForRent !== false && (
                  <div className="flex-1 px-4 py-3 rounded-xl bg-blue-50 dark:bg-blue-600/10 text-blue-600 dark:text-blue-400 font-black text-center text-[10px] uppercase tracking-widest border border-blue-100 dark:border-blue-600/20 flex items-center justify-center gap-2">
                    <span>🎪</span> Rental Only
                  </div>
                )}
                {product.availableForRent === false && product.availableForBuy !== false && (
                  <div className="flex-1 px-4 py-3 rounded-xl bg-green-50 dark:bg-lime-600/10 text-lime-600 dark:text-lime-400 font-black text-center text-[10px] uppercase tracking-widest border border-green-100 dark:border-lime-600/20 flex items-center justify-center gap-2">
                    <span>🛒</span> For Sale Only
                  </div>
                )}
                {product.availableForBuy === false && product.availableForRent === false && (
                  <div className="flex-1 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-600/10 text-red-600 dark:text-red-400 font-black text-center text-[10px] uppercase tracking-widest border border-red-100 dark:border-red-600/20 flex items-center justify-center gap-2">
                    <span>⚠️</span> Unavailable
                  </div>
                )}
              </div>

              {/* Price Section */}
              <div className="mb-8 pb-8 border-b border-gray-100 dark:border-white/5">
                <div className="flex items-baseline gap-4 mb-4">
                  <span className="text-6xl md:text-8xl font-black text-gray-900 dark:text-white tracking-tighter">{displayPrice}</span>
                  {mode === 'rent' && <span className="text-sm font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">/ per day</span>}
                </div>
                {mode === 'buy' && product.rentPrice > 0 && (
                  <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest flex items-center gap-2">
                    💡 <span>Or rent for <span className="text-lime-600 dark:text-lime-400">{formatPrice(product.rentPrice)}/day</span></span>
                  </p>
                )}

                {/* Rental Policy Button - Only show when in Rent mode */}
                {mode === 'rent' && product.rentPrice > 0 && (
                  <button
                    onClick={() => setShowRentalPolicy(true)}
                    className="mt-6 w-full px-6 py-4 bg-blue-600/10 dark:bg-blue-600/20 text-blue-600 dark:text-blue-400 border border-blue-600/20 dark:border-blue-400/20 font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl transition-all hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 dark:hover:text-white flex items-center justify-center gap-2 group"
                  >
                    <span>📋</span>
                    <span>View Rental Policy</span>
                    <span className="group-hover:translate-x-1 transition">→</span>
                  </button>
                )}
              </div>

              {/* Description */}
              {product.description && (
                <p className="text-gray-500 dark:text-gray-400 text-sm md:text-base mb-8 leading-relaxed font-medium italic">
                  "{product.description}"
                </p>
              )}

              {/* Product Details Box */}
              {(product.costumeType || product.country || product.color || product.material || product.condition || sizes.length > 0) && (
                <div className="bg-gray-50 dark:bg-white/5 rounded-3xl border border-gray-100 dark:border-white/5 p-8 mb-8">
                  <h3 className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                    <span>📦</span> Boutique Specifications
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {product.costumeType && (
                      <div className="flex flex-col gap-1">
                        <p className="text-gray-400 dark:text-gray-500 font-bold text-[10px] uppercase tracking-wider">Style Variant</p>
                        <p className="text-gray-900 dark:text-white font-black text-sm">{product.costumeType}</p>
                      </div>
                    )}
                    {product.country && product.costumeType === 'Traditional Africa' && (
                      <div className="flex flex-col gap-1">
                        <p className="text-gray-400 dark:text-gray-500 font-bold text-[10px] uppercase tracking-wider">Heritage Source</p>
                        <p className="text-gray-900 dark:text-white font-black text-sm">{product.country}</p>
                      </div>
                    )}
                    {product.color && (
                      <div className="flex flex-col gap-1">
                        <p className="text-gray-400 dark:text-gray-500 font-bold text-[10px] uppercase tracking-wider">Palette</p>
                        <p className="text-gray-900 dark:text-white font-black text-sm">{product.color}</p>
                      </div>
                    )}
                    {product.material && (
                      <div className="flex flex-col gap-1">
                        <p className="text-gray-400 dark:text-gray-500 font-bold text-[10px] uppercase tracking-wider">Textile</p>
                        <p className="text-gray-900 dark:text-white font-black text-sm">{product.material}</p>
                      </div>
                    )}
                    {product.condition && (
                      <div className="flex flex-col gap-1">
                        <p className="text-gray-400 dark:text-gray-500 font-bold text-[10px] uppercase tracking-wider">Boutique Status</p>
                        <p className="text-gray-900 dark:text-white font-black text-sm">{product.condition}</p>
                      </div>
                    )}
                    {sizes.length > 0 && (
                      <div className="flex flex-col gap-1">
                        <p className="text-gray-400 dark:text-gray-500 font-bold text-[10px] uppercase tracking-wider">Available Sizes</p>
                        <p className="text-gray-900 dark:text-white font-black text-sm">{product.sizes}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>



            {/* Action Buttons Section */}
            <div className="space-y-6">
              {/* Quantity */}
              <div className="flex items-center gap-6 bg-gray-50 dark:bg-white/5 p-2 rounded-2xl border border-gray-100 dark:border-white/5">
                <div className="flex items-center bg-white dark:bg-black/40 rounded-xl border border-gray-100 dark:border-white/5 overflow-hidden">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-6 py-4 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 transition font-black"
                  >
                    −
                  </button>
                  <span className="px-8 py-4 font-black text-gray-900 dark:text-white min-w-[3rem] text-center">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="px-6 py-4 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 transition font-black"
                  >
                    +
                  </button>
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">Unit Quantity</p>
              </div>

              {/* Add to Cart Button */}
              {(mode === 'buy' && product.availableForBuy !== false) || (mode === 'rent' && product.availableForRent !== false) ? (
                <button
                  onClick={handleAddToCart}
                  className={`w-full py-6 px-8 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all duration-500 flex items-center justify-center gap-3 shadow-2xl hover:scale-[1.02] active:scale-95 ${mode === 'buy'
                    ? 'bg-lime-600 hover:bg-lime-500 text-white shadow-lime-600/20'
                    : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/20'
                    }`}
                >
                  <ShoppingCart className="h-5 w-5" /> Add to Boutique Cart
                </button>
              ) : (
                <div className="w-full py-6 px-8 rounded-2xl bg-gray-100 dark:bg-white/5 text-gray-400 dark:text-gray-500 font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 cursor-not-allowed border border-gray-200 dark:border-white/5">
                  <AlertCircle className="h-5 w-5" />
                  {mode === 'buy' ? 'Not Available for Purchase' : 'Not Available for Rental'}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Related Products */}
      {allProducts.length > 1 && (
        <ScrollReveal y={40}>
          <section className="bg-white dark:bg-[#0a0a0a] border-t border-gray-100 dark:border-white/5 transition-colors duration-700">
            <div className="mx-auto max-w-7xl px-4 md:px-6 py-20 md:py-32">
              <h2 className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.4em] mb-12 flex items-center gap-3 justify-center">
                <span>✨</span> Curated Recommendations
              </h2>
              <div className="grid gap-8 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
                {allProducts
                  .filter(p => (p.id || p._id) !== productId && p.category === product.category)
                  .slice(0, 4)
                  .map(p => {
                    const pId = p.id || p._id;
                    return (
                      <Link key={pId} href={`/product/${pId}`}>
                        <div className="group bg-transparent transition-all duration-500 cursor-pointer flex flex-col transform">
                          <div className="relative w-full aspect-[4/5] rounded-3xl overflow-hidden bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 mb-6">
                            <Image
                              src={p.imageUrl}
                              alt={p.name}
                              fill
                              className="object-cover group-hover:scale-110 transition-all duration-700"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-500" />
                          </div>
                          <div className="flex flex-col text-center">
                            <h3 className="font-black text-gray-900 dark:text-white text-xs uppercase tracking-widest mb-2 line-clamp-1">{p.name}</h3>
                            <p className="text-sm font-black text-lime-600 dark:text-lime-400">{formatPrice(p.sellPrice)}</p>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
              </div>
            </div>
          </section>
        </ScrollReveal>
      )}

      {/* Rental Policy Modal */}
      {showRentalPolicy && (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-500">
          <div className="bg-white dark:bg-[#0a0a0a] rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-100 dark:border-white/5">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-gray-100 dark:border-white/5 p-8 flex items-center justify-between z-10">
              <h2 className="text-xs font-black uppercase tracking-[0.3em] text-gray-900 dark:text-white flex items-center gap-3">
                <span>📋</span> Boutique Rental Policy
              </h2>
              <button
                onClick={() => setShowRentalPolicy(false)}
                className="p-3 hover:bg-gray-50 dark:hover:bg-white/5 rounded-full transition-all"
              >
                <X className="h-5 w-5 text-gray-400 dark:text-gray-500" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-8 space-y-10">
              {/* Overview */}
              <div>
                <h3 className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                  <span>🎯</span> Service Standards
                </h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-sm">
                  Our boutique rental service offers elite costume options. All rentals are subject to a security deposit and professional care standards.
                </p>
              </div>

              {/* Rental Duration */}
              <div className="p-6 bg-blue-50/50 dark:bg-blue-600/5 rounded-2xl border border-blue-100 dark:border-blue-600/10">
                <h3 className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-[0.2em] mb-4">Rental Duration & Return</h3>
                <ul className="space-y-3 text-gray-600 dark:text-gray-400 text-sm">
                  <li className="flex items-start gap-2"><span>•</span> Return by 6:00 PM on the next business day after use.</li>
                  <li className="flex items-start gap-2"><span>•</span> Weekend rentals due by Monday 6:00 PM.</li>
                </ul>
              </div>

              {/* Caution Fee */}
              <div className="p-6 bg-green-50/50 dark:bg-green-600/5 rounded-2xl border border-green-100 dark:border-green-600/10">
                <h3 className="text-[10px] font-black text-green-600 dark:text-green-400 uppercase tracking-[0.2em] mb-4">Refundable Caution Fee</h3>
                <ul className="space-y-3 text-gray-600 dark:text-gray-400 text-sm">
                  <li className="flex items-start gap-2"><span>•</span> 50% security deposit required for all rentals.</li>
                  <li className="flex items-start gap-2"><span>•</span> Fully refunded upon safe return within 48 hours.</li>
                </ul>
              </div>

              {/* Late Return Charges */}
              <div className="p-6 bg-orange-50/50 dark:bg-orange-600/5 rounded-2xl border border-orange-100 dark:border-orange-600/10">
                <h3 className="text-[10px] font-black text-orange-600 dark:text-orange-400 uppercase tracking-[0.2em] mb-4">Late Return Protocol</h3>
                <ul className="space-y-3 text-gray-600 dark:text-gray-400 text-sm italic">
                  <li>Full day rental charge applies for every 24 hours overdue.</li>
                </ul>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-xl border-t border-gray-100 dark:border-white/5 p-8 flex gap-4">
              <button
                onClick={() => setShowRentalPolicy(false)}
                className="flex-1 px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-400 hover:bg-white dark:hover:bg-white/10 transition-all border border-gray-100 dark:border-white/5"
              >
                Close
              </button>
              <button
                onClick={() => setShowRentalPolicy(false)}
                className="flex-1 px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest bg-lime-600 text-white hover:bg-lime-500 transition-all shadow-lg shadow-lime-600/20"
              >
                ✓ I Accept
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add to Cart Success Toast - Using Portal to escape stacking context */}
      {addedToCart && (
        <Portal>
          <Toast
            message="Added to Cart!"
            subtitle={product.name}
            type="success"
            duration={3000}
            onClose={() => setAddedToCart(false)}
          />
        </Portal>
      )}

      {/* Cart Mode Conflict Error Toast - Using Portal to escape stacking context */}
      {cartConflict.hasConflict && (
        <Portal>
          <Toast
            message="Cannot Mix Order Types"
            subtitle={cartConflict.message}
            type="error"
            duration={4000}
            onClose={() => setCartConflict({ hasConflict: false, message: "" })}
          />
        </Portal>
      )}
    </div>
  );
}
