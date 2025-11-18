"use client";

import { useState, use, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShoppingCart, ArrowLeft, Heart, Trash2, ChevronLeft, ChevronRight, Check } from "lucide-react";
import { CURRENCY_RATES } from "@/app/components/constants";
import { logger } from "@/lib/logger";

interface Product {
  id: string;
  name: string;
  description: string;
  sellPrice: number;
  rentPrice: number;
  category: "adults" | "kids";
  badge: string | null;
  image: string;
  images: string[];
  sizes: string | null;
  color: string | null;
  material: string | null;
  condition: string | null;
  careInstructions: string | null;
}

export default function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const [currency, setCurrency] = useState("NGN");
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<"buy" | "rent">("buy");
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState("");
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [addedToCart, setAddedToCart] = useState(false);

  // Load product from database
  useEffect(() => {
    const loadProduct = async () => {
      try {
        logger.debug('Loading products from API', { productId: id });
        const response = await fetch("/api/products");
        const products = await response.json();
        
        if (Array.isArray(products)) {
          logger.info('Products loaded successfully', { 
            totalProducts: products.length,
            productId: id 
          });
          setAllProducts(products);
          const foundProduct = products.find((p: Product) => p.id === id);
          
          if (foundProduct) {
            logger.info('Product found', { 
              productName: foundProduct.name,
              productId: id 
            });
            setProduct(foundProduct);
          } else {
            logger.warn('Product not found in list', { productId: id });
            setProduct(null);
          }
        } else {
          logger.error('Invalid products response format', { response: products });
          setProduct(null);
        }
      } catch (error) {
        logger.error('Error loading products from database', { productId: id }, error as Error);
        setProduct(null);
      }
      setLoading(false);
    };
    loadProduct();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="h-8 w-8 border-4 border-lime-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading product...</p>
        </div>
      </div>
    );
  }

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

  const handleDeleteProduct = async () => {
    if (!confirm("Are you sure you want to delete this product?")) {
      return;
    }

    try {
      const response = await fetch(`/api/products?id=${product.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete product");
      }

      window.location.href = "/";
    } catch (error) {
      console.error("Error deleting product:", error);
      alert("Error deleting product. Please try again.");
    }
  };

  const handleAddToCart = () => {
    const cartItem = {
      id: `${product!.id}-${mode}-${selectedSize}-${Date.now()}`,
      productId: product!.id,
      name: product!.name,
      price: product!.sellPrice,
      rentPrice: product!.rentPrice,
      mode,
      quantity,
      selectedSize: selectedSize || undefined,
      image: product!.image,
      rentalDays: 3,
    };

    // Log the cart action
    logger.info('Product added to cart', {
      productId: product!.id,
      productName: product!.name,
      mode,
      quantity,
      price: mode === 'buy' ? product!.sellPrice : product!.rentPrice,
    });
    
    // Show success feedback
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % product.images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + product.images.length) % product.images.length);
  };

  const sizes = product.sizes ? product.sizes.split(",").map((s) => s.trim()) : [];

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Header */}
      <header className="border-b border-gray-100 sticky top-0 z-40 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-3 md:px-6 py-3 md:py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-gray-700 hover:text-lime-600 transition font-semibold text-sm md:text-base">
            <ArrowLeft className="h-4 w-4 md:h-5 md:w-5" />
            Back
          </Link>
          <div className="flex items-center gap-2 md:gap-4">
            <button className="p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition">
              <Heart className="h-4 w-4 md:h-5 md:w-5" />
            </button>
            <button 
              onClick={() => router.push("/cart")}
              className="flex items-center gap-2 bg-lime-600 hover:bg-lime-700 text-white px-3 md:px-4 py-2 rounded-lg font-semibold transition text-xs md:text-sm"
            >
              <ShoppingCart className="h-4 w-4" />
              <span>Cart</span>
            </button>
          </div>
        </div>
      </header>

      {/* Product Details */}
      <main className="mx-auto max-w-7xl px-3 md:px-6 py-6 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-12">
          {/* Product Images */}
          <div className="flex flex-col gap-4">
            {/* Main Image */}
            <div className="relative bg-gray-50 rounded-xl md:rounded-2xl overflow-hidden aspect-[4/5]">
              <Image
                src={product.images[currentImageIndex]}
                alt={product.name}
                fill
                className="object-cover"
              />
              {product.badge && (
                <div className="absolute top-2 md:top-4 right-2 md:right-4 bg-lime-600 text-white text-xs md:text-sm font-bold px-2 md:px-4 py-1 md:py-2 rounded-full">
                  {product.badge}
                </div>
              )}
              {product.images.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full transition z-10"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full transition z-10"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs bg-black/50 text-white px-2 py-1 rounded">
                    {currentImageIndex + 1}/{product.images.length}
                  </div>
                </>
              )}
            </div>

            {/* Thumbnail Grid */}
            {product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentImageIndex(idx)}
                    className={`relative aspect-square rounded-lg overflow-hidden border-2 transition ${
                      idx === currentImageIndex ? "border-lime-600" : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <Image
                      src={img}
                      alt={`View ${idx + 1}`}
                      fill
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="flex flex-col justify-between">
            <div>
              <div className="mb-2 text-sm text-gray-600">
                {product.category === "kids" ? "👶 Kids" : "👔 Adults"} Costume
              </div>
              <h1 className="text-2xl md:text-4xl font-bold text-gray-900 mb-4">{product.name}</h1>

              {/* Price */}
              <div className="mb-6 md:mb-8">
                <div className="flex items-baseline gap-4 mb-2 md:mb-4">
                  <span className="text-3xl md:text-4xl font-bold text-gray-900">{displayPrice}</span>
                  {mode === "rent" && <span className="text-gray-600">/ per day</span>}
                </div>
                {mode === "buy" && product.rentPrice > 0 && (
                  <p className="text-sm md:text-base text-gray-600">
                    Or rent for {formatPrice(product.rentPrice)} <span className="text-xs">/ per day</span>
                  </p>
                )}
              </div>

              {/* Description */}
              <p className="text-gray-700 text-sm md:text-lg mb-6 md:mb-8 leading-relaxed">{product.description}</p>

              {/* Product Details */}
              <div className="bg-gray-50 rounded-lg md:rounded-xl p-4 md:p-6 mb-6 md:mb-8">
                <h3 className="font-semibold text-gray-900 mb-4 text-sm md:text-base">Product Details</h3>
                <ul className="space-y-2 md:space-y-3 text-xs md:text-sm text-gray-700">
                  {product.color && (
                    <li className="flex justify-between">
                      <span>Color:</span>
                      <span className="font-semibold">{product.color}</span>
                    </li>
                  )}
                  {product.material && (
                    <li className="flex justify-between">
                      <span>Material:</span>
                      <span className="font-semibold">{product.material}</span>
                    </li>
                  )}
                  {product.condition && (
                    <li className="flex justify-between">
                      <span>Condition:</span>
                      <span className="font-semibold">{product.condition}</span>
                    </li>
                  )}
                  {sizes.length > 0 && (
                    <li className="flex justify-between">
                      <span>Sizes:</span>
                      <span className="font-semibold">{product.sizes}</span>
                    </li>
                  )}
                  {product.careInstructions && (
                    <li className="flex flex-col">
                      <span>Care Instructions:</span>
                      <span className="font-semibold text-xs">{product.careInstructions}</span>
                    </li>
                  )}
                </ul>
              </div>
            </div>

            {/* Action Section */}
            <div className="space-y-4">
              {/* Buy/Rent Toggle */}
              <div className="relative inline-flex items-center bg-gray-100 rounded-lg p-1 border border-gray-200 w-full">
                <button
                  onClick={() => setMode("buy")}
                  className={`flex-1 px-4 py-2 md:py-3 rounded font-semibold transition-all text-xs md:text-base ${
                    mode === "buy" ? "bg-lime-600 text-white" : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Buy
                </button>
                {product.rentPrice > 0 && (
                  <button
                    onClick={() => setMode("rent")}
                    className={`flex-1 px-4 py-2 md:py-3 rounded font-semibold transition-all text-xs md:text-base ${
                      mode === "rent" ? "bg-lime-600 text-white" : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    Rent
                  </button>
                )}
              </div>

              {/* Size Selection */}
              {sizes.length > 0 && (
                <div>
                  <label className="block text-xs md:text-sm font-semibold text-gray-900 mb-2">Select Size:</label>
                  <div className="flex flex-wrap gap-2">
                    {sizes.map((size) => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`px-3 md:px-4 py-1 md:py-2 rounded-lg border-2 font-semibold text-xs md:text-sm transition ${
                          selectedSize === size
                            ? "border-lime-600 bg-lime-50 text-lime-600"
                            : "border-gray-300 text-gray-700 hover:border-lime-600"
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity */}
              <div className="flex items-center gap-4">
                <label className="font-semibold text-gray-900 text-xs md:text-base">Quantity:</label>
                <div className="flex items-center border border-gray-300 rounded-lg">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-3 md:px-4 py-1 md:py-2 text-gray-600 hover:bg-gray-100 transition text-sm md:text-base"
                  >
                    −
                  </button>
                  <span className="px-4 md:px-6 py-1 md:py-2 font-semibold text-sm md:text-base">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="px-3 md:px-4 py-1 md:py-2 text-gray-600 hover:bg-gray-100 transition text-sm md:text-base"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Currency Selector */}
              <div className="relative">
                <label className="block text-xs md:text-sm font-semibold text-gray-900 mb-2">Currency:</label>
                <button
                  onClick={() => setShowCurrencyDropdown(!showCurrencyDropdown)}
                  className="w-full text-left flex items-center justify-between px-3 md:px-4 py-2 md:py-3 border border-gray-300 rounded-lg hover:border-lime-600 transition text-sm md:text-base cursor-not-allowed opacity-60"
                  disabled
                >
                  <span>{CURRENCY_RATES[currency].symbol} {currency}</span>
                  <span className="text-gray-600">▼</span>
                </button>
                <p className="text-xs text-gray-500 mt-1">Select currency from header</p>
              </div>

              {/* Add to Cart Button */}
              <button
                onClick={handleAddToCart}
                className={`w-full px-4 md:px-6 py-3 md:py-4 rounded-lg font-bold text-sm md:text-lg transition flex items-center justify-center gap-2 ${
                  addedToCart
                    ? "bg-green-600 hover:bg-green-700 text-white"
                    : "bg-lime-600 hover:bg-lime-700 text-white"
                }`}
              >
                {addedToCart ? (
                  <>
                    <Check className="h-4 w-4 md:h-5 md:w-5" />
                    Added to Cart!
                  </>
                ) : (
                  <>
                    <ShoppingCart className="h-4 w-4 md:h-5 md:w-5" />
                    Add {quantity} to Cart
                  </>
                )}
              </button>

              {/* Delete Button (Admin) */}
              <button
                onClick={handleDeleteProduct}
                className="w-full bg-red-50 hover:bg-red-100 text-red-600 px-4 md:px-6 py-2 md:py-3 rounded-lg font-semibold text-xs md:text-sm transition flex items-center justify-center gap-2 border border-red-200"
              >
                <Trash2 className="h-4 w-4" />
                Delete Product
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Related Products Section */}
      <section className="mx-auto max-w-7xl px-3 md:px-6 py-8 md:py-12 border-t border-gray-200">
        <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-6 md:mb-8">You May Also Like</h2>
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
          {allProducts
            .filter((p) => p.id !== product.id && p.category === product.category)
            .slice(0, 4)
            .map((relatedProduct) => (
              <Link key={relatedProduct.id} href={`/product/${relatedProduct.id}`}>
                <div className="bg-gray-50 rounded-lg md:rounded-xl overflow-hidden hover:shadow-lg transition cursor-pointer h-full">
                  <div className="relative w-full aspect-[4/5]">
                    <Image
                      src={relatedProduct.image}
                      alt={relatedProduct.name}
                      fill
                      className="object-cover"
                    />
                    {relatedProduct.badge && (
                      <div className="absolute top-1 right-1 bg-lime-600 text-white text-xs font-bold px-2 py-1 rounded">
                        {relatedProduct.badge}
                      </div>
                    )}
                  </div>
                  <div className="p-2 md:p-4">
                    <h3 className="font-semibold text-gray-900 text-xs md:text-sm line-clamp-2 mb-1 md:mb-2">
                      {relatedProduct.name}
                    </h3>
                    <p className="text-xs md:text-sm font-bold text-gray-900">
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
