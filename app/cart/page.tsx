"use client";

import Image from "next/image";
import Link from "next/link";
import { Header } from "../components/Header";
import { Navigation } from "../components/Navigation";
import { Footer } from "../components/Footer";
import { useCart } from "../components/CartContext";
import { useState } from "react";
import { CURRENCY_RATES } from "../components/constants";
import { Trash2, Plus, Minus, ShoppingBag, ArrowLeft, Truck, MapPin } from "lucide-react";

// Shipping zones with detailed states and pricing
const SHIPPING_ZONES = {
  local: {
    name: "Local (Lagos)",
    cost: 2500,
    delivery: "2-3 days",
    description: "Pickup and delivery within Lagos State. Your items are handled locally by our team at Suru Lere or Ojo warehouses.",
  },
  regional: {
    name: "South West Region",
    states: ["Ogun", "Oyo", "Osun", "Ekiti", "Ondo"],
    cost: 7500,
    delivery: "3-5 days",
    description: "Reliable delivery to South West states. EMPI manages full logistics and ensures safe delivery to your doorstep.",
  },
  national: {
    name: "National Delivery",
    states: ["South-South", "South-East", "North-Central", "North-West", "North-East"],
    cost: 12500,
    delivery: "5-7 days",
    description: "Professional shipping across Nigeria. We partner with trusted logistics to ensure your items arrive safely.",
  },
};

const STATE_MAPPING = {
  // South West
  "Ogun": "regional",
  "Oyo": "regional",
  "Osun": "regional",
  "Ekiti": "regional",
  "Ondo": "regional",
  // South-South
  "Rivers": "national",
  "Bayelsa": "national",
  "Cross River": "national",
  "Akwa Ibom": "national",
  "Delta": "national",
  // South-East
  "Abia": "national",
  "Ebonyi": "national",
  "Enugu": "national",
  "Imo": "national",
  "Anambra": "national",
  // North-Central
  "Benue": "national",
  "Kogi": "national",
  "Kwara": "national",
  "Nasarawa": "national",
  "Niger": "national",
  "Plateau": "national",
  "FCT": "national",
  // North-West
  "Kaduna": "national",
  "Kano": "national",
  "Katsina": "national",
  "Kebbi": "national",
  "Sokoto": "national",
  "Zamfara": "national",
  "Jigawa": "national",
  // North-East
  "Adamawa": "national",
  "Bauchi": "national",
  "Borno": "national",
  "Gombe": "national",
  "Taraba": "national",
  "Yobe": "national",
};

const ALL_STATES = Object.keys(STATE_MAPPING);

export default function CartPage() {
  const { items, removeItem, updateQuantity, clearCart, total } = useCart();
  const [currency, setCurrency] = useState("NGN");
  const [category, setCategory] = useState("adults");
  const [shippingPreference, setShippingPreference] = useState<"empi" | "self">("empi");
  const [selectedState, setSelectedState] = useState<string>("Lagos");

  const formatPrice = (price: number) => {
    const rate = CURRENCY_RATES[currency]?.rate || 1;
    const converted = price / rate;
    const symbol = CURRENCY_RATES[currency]?.symbol || "₦";
    return `${symbol}${converted.toFixed(2)}`;
  };

  // Determine zone based on selected state
  const getZoneFromState = (state: string): "local" | "regional" | "national" => {
    if (state === "Lagos") return "local";
    return (STATE_MAPPING[state as keyof typeof STATE_MAPPING] || "national") as "local" | "regional" | "national";
  };

  const currentZone = getZoneFromState(selectedState);

  // Calculate stats
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = total;
  
  // Shipping cost based on preference
  const shippingCost = shippingPreference === "empi" ? SHIPPING_ZONES[currentZone].cost : 0;
  const taxEstimate = subtotal > 0 ? (subtotal * 0.075).toFixed(2) : "0.00"; // 7.5% estimate
  const totalEstimate = subtotal + shippingCost + parseFloat(taxEstimate);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 text-gray-900 flex flex-col">
      {/* Header with Logo and Navigation */}
      <header className="border-b border-gray-200 sticky top-0 z-40 bg-white shadow-sm">
        <div className="mx-auto w-full px-2 md:px-6 py-2 md:py-4 flex items-center justify-center gap-2 md:justify-between md:gap-8">
          <Header />
          <nav className="flex items-center flex-1">
            <Navigation 
              category={category}
              onCategoryChange={setCategory}
              currency={currency}
              onCurrencyChange={setCurrency}
            />
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-4 py-12 w-full">
        {/* Page Header */}
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-lime-600 hover:text-lime-700 font-medium mb-4">
            <ArrowLeft className="h-4 w-4" />
            Continue Shopping
          </Link>
          <h1 className="text-4xl font-bold mb-2">Shopping Cart</h1>
          <p className="text-gray-600">Review your items before checkout</p>
        </div>

        {items.length === 0 ? (
          // Empty Cart State
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-16 text-center">
            <div className="flex justify-center mb-6">
              <div className="bg-gray-100 rounded-full p-4">
                <ShoppingBag className="h-12 w-12 text-gray-400" />
              </div>
            </div>
            <h2 className="text-2xl font-semibold mb-2">Your cart is empty</h2>
            <p className="text-gray-600 mb-6">Discover our amazing collection of costumes!</p>
            <Link href="/" className="inline-block bg-lime-600 hover:bg-lime-700 text-white px-6 py-3 rounded-lg font-semibold transition">
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-6">
              {/* Summary Bar */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Items in cart</p>
                  <p className="text-2xl font-bold text-lime-600">{itemCount}</p>
                </div>
                <button
                  onClick={clearCart}
                  className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition font-medium"
                >
                  <Trash2 className="h-4 w-4" />
                  Clear Cart
                </button>
              </div>

              {/* Cart Items List */}
              <div className="space-y-4">
                {items.map((item) => (
                  <div 
                    key={`${item.id}-${item.mode}`}
                    className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition"
                  >
                    <div className="p-6 flex gap-6">
                      {/* Product Image */}
                      <div className="flex-shrink-0">
                        {item.image ? (
                          <div className="w-28 h-28 relative rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                            <Image 
                              src={item.image} 
                              alt={item.name} 
                              fill 
                              className="object-contain p-2"
                            />
                          </div>
                        ) : (
                          <div className="w-28 h-28 bg-gray-200 rounded-lg border border-gray-300 flex items-center justify-center">
                            <ShoppingBag className="h-8 w-8 text-gray-400" />
                          </div>
                        )}
                      </div>

                      {/* Product Details */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="text-lg font-semibold mb-1">{item.name}</h3>
                            <div className="flex items-center gap-3">
                              <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                                item.mode === "rent" 
                                  ? "bg-blue-100 text-blue-700" 
                                  : "bg-green-100 text-green-700"
                              }`}>
                                {item.mode === "rent" ? "Rent" : "Buy"}
                              </span>
                              <span className="text-sm text-gray-600">Unit: {formatPrice(item.price)}</span>
                            </div>
                          </div>
                          <button
                            onClick={() => removeItem(item.id, item.mode)}
                            className="text-red-600 hover:bg-red-50 p-2 rounded-lg transition"
                            title="Remove from cart"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>

                        {/* Quantity Controls */}
                        <div className="flex items-center gap-4 mt-4">
                          <div className="flex items-center border border-gray-300 rounded-lg">
                            <button
                              onClick={() => updateQuantity(item.id, item.mode, Math.max(1, item.quantity - 1))}
                              className="p-2 text-gray-600 hover:bg-gray-100 transition"
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                            <span className="px-4 py-2 font-semibold min-w-12 text-center">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.id, item.mode, item.quantity + 1)}
                              className="p-2 text-gray-600 hover:bg-gray-100 transition"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-600 mb-1">Subtotal</p>
                            <p className="text-xl font-bold text-lime-600">{formatPrice(item.price * item.quantity)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Summary Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              {/* Shipping Options */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Truck className="h-5 w-5 text-lime-600" />
                  Shipping Options
                </h3>
                
                <div className="space-y-4 mb-6">
                  {/* Option 1: EMPI Handles Shipping */}
                  <label className="flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition" style={{
                    borderColor: shippingPreference === "empi" ? "#84cc16" : "#e5e7eb",
                    backgroundColor: shippingPreference === "empi" ? "#fafce8" : "white"
                  }}>
                    <input
                      type="radio"
                      name="shipping"
                      value="empi"
                      checked={shippingPreference === "empi"}
                      onChange={(e) => setShippingPreference(e.target.value as "empi")}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">EMPI Handles Shipping</p>
                      <p className="text-sm text-gray-600">We'll deliver to your location professionally</p>
                    </div>
                  </label>

                  {/* Option 2: Self Shipping */}
                  <label className="flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition" style={{
                    borderColor: shippingPreference === "self" ? "#84cc16" : "#e5e7eb",
                    backgroundColor: shippingPreference === "self" ? "#fafce8" : "white"
                  }}>
                    <input
                      type="radio"
                      name="shipping"
                      value="self"
                      checked={shippingPreference === "self"}
                      onChange={(e) => setShippingPreference(e.target.value as "self")}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">I'll Handle Shipping</p>
                      <p className="text-sm text-gray-600">You arrange and pay for your own delivery. Pick up items from our Suru Lere or Ojo warehouse, or arrange your own courier.</p>
                    </div>
                  </label>
                </div>

                {/* Location Selector (for EMPI shipping) */}
                {shippingPreference === "empi" && (
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      <MapPin className="inline h-4 w-4 mr-2" />
                      Select Your State
                    </label>
                    <select
                      value={selectedState}
                      onChange={(e) => setSelectedState(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-transparent mb-3 bg-white"
                    >
                      <option value="Lagos">Lagos (Local) - ₦{SHIPPING_ZONES.local.cost.toLocaleString()}</option>
                      {["Ogun", "Oyo", "Osun", "Ekiti", "Ondo"].map(state => (
                        <option key={state} value={state}>{state} (South West) - ₦{SHIPPING_ZONES.regional.cost.toLocaleString()}</option>
                      ))}
                      {["Rivers", "Bayelsa", "Cross River", "Akwa Ibom", "Delta", "Abia", "Ebonyi", "Enugu", "Imo", "Anambra", "Benue", "Kogi", "Kwara", "Nasarawa", "Niger", "Plateau", "FCT", "Kaduna", "Kano", "Katsina", "Kebbi", "Sokoto", "Zamfara", "Jigawa", "Adamawa", "Bauchi", "Borno", "Gombe", "Taraba", "Yobe"].map(state => (
                        <option key={state} value={state}>{state} - ₦{SHIPPING_ZONES.national.cost.toLocaleString()}</option>
                      ))}
                    </select>
                    <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm text-blue-700">
                      <p><span className="font-semibold">Estimated delivery:</span> {SHIPPING_ZONES[currentZone].delivery}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Order Summary */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 sticky top-32">
                <h2 className="text-2xl font-bold mb-6">Order Summary</h2>
                
                {/* Price Breakdown */}
                <div className="space-y-4 mb-6 pb-6 border-b border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-semibold">{formatPrice(subtotal)}</span>
                  </div>
                  {shippingPreference === "empi" && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="flex items-center gap-1 text-gray-600">
                        Shipping (EMPI)
                        <span className="text-xs text-gray-500">({SHIPPING_ZONES[currentZone].delivery})</span>
                      </span>
                      <span className="font-semibold">{formatPrice(shippingCost)}</span>
                    </div>
                  )}
                  {shippingPreference === "self" && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Shipping</span>
                      <span className="font-semibold text-green-600">FREE</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      Tax (Est.)
                      <span className="text-xs text-gray-500">7.5%</span>
                    </span>
                    <span>{formatPrice(parseFloat(taxEstimate))}</span>
                  </div>
                </div>

                {/* Total */}
                <div className="flex justify-between items-center mb-6 text-xl">
                  <span className="font-semibold">Total</span>
                  <span className="font-bold text-lime-600">{formatPrice(totalEstimate)}</span>
                </div>

                {/* Information */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-sm text-blue-700">
                  <p className="font-semibold mb-1">ℹ️ Final pricing</p>
                  <p>Exact shipping and taxes will be calculated at checkout. Confirm your address for accurate delivery cost.</p>
                </div>

                {/* Checkout Button */}
                <Link 
                  href="/checkout" 
                  className="block w-full bg-lime-600 hover:bg-lime-700 text-white font-bold py-3 px-4 rounded-lg text-center transition mb-3"
                >
                  Proceed to Checkout
                </Link>

                {/* Continue Shopping */}
                <Link 
                  href="/" 
                  className="block w-full border-2 border-gray-300 hover:border-gray-400 text-gray-700 hover:bg-gray-50 font-semibold py-3 px-4 rounded-lg text-center transition"
                >
                  Continue Shopping
                </Link>

                {/* Payment Methods */}
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <p className="text-xs text-gray-500 font-semibold mb-3">We Accept</p>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="inline-block px-2 py-1 bg-gray-100 rounded text-xs">💳 Cards</span>
                    <span className="inline-block px-2 py-1 bg-gray-100 rounded text-xs">🏦 Bank</span>
                    <span className="inline-block px-2 py-1 bg-gray-100 rounded text-xs">💰 Wallet</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

