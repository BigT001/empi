"use client";

import { useCart } from "../components/CartContext";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { Navigation } from "../components/Navigation";
import { useBuyer } from "../context/BuyerContext";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useCallback, useMemo } from "react";
import { DeliverySelector } from "../components/DeliverySelector";
import { RentalPolicyModal } from "../components/RentalPolicyModal";
import { ShoppingBag, Trash2, Plus, Minus, Info, ArrowLeft, AlertCircle, Truck, MapPin, Zap, Package } from "lucide-react";
import { AuthForm } from "../components/AuthForm";
import { CartItemDelivery, DeliveryQuote } from "@/app/lib/deliveryCalculator";
import { ItemSize } from "@/app/lib/deliverySystem";
import { EnhancedDeliverySelector } from "../components/EnhancedDeliverySelectorNew";

export default function CartPage() {
  const { items, removeItem, updateQuantity, clearCart, total, deliveryState, setDeliveryState } = useCart();
  const { buyer } = useBuyer();
  const router = useRouter();

  const [isHydrated, setIsHydrated] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showRentalPolicy, setShowRentalPolicy] = useState(false);
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [category, setCategory] = useState("all");
  const [currency, setCurrency] = useState("NGN");
  const [shippingOption, setShippingOption] = useState<"empi" | "self">("empi");
  const [deliveryQuote, setDeliveryQuote] = useState<any>(null);
  const [deliveryError, setDeliveryError] = useState<string | null>(null);
  
  // Billing Information State
  const [billingInfo, setBillingInfo] = useState({
    fullName: "",
    email: "",
    phone: "",
  });

  useEffect(() => {
    setIsHydrated(true);
    const saved = localStorage.getItem("empi_shipping_option");
    if (saved) setShippingOption(saved as "empi" | "self");
  }, []);

  const handleShippingChange = (option: "empi" | "self") => {
    setShippingOption(option);
    localStorage.setItem("empi_shipping_option", option);
  };

  const handleDeliveryChange = useCallback((quote: DeliveryQuote | null) => {
    setDeliveryQuote(quote);
    if (!quote) {
      setDeliveryError("Unable to calculate delivery fee");
      localStorage.removeItem("empi_delivery_quote");
    } else {
      setDeliveryError(null);
      // Save to localStorage for checkout persistence
      localStorage.setItem("empi_delivery_quote", JSON.stringify(quote));
    }
  }, []);

  const deliveryItems = useMemo(() => items.map(item => ({
    id: item.id,
    name: item.name,
    quantity: item.quantity,
    size: ((item.size as any) || ItemSize.MEDIUM) as "SMALL" | "MEDIUM" | "LARGE",
    weight: item.weight || 0.5,
    totalWeight: (item.weight || 0.5) * item.quantity,
    fragile: item.fragile || false,
  })), [items]);

  const subtotal = total;
  const shippingCost = shippingOption === "empi" && deliveryQuote ? deliveryQuote.fee : 0;
  const taxEstimate = subtotal > 0 ? (subtotal * 0.075).toFixed(2) : "0.00";
  const totalAmount = subtotal + shippingCost + parseFloat(taxEstimate);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const formatPrice = (price: number | string) => {
    const numPrice = typeof price === "string" ? parseFloat(price) : price;
    return `${numPrice.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  if (!isHydrated) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 text-gray-900 flex flex-col">
      <header className="border-b border-gray-200 sticky top-0 z-40 bg-white shadow-sm">
        <div className="mx-auto w-full px-2 md:px-6 py-2 md:py-4 flex items-center justify-center gap-2 md:justify-between md:gap-8">
          <Header />
          <nav className="flex items-center flex-1">
            <Navigation category={category} onCategoryChange={setCategory} currency={currency} onCurrencyChange={setCurrency} />
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-4 py-12 w-full">
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-lime-600 hover:text-lime-700 font-medium mb-4">
            <ArrowLeft className="h-4 w-4" /> Continue Shopping
          </Link>
          <h1 className="text-4xl font-bold mb-2">Shopping Cart</h1>
          <p className="text-gray-600">Review your items and select delivery</p>
        </div>

        {items.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-16 text-center">
            <div className="flex justify-center mb-6">
              <div className="bg-gray-100 rounded-full p-4">
                <ShoppingBag className="h-12 w-12 text-gray-400" />
              </div>
            </div>
            <h2 className="text-2xl font-semibold mb-2">Your cart is empty</h2>
            <p className="text-gray-600 mb-6">Discover our amazing collection!</p>
            <Link href="/" className="inline-block bg-lime-600 hover:bg-lime-700 text-white px-6 py-3 rounded-lg font-semibold transition">
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Items: <span className="text-2xl font-bold text-lime-600">{itemCount}</span></p>
                </div>
                <button onClick={clearCart} className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition font-medium">
                  <Trash2 className="h-4 w-4" /> Clear
                </button>
              </div>

              <div className="space-y-4">
                {items.map((item) => (
                  <div key={`${item.id}-${item.mode}`} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-300">
                    <div className="p-4 md:p-6 flex flex-col md:flex-row gap-4 md:gap-6">
                      {/* Image Section */}
                      <div className="flex-shrink-0 w-full md:w-32 h-32 relative rounded-xl overflow-hidden bg-gray-50 border border-gray-200 flex items-center justify-center">
                        {item.image ? (
                          <Image src={item.image} alt={item.name} fill className="object-contain p-2" />
                        ) : (
                          <ShoppingBag className="h-12 w-12 text-gray-300" />
                        )}
                      </div>

                      {/* Content Section */}
                      <div className="flex-1 flex flex-col justify-between">
                        {/* Header with Title and Delete Button */}
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg md:text-xl font-bold text-gray-900 truncate">{item.name}</h3>
                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                              <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${item.mode === "rent" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"}`}>
                                {item.mode === "rent" ? "Rent" : "Buy"}
                              </span>
                              {item.mode === "rent" && (
                                <button
                                  onClick={() => setShowRentalPolicy(true)}
                                  className="text-xs text-blue-600 hover:text-blue-700 underline font-medium whitespace-nowrap"
                                >
                                  View Policy
                                </button>
                              )}
                            </div>
                          </div>
                          <button onClick={() => removeItem(item.id, item.mode)} className="text-red-600 hover:bg-red-50 p-2 rounded-lg transition flex-shrink-0">
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>

                        {/* Footer with Controls and Price */}
                        <div className="flex items-center justify-between gap-4 pt-3 border-t border-gray-100">
                          <div className="flex items-center border-2 border-gray-200 rounded-lg">
                            <button onClick={() => updateQuantity(item.id, item.mode, Math.max(1, item.quantity - 1))} className="p-2 text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition">
                              <Minus className="h-4 w-4" />
                            </button>
                            <span className="px-4 py-2 font-bold text-gray-900 min-w-14 text-center">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.id, item.mode, item.quantity + 1)} className="p-2 text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition">
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-600 mb-1">{item.quantity} × {formatPrice(item.price)}</p>
                            <p className="text-2xl font-bold text-lime-600">{formatPrice(item.price * item.quantity)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {shippingOption === "empi" && (
                <div className="hidden lg:block bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Truck className="h-5 w-5 text-lime-600" /> Real-Time Delivery
                  </h2>
                  {deliveryError && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                      <p className="text-red-800 text-sm">{deliveryError}</p>
                    </div>
                  )}
                  <EnhancedDeliverySelector 
                    items={deliveryItems}
                    onDeliveryChange={handleDeliveryChange}
                  />
                  {deliveryQuote && (
                    <div className="mt-6 p-4 bg-gradient-to-r from-lime-50 to-green-50 border border-lime-200 rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-lime-600" />
                          <span className="text-sm text-gray-600">Distance:</span>
                        </div>
                        <span className="font-semibold text-gray-900">{(deliveryQuote.distance || 0).toFixed(1)} km</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Zap className="h-4 w-4 text-lime-600" />
                          <span className="text-sm text-gray-600">Estimated Time:</span>
                        </div>
                        <span className="font-semibold text-gray-900">{deliveryQuote.duration || 'Calculating...'}</span>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-lime-300">
                        <span className="text-sm font-semibold text-gray-700">Delivery Fee:</span>
                        <span className="font-bold text-lime-600">₦{(deliveryQuote.fee || 0).toLocaleString('en-NG')}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 sticky top-32">
                <h2 className="text-2xl font-bold mb-6">Order Summary</h2>
                <div className="space-y-4 mb-6 pb-6 border-b border-gray-200">
                  <div className="flex justify-between"><span className="text-gray-600">Subtotal</span><span className="font-semibold">{formatPrice(subtotal)}</span></div>
                  {shippingOption === "empi" ? (
                    deliveryQuote ? (
                      <div className="flex justify-between text-sm"><span className="text-gray-600">Delivery</span><span className="font-semibold text-lime-600">{formatPrice(deliveryQuote.fee)}</span></div>
                    ) : (
                      <div className="flex justify-between text-sm"><span className="text-gray-600">Delivery</span><span className="text-gray-500"></span></div>
                    )
                  ) : (
                    <div className="flex justify-between text-sm"><span className="text-gray-600">Pickup</span><span className="font-semibold text-green-600">FREE</span></div>
                  )}
                  <div className="flex justify-between text-sm"><span className="text-gray-600">VAT (7.5%)</span><span>{formatPrice(parseFloat(taxEstimate))}</span></div>
                </div>
                <div className="flex justify-between items-center mb-6 text-xl">
                  <span className="font-semibold">Total</span><span className="font-bold text-lime-600">{formatPrice(totalAmount)}</span>
                </div>
                <div className="space-y-4 mb-6">
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-700">
                    <p className="font-semibold">Select Delivery Option</p>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <label className={`block p-4 rounded-lg border-2 mb-3 cursor-pointer ${shippingOption === "empi" ? "border-lime-600 bg-lime-50" : "border-gray-300"}`}>
                      <input type="radio" name="shipping" value="empi" checked={shippingOption === "empi"} onChange={() => { handleShippingChange("empi"); setShowDeliveryModal(true); }} className="mt-1 w-4 h-4 accent-lime-600" />
                      <div className="font-semibold text-gray-900 flex items-center gap-2 mt-2">
                        <Truck className="h-4 w-4 text-lime-600" /> EMPI Delivery
                      </div>
                      <p className="text-sm text-gray-600 mt-1">Fast & reliable delivery</p>
                    </label>
                    <label className={`block p-4 rounded-lg border-2 cursor-pointer ${shippingOption === "self" ? "border-lime-600 bg-lime-50" : "border-gray-300"}`}>
                      <input type="radio" name="shipping" value="self" checked={shippingOption === "self"} onChange={() => handleShippingChange("self")} className="mt-1 w-4 h-4 accent-lime-600" />
                      <div className="font-semibold text-gray-900 flex items-center gap-2 mt-2">
                        <MapPin className="h-4 w-4 text-blue-600" /> Self Pickup
                      </div>
                      <p className="text-sm text-gray-600 mt-1">Pick up yourself - FREE</p>
                    </label>
                  </div>
                </div>
                <button onClick={() => { if (shippingOption === "empi" && !deliveryQuote) { alert("Please select delivery state and location"); return; } buyer ? router.push("/checkout") : setShowAuthModal(true); }} className="block w-full bg-lime-600 hover:bg-lime-700 text-white font-bold py-3 px-4 rounded-lg text-center transition mb-3 disabled:opacity-50" disabled={shippingOption === "empi" && !deliveryQuote}>
                  Proceed to Checkout
                </button>
                <Link href="/" className="block w-full border-2 border-gray-300 hover:border-gray-400 text-gray-700 hover:bg-gray-50 font-semibold py-3 px-4 rounded-lg text-center transition">
                  Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>
      {showAuthModal && <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowAuthModal(false)}>
        <AuthForm redirectToCheckout={true} onCancel={() => setShowAuthModal(false)} />
      </div>}
      
      {/* Mobile Delivery Modal */}
      {showDeliveryModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-end z-50 lg:hidden">
          <div className="w-full bg-white rounded-t-2xl shadow-2xl max-h-96 overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Truck className="h-5 w-5 text-lime-600" /> Real-Time Delivery
              </h2>
              <button onClick={() => setShowDeliveryModal(false)} className="text-gray-600 hover:text-gray-900 text-2xl leading-none">
                ×
              </button>
            </div>
            <div className="p-6">
              {deliveryError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                  <p className="text-red-800 text-sm">{deliveryError}</p>
                </div>
              )}
              <EnhancedDeliverySelector 
                items={deliveryItems}
                onDeliveryChange={handleDeliveryChange}
              />
              {deliveryQuote && (
                <div className="mt-6 p-4 bg-gradient-to-r from-lime-50 to-green-50 border border-lime-200 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-lime-600" />
                      <span className="text-sm text-gray-600">Distance:</span>
                    </div>
                    <span className="font-semibold text-gray-900">{(deliveryQuote.distance || 0).toFixed(1)} km</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-lime-600" />
                      <span className="text-sm text-gray-600">Estimated Time:</span>
                    </div>
                    <span className="font-semibold text-gray-900">{deliveryQuote.duration || 'Calculating...'}</span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-lime-300">
                    <span className="text-sm font-semibold text-gray-700">Delivery Fee:</span>
                    <span className="font-bold text-lime-600">₦{(deliveryQuote.fee || 0).toLocaleString('en-NG')}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      <RentalPolicyModal isOpen={showRentalPolicy} onClose={() => setShowRentalPolicy(false)} />
      <Footer />
    </div>
  );
}
