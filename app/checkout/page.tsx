"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Header } from "../components/Header";
import { Navigation } from "../components/Navigation";
import { Footer } from "../components/Footer";
import { useCart } from "../components/CartContext";
import { CURRENCY_RATES } from "../components/constants";
import { ShoppingBag, Check, ArrowLeft, Lock } from "lucide-react";

export default function CheckoutPage() {
  const { items, clearCart, total } = useCart();
  const [currency, setCurrency] = useState("NGN");
  const [category, setCategory] = useState("adults");
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "Lagos",
    postalCode: "",
    paymentMethod: "card",
  });

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const formatPrice = (price: number) => {
    const rate = CURRENCY_RATES[currency]?.rate || 1;
    const converted = price / rate;
    const symbol = CURRENCY_RATES[currency]?.symbol || "₦";
    return `${symbol}${converted.toFixed(2)}`;
  };

  if (!isHydrated) return null; // Prevent hydration mismatch

  // Empty cart screen
  if (items.length === 0 && !done) {
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
        <main className="flex-1 max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8 w-full text-center">
          <div className="bg-white rounded-lg sm:rounded-xl md:rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8 md:p-16">
            <div className="flex justify-center mb-3 sm:mb-4 md:mb-6">
              <div className="bg-gray-100 rounded-full p-2 sm:p-3 md:p-4">
                <ShoppingBag className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 text-gray-400" />
              </div>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 md:mb-4">Your cart is empty</h1>
            <p className="text-gray-600 mb-4 md:mb-6 text-xs sm:text-sm md:text-base">Add items to proceed with checkout.</p>
            <Link href="/" className="inline-block bg-lime-600 hover:bg-lime-700 text-white px-4 sm:px-5 md:px-6 py-2 sm:py-2.5 md:py-3 rounded-lg font-semibold transition text-xs sm:text-sm md:text-base">
              Continue Shopping
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Order confirmation screen
  if (done) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-lime-50 to-green-50 text-gray-900 flex flex-col">
        <header className="border-b border-gray-200 sticky top-0 z-40 bg-white shadow-sm">
          <div className="mx-auto w-full px-2 md:px-6 py-2 md:py-4 flex items-center justify-center gap-2 md:justify-between md:gap-8">
            <Header />
            <nav className="flex items-center flex-1">
              <Navigation category={category} onCategoryChange={setCategory} currency={currency} onCurrencyChange={setCurrency} />
            </nav>
          </div>
        </header>

        <main className="flex-1 max-w-3xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-12 w-full">
          <div className="bg-white rounded-lg sm:rounded-xl md:rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8 md:p-12 text-center">
            <div className="flex justify-center mb-4 md:mb-6">
              <div className="bg-green-100 rounded-full p-3 md:p-4">
                <Check className="h-8 w-8 md:h-10 md:w-10 text-green-600" />
              </div>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 md:mb-4 text-green-600">Order Confirmed!</h1>
            <p className="text-gray-600 mb-2 text-sm md:text-base">Thank you for your purchase.</p>
            <p className="text-gray-600 mb-6 md:mb-8 text-xs sm:text-sm">We've received your order and will send confirmation to your email shortly.</p>
            <Link href="/" className="inline-block bg-lime-600 hover:bg-lime-700 text-white font-semibold px-4 sm:px-5 md:px-6 py-2 sm:py-2.5 md:py-3 rounded-lg transition text-xs sm:text-sm md:text-base">
              Back to Shop
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Checkout form
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePlaceOrder = () => {
    if (!formData.fullName || !formData.email || !formData.phone || !formData.address) {
      alert("Please fill in all required fields");
      return;
    }
    setProcessing(true);
    setTimeout(() => {
      clearCart();
      setProcessing(false);
      setDone(true);
    }, 1500);
  };

  const shippingCost = 2500;
  const taxEstimate = total * 0.075;
  const totalAmount = total + shippingCost + taxEstimate;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 text-gray-900 flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-200 sticky top-0 z-40 bg-white shadow-sm">
        <div className="mx-auto w-full px-2 md:px-6 py-2 md:py-4 flex items-center justify-center gap-2 md:justify-between md:gap-8">
          <Header />
          <nav className="flex items-center flex-1">
            <Navigation category={category} onCategoryChange={setCategory} currency={currency} onCurrencyChange={setCurrency} />
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8 w-full">
        {/* Breadcrumb */}
        <div className="mb-4 sm:mb-6 md:mb-8">
          <Link href="/cart" className="inline-flex items-center gap-2 text-lime-600 hover:text-lime-700 font-medium text-xs sm:text-sm md:text-base">
            <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4" />
            Back to Cart
          </Link>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mt-2 md:mt-4">Checkout</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6 lg:gap-8">
          {/* Checkout Form - Left Side */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-5 md:space-y-6">
            {/* Billing Information */}
            <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-4 sm:p-5 md:p-6">
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-4 md:mb-6">Billing Information</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 md:mb-2">Full Name *</label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    placeholder="John Doe"
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-transparent bg-white text-xs sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 md:mb-2">Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="john@example.com"
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-transparent bg-white text-xs sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 md:mb-2">Phone *</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="+234 8012345678"
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-transparent bg-white text-xs sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 md:mb-2">Postal Code</label>
                  <input
                    type="text"
                    name="postalCode"
                    value={formData.postalCode}
                    onChange={handleInputChange}
                    placeholder="100001"
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-transparent bg-white text-xs sm:text-sm"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 md:mb-2">Address *</label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="123 Main Street, Apartment 4B"
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-transparent bg-white text-xs sm:text-sm"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 md:mb-2">City</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    placeholder="Lagos"
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-transparent bg-white text-xs sm:text-sm"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 md:mb-2">State</label>
                  <select
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-transparent bg-white text-xs sm:text-sm"
                  >
                    <option>Lagos</option>
                    <option>Ogun</option>
                    <option>Oyo</option>
                    <option>Osun</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-4 sm:p-5 md:p-6">
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-4 md:mb-6 flex items-center gap-2">
                <Lock className="h-4 w-4 sm:h-5 sm:w-5 text-lime-600" />
                Payment Method
              </h2>
              <div className="space-y-2 sm:space-y-3">
                {["card", "bank", "wallet"].map(method => (
                  <label key={method} className="flex items-center gap-3 p-3 sm:p-4 border-2 rounded-lg cursor-pointer transition" style={{
                    borderColor: formData.paymentMethod === method ? "#84cc16" : "#e5e7eb",
                    backgroundColor: formData.paymentMethod === method ? "#fafce8" : "white"
                  }}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={method}
                      checked={formData.paymentMethod === method}
                      onChange={handleInputChange}
                      className="w-4 h-4"
                    />
                    <span className="font-semibold text-xs sm:text-sm md:text-base capitalize">{method === "card" ? "💳 Card" : method === "bank" ? "🏦 Bank Transfer" : "💰 Wallet"}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Order Summary - Right Sidebar */}
          <div className="lg:col-span-1 space-y-4 sm:space-y-5 md:space-y-6">
            {/* Order Items */}
            <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-4 sm:p-5 md:p-6 max-h-96 overflow-y-auto">
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-4 md:mb-6">Order Summary</h2>
              <div className="space-y-3 sm:space-y-4">
                {items.map((item) => (
                  <div key={`${item.id}-${item.mode}`} className="flex gap-2 sm:gap-3 text-xs sm:text-sm">
                    {item.image && (
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 relative rounded overflow-hidden bg-gray-100 border border-gray-200">
                          <Image src={item.image} alt={item.name} fill className="object-contain p-1" />
                        </div>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 line-clamp-2">{item.name}</p>
                      <p className="text-gray-600 text-xs">{item.quantity}x {formatPrice(item.price)}</p>
                    </div>
                    <div className="text-right flex-shrink-0 font-semibold">
                      {formatPrice(item.price * item.quantity)}
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-200 mt-4 sm:mt-6 pt-4 sm:pt-6 space-y-2 sm:space-y-2.5">
                <div className="flex justify-between text-xs sm:text-sm text-gray-600">
                  <span>Subtotal</span>
                  <span>{formatPrice(total)}</span>
                </div>
                <div className="flex justify-between text-xs sm:text-sm text-gray-600">
                  <span>Shipping</span>
                  <span>{formatPrice(shippingCost)}</span>
                </div>
                <div className="flex justify-between text-xs sm:text-sm text-gray-600">
                  <span>Tax (7.5%)</span>
                  <span>{formatPrice(taxEstimate)}</span>
                </div>
                <div className="border-t border-gray-200 pt-2 sm:pt-3 flex justify-between text-sm sm:text-base font-bold">
                  <span>Total</span>
                  <span className="text-lime-600">{formatPrice(totalAmount)}</span>
                </div>
              </div>
            </div>

            {/* Place Order Button */}
            <button
              onClick={handlePlaceOrder}
              disabled={processing}
              className="w-full bg-lime-600 hover:bg-lime-700 disabled:bg-gray-400 text-white font-bold py-2.5 sm:py-3 md:py-4 px-4 rounded-lg transition text-xs sm:text-sm md:text-base"
            >
              {processing ? "Processing..." : "Place Order"}
            </button>

            <Link
              href="/cart"
              className="block w-full border-2 border-gray-300 hover:border-gray-400 text-gray-700 hover:bg-gray-50 font-semibold py-2.5 sm:py-3 md:py-4 px-4 rounded-lg text-center transition text-xs sm:text-sm md:text-base"
            >
              Back to Cart
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

