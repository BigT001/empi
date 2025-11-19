"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { ShoppingCart, ArrowLeft, Heart, Trash2, ChevronLeft, ChevronRight, Check } from "lucide-react";
import { CURRENCY_RATES } from "@/app/components/constants";

// Lazy load heavy icons that aren't immediately visible
const HeartIcon = dynamic(() => Promise.resolve(Heart), { ssr: true });

interface Product {
  id: string;
  name: string;
  description?: string | null;
  sellPrice: number;
  rentPrice: number;
  category: string;
  badge?: string | null;
  image: string;
  images: string[];
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
  const [mode, setMode] = useState<"buy" | "rent">("buy");
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState("");
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [addedToCart, setAddedToCart] = useState(false);

  const formatPrice = (price: number) => {
    const converted = price * CURRENCY_RATES[currency].rate;
    const symbol = CURRENCY_RATES[currency].symbol;
    if (currency === "INR" || currency === "NGN") {
      return `${symbol}${converted.toFixed(0)}`;
    }
    return `${symbol}${converted.toFixed(2)}`;
  };

  const displayPrice = mode === "rent" ? formatPrice(product.rentPrice) : formatPrice(product.sellPrice);

  const handleDeleteProduct = async () => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
      const res = await fetch(`/api/products?id=${product.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete product");
      router.push("/");
    } catch (e) {
      alert("Error deleting product. Check console.");
      console.error(e);
    }
  };

  const handleAddToCart = () => {
    const cartItem = {
      id: `${product.id}-${mode}-${selectedSize}-${Date.now()}`,
      productId: product.id,
      name: product.name,
      price: product.sellPrice,
      rentPrice: product.rentPrice,
      mode,
      quantity,
      selectedSize: selectedSize || undefined,
      image: product.image,
      rentalDays: 3,
    };

    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 1800);
    // In a real app, dispatch to cart context or api
    console.log("Added to cart:", cartItem);
  };

  const nextImage = () => setCurrentImageIndex((p) => (p + 1) % product.images.length);
  const prevImage = () => setCurrentImageIndex((p) => (p - 1 + product.images.length) % product.images.length);

  const sizes = product.sizes ? product.sizes.split(",").map((s: string) => s.trim()) : [];

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <header className="border-b border-gray-100 sticky top-0 z-40 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-3 md:px-6 py-3 md:py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-gray-700 hover:text-lime-600 transition font-semibold text-sm md:text-base">
            <ArrowLeft className="h-4 w-4 md:h-5 md:w-5" /> Back
          </Link>
          <div className="flex items-center gap-2 md:gap-4">
            <button className="p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition">
              <Heart className="h-4 w-4 md:h-5 md:w-5" />
            </button>
            <button onClick={() => router.push('/cart')} className="flex items-center gap-2 bg-lime-600 hover:bg-lime-700 text-white px-3 py-2 rounded-lg font-semibold">
              <ShoppingCart className="h-4 w-4" /> Cart
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-3 md:px-6 py-6 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-12">
          <div className="flex flex-col gap-4">
            <div className="relative bg-gray-50 rounded-xl md:rounded-2xl overflow-hidden aspect-[4/5]">
              <Image 
                src={product.images[currentImageIndex] ?? product.image} 
                alt={product.name} 
                fill 
                className="object-cover" 
                priority={currentImageIndex === 0}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                quality={85}
              />
              {product.badge && <div className="absolute top-2 right-2 bg-lime-600 text-white text-xs font-bold px-2 py-1 rounded-full">{product.badge}</div>}
              {product.images.length > 1 && (
                <>
                  <button onClick={prevImage} className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full z-10"><ChevronLeft className="h-5 w-5" /></button>
                  <button onClick={nextImage} className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full z-10"><ChevronRight className="h-5 w-5" /></button>
                </>
              )}
            </div>

            {product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {product.images.map((img: string, idx: number) => (
                  <button key={idx} onClick={() => setCurrentImageIndex(idx)} className={`relative aspect-square rounded-lg overflow-hidden border-2 ${idx === currentImageIndex ? 'border-lime-600' : 'border-gray-200'}`}>
                    <Image 
                      src={img} 
                      alt={`${product.name} ${idx+1}`} 
                      fill 
                      className="object-cover"
                      sizes="100px"
                      quality={75}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col justify-between">
            <div>
              <div className="mb-2 text-sm text-gray-600">{product.category === 'kids' ? '👶 Kids' : '👔 Adults'} Costume</div>
              <h1 className="text-2xl md:text-4xl font-bold text-gray-900 mb-4">{product.name}</h1>

              <div className="mb-6 md:mb-8">
                <div className="flex items-baseline gap-4 mb-2 md:mb-4">
                  <span className="text-3xl md:text-4xl font-bold text-gray-900">{displayPrice}</span>
                  {mode === 'rent' && <span className="text-gray-600">/ per day</span>}
                </div>
                {mode === 'buy' && product.rentPrice > 0 && <p className="text-sm text-gray-600">Or rent for {formatPrice(product.rentPrice)} / per day</p>}
              </div>

              <p className="text-gray-700 text-sm md:text-lg mb-6 leading-relaxed">{product.description}</p>

              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">Product Details</h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  {product.color && <li className="flex justify-between"><span>Color:</span><span className="font-semibold">{product.color}</span></li>}
                  {product.material && <li className="flex justify-between"><span>Material:</span><span className="font-semibold">{product.material}</span></li>}
                  {product.condition && <li className="flex justify-between"><span>Condition:</span><span className="font-semibold">{product.condition}</span></li>}
                  {sizes.length > 0 && <li className="flex justify-between"><span>Sizes:</span><span className="font-semibold">{product.sizes}</span></li>}
                </ul>
              </div>
            </div>

            <div className="space-y-4">
              <div className="inline-flex items-center bg-gray-100 rounded-lg p-1 border border-gray-200 w-full">
                <button onClick={() => setMode('buy')} className={`flex-1 px-4 py-2 rounded font-semibold ${mode === 'buy' ? 'bg-lime-600 text-white' : 'text-gray-600'}`}>Buy</button>
                {product.rentPrice > 0 && <button onClick={() => setMode('rent')} className={`flex-1 px-4 py-2 rounded font-semibold ${mode === 'rent' ? 'bg-lime-600 text-white' : 'text-gray-600'}`}>Rent</button>}
              </div>

              {sizes.length > 0 && (
                <div>
                  <label className="block text-sm font-semibold mb-2">Select Size:</label>
                  <div className="flex flex-wrap gap-2">
                    {sizes.map((s: string) => (
                      <button key={s} onClick={() => setSelectedSize(s)} className={`px-3 py-2 rounded-lg border ${selectedSize===s ? 'border-lime-600 bg-lime-50' : 'border-gray-300'}`}>{s}</button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-4">
                <label className="font-semibold">Quantity:</label>
                <div className="flex items-center border border-gray-300 rounded-lg">
                  <button onClick={() => setQuantity(Math.max(1, quantity-1))} className="px-3">−</button>
                  <span className="px-4">{quantity}</span>
                  <button onClick={() => setQuantity(quantity+1)} className="px-3">+</button>
                </div>
              </div>

              <button onClick={handleAddToCart} className="w-full px-4 py-3 rounded-lg bg-lime-600 text-white font-bold">{addedToCart ? (<><Check className="inline"/> Added</>) : 'Add to cart'}</button>

              <button onClick={handleDeleteProduct} className="w-full bg-red-50 text-red-600 px-4 py-2 rounded-lg">Delete Product</button>
            </div>
          </div>
        </div>
      </main>

      <section className="mx-auto max-w-7xl px-3 md:px-6 py-8 border-t">
        <h2 className="text-xl font-bold mb-6">You May Also Like</h2>
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
          {allProducts.filter(p => p.id !== product.id && p.category === product.category).slice(0,4).map(p => (
            <Link key={p.id} href={`/product/${p.id}`}>
              <div className="bg-gray-50 rounded-lg overflow-hidden hover:shadow-lg transition cursor-pointer">
                <div className="relative w-full aspect-[4/5]"><Image src={p.image} alt={p.name} fill className="object-cover"/></div>
                <div className="p-2"><h3 className="font-semibold text-sm">{p.name}</h3><p className="text-sm font-bold">{formatPrice(p.sellPrice)}</p></div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
