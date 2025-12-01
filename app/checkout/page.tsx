"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { useCart } from "../components/CartContext";
import { useBuyer } from "../context/BuyerContext";
import PaymentSuccessModal from "../components/PaymentSuccessModal";
import AuthModal from "../components/AuthModal";
import { CheckoutValidationModal } from "../components/CheckoutValidationModal";
import { ShoppingBag, AlertCircle, CreditCard, Truck, MapPin, Clock, Lock, CheckCircle2 } from "lucide-react";

const SHIPPING_OPTIONS = {
  empi: { id: "empi", name: "EMPI Delivery", cost: 2500, estimatedDays: "2-5 business days" },
  self: { id: "self", name: "Self Pickup", cost: 0, estimatedDays: "Ready within 24 hours" },
};

export default function CheckoutPage() {
  const { items, clearCart, total, rentalSchedule, deliveryQuote, validateCheckoutRequirements } = useCart();
  const { buyer } = useBuyer();
  const router = useRouter();

  const [isHydrated, setIsHydrated] = useState(false);
  const [shippingOption, setShippingOption] = useState<"empi" | "self">("empi");
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [successReference, setSuccessReference] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"card" | "transfer">("card");
  const [validationModalOpen, setValidationModalOpen] = useState(false);
  const [validationType, setValidationType] = useState<"rental_schedule" | "delivery_info" | "buyer_info">("rental_schedule");
  const [validationMessage, setValidationMessage] = useState("");

  // Calculate caution fee (50% of rental items total)
  const rentalTotal = items.reduce((sum, item) => {
    if (item.mode === 'rent') {
      const days = rentalSchedule?.rentalDays || 1;
      return sum + (item.price * item.quantity * days);
    }
    return sum;
  }, 0);
  const cautionFee = rentalTotal * 0.5;
  const subtotalWithCaution = total + cautionFee;

  useEffect(() => {
    setIsHydrated(true);
    // Load shipping preference from localStorage
    const saved = localStorage.getItem("empi_shipping_option");
    if (saved) setShippingOption(saved as "empi" | "self");
    
    // Check if user is logged in on mobile - show auth modal if not
    if (!buyer && typeof window !== "undefined") {
      const isMobile = window.innerWidth < 768; // md breakpoint
      if (isMobile) {
        setAuthModalOpen(true);
      }
    }
  }, [buyer]);

  // Handle payment success - save order and invoice
  const handlePaymentSuccess = async (response: any) => {
    console.log("🟢 Payment success handler called");
    console.log("Reference:", response?.reference);

    try {
      const shippingCost = shippingOption === "empi" ? 2500 : 0;
      const taxEstimate = subtotalWithCaution * 0.075;
      const totalAmount = subtotalWithCaution + shippingCost + taxEstimate;

      const orderData = {
        reference: response.reference,
        buyerId: buyer?.id || undefined, // Add buyerId if user is logged in (registered), undefined for guest
        customer: {
          name: buyer?.fullName || "",
          email: buyer?.email || "",
          phone: buyer?.phone || "",
        },
        items,
        pricing: {
          subtotal: total,
          cautionFee: cautionFee > 0 ? cautionFee : undefined,
          subtotalWithCaution,
          tax: taxEstimate,
          shipping: shippingCost,
          total: totalAmount,
        },
        rentalSchedule: rentalSchedule || undefined, // Add rental schedule if rentals exist
        status: "completed",
        createdAt: new Date().toISOString(),
      };

      console.log("📮 Saving order...");
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      });

      if (res.ok) {
        console.log("✅ Order saved");
        
        // Generate invoice - create a shorter unique reference
        const shortRef = Math.random().toString(36).substring(2, 10).toUpperCase();
        const invoiceNumber = `INV-${shortRef}`;
        
        const invoiceData = {
          invoiceNumber: invoiceNumber,
          orderNumber: invoiceNumber,  // Use same number to avoid duplication
          buyerId: buyer?.id, // Add buyerId to link invoice to user
          customerName: buyer?.fullName || "",
          customerEmail: buyer?.email || "",
          customerPhone: buyer?.phone || "",
          subtotal: total,
          cautionFee: cautionFee > 0 ? cautionFee : undefined,
          subtotalWithCaution,
          shippingCost,
          taxAmount: taxEstimate,
          totalAmount,
          items: items.map((item: any) => ({
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            mode: item.mode || 'buy',
          })),
          invoiceDate: new Date().toISOString(),
          type: 'automatic',
          status: 'paid',
          currencySymbol: '₦',
        };

        console.log("📋 Generating invoice...");
        console.log("📊 Invoice data:", invoiceData);
        const invoiceRes = await fetch("/api/invoices", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(invoiceData),
        });

        const invoiceResData = await invoiceRes.json();
        console.log("📮 Invoice response:", invoiceResData);

        if (invoiceRes.ok) {
          console.log("✅ Invoice generated");
        } else {
          console.error("❌ Invoice generation failed:", invoiceResData);
        }

        // Clear cart and show success modal AFTER both are saved
        console.log("🧹 Clearing cart and showing success modal");
        setSuccessReference(response.reference);
        setSuccessModalOpen(true);
        clearCart();
      } else {
        console.error("❌ Order save failed");
        setOrderError("Failed to save order. Please contact support.");
      }
    } catch (error) {
      console.error("❌ Error saving order:", error);
      setOrderError("An error occurred. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Helper function to poll for payment
  const pollForPayment = (ref: string) => {
    let pollCount = 0;
    const maxPolls = 180;
    const pollInterval = setInterval(async () => {
      pollCount++;
      try {
        const verifyRes = await fetch(`/api/verify-payment?reference=${ref}`);
        const verifyData = await verifyRes.json();
        
        if (verifyData.success && verifyData.status === 'success') {
          console.log("✅ Payment verified!");
          clearInterval(pollInterval);
          handlePaymentSuccess({ reference: ref, ...verifyData });
          return;
        }
      } catch (err) {
        console.log("Polling...");
      }
      
      if (pollCount >= maxPolls) {
        clearInterval(pollInterval);
        setIsProcessing(false);
      }
    }, 1000);
  };

  // Helper function to verify payment
  const verifyAndProcessPayment = async (ref: string) => {
    try {
      const res = await fetch(`/api/verify-payment?reference=${ref}`);
      const data = await res.json();
      
      if (data.success && data.status === 'success') {
        console.log("✅ Payment confirmed!");
        handlePaymentSuccess({ reference: ref, ...data });
      } else {
        console.log("Payment pending or failed");
        pollForPayment(ref);
      }
    } catch (err) {
      console.error("Verification error:", err);
      pollForPayment(ref);
    }
  };

  if (!isHydrated) return null;

  // ===== EMPTY CART =====
  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 max-w-4xl mx-auto px-4 py-12 w-full">
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-12">
            <div className="text-center mb-8">
              <ShoppingBag className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h1 className="text-3xl font-bold mb-2">Your cart is empty</h1>
              <p className="text-gray-600 mb-8">Add items to proceed with checkout.</p>
              <div className="space-y-3 max-w-sm mx-auto">
                <Link href="/" className="block w-full bg-lime-600 hover:bg-lime-700 text-white px-6 py-3 rounded-lg font-semibold transition">
                  Continue Shopping
                </Link>
                <Link href="/dashboard?tab=invoices" className="block w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-6 py-3 rounded-lg font-semibold transition shadow-md hover:shadow-lg">
                  View Invoices
                </Link>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // ===== CALCULATE TOTALS =====
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const SHIPPING_OPTIONS: Record<string, { name: string; estimatedDays: string; cost: number }> = {
    empi: { name: "EMPI Delivery", estimatedDays: "1-2 days", cost: 2500 },
    self: { name: "Self Pickup", estimatedDays: "Same day", cost: 0 },
  };
  const shippingCost = SHIPPING_OPTIONS[shippingOption].cost;
  const taxEstimate = subtotalWithCaution * 0.075;
  const totalAmount = subtotalWithCaution + shippingCost + taxEstimate;
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <Header />
      <main className="flex-1 max-w-6xl mx-auto px-4 py-8 md:py-12 w-full">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-lg p-3">
              <CreditCard className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Order Review
              </h1>
              <p className="text-gray-600">Step 2 of 2 - Review and Pay</p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Order Items */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 hover:shadow-md transition-shadow duration-300">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-gradient-to-br from-blue-100 to-blue-50 rounded-lg p-3">
                  <ShoppingBag className="h-5 w-5 text-blue-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Order Items ({itemCount})</h2>
              </div>
              
              <div className="space-y-3">
                {items.map((item) => (
                  <div 
                    key={`${item.id}-${item.mode}`} 
                    className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-transparent rounded-xl border border-gray-100 hover:border-blue-200 transition-all duration-200"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap ${
                          item.mode === 'rent' 
                            ? 'bg-purple-100 text-purple-700' 
                            : 'bg-green-100 text-green-700'
                        }`}>
                          {item.mode === 'rent' ? '🔄 Rental' : '🛍️ Buy'}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{item.name}</p>
                          <p className="text-xs text-gray-500">Quantity: {item.quantity}</p>
                        </div>
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      {item.mode === 'rent' ? (
                        <>
                          <p className="font-bold text-gray-900">₦{(item.price * item.quantity * (rentalSchedule?.rentalDays || 1)).toLocaleString()}</p>
                          <p className="text-xs text-gray-500">₦{item.price.toLocaleString()} × {item.quantity} qty × {rentalSchedule?.rentalDays || 1} days</p>
                        </>
                      ) : (
                        <>
                          <p className="font-bold text-gray-900">₦{(item.price * item.quantity).toLocaleString()}</p>
                          <p className="text-xs text-gray-500">₦{item.price.toLocaleString()} each</p>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Rental Schedule (if applicable) */}
            {rentalSchedule && items.some(i => i.mode === 'rent') && (
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl shadow-sm border border-purple-200 p-6 hover:shadow-md transition-shadow duration-300">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-purple-100 rounded-lg p-3">
                    <Clock className="h-5 w-5 text-purple-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">Rental Schedule</h3>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-white/60 rounded-lg p-4">
                    <p className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Pickup</p>
                    <p className="font-bold text-gray-900">{rentalSchedule.pickupDate}</p>
                    <p className="text-sm text-gray-700 font-semibold">at {rentalSchedule.pickupTime}</p>
                  </div>
                  <div className="bg-white/60 rounded-lg p-4">
                    <p className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Return</p>
                    <p className="font-bold text-gray-900">{rentalSchedule.returnDate}</p>
                    <p className="text-sm text-gray-700 font-semibold">{rentalSchedule.rentalDays} {rentalSchedule.rentalDays === 1 ? 'day' : 'days'}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Delivery Information (if EMPI delivery) */}
            {shippingOption === "empi" && deliveryQuote && (
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl shadow-sm border border-green-200 p-6 hover:shadow-md transition-shadow duration-300">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-green-100 rounded-lg p-3">
                    <Truck className="h-5 w-5 text-green-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">Delivery Details</h3>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-white/60 rounded-lg p-4">
                    <p className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Distance</p>
                    <p className="font-bold text-gray-900 text-lg">{deliveryQuote.distance?.toFixed(1) || 'N/A'} km</p>
                  </div>
                  <div className="bg-white/60 rounded-lg p-4">
                    <p className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Estimated Time</p>
                    <p className="font-bold text-gray-900 text-lg">{deliveryQuote.duration || 'N/A'}</p>
                  </div>
                  <div className="md:col-span-2 bg-white/60 rounded-lg p-4">
                    <p className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Delivery Address</p>
                    <p className="font-semibold text-gray-900">{deliveryQuote.deliveryPoint?.address || 'Not specified'}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Billing Information */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-300">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-blue-100 rounded-lg p-3">
                  <Lock className="h-5 w-5 text-blue-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Billing Information</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-transparent rounded-lg border border-gray-100">
                  <span className="text-sm font-medium text-gray-600">Name</span>
                  <span className="font-semibold text-gray-900">{buyer?.fullName || "Guest Customer"}</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-transparent rounded-lg border border-gray-100">
                  <span className="text-sm font-medium text-gray-600">Email</span>
                  <span className="font-semibold text-gray-900 text-sm">{buyer?.email || "Not provided"}</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-transparent rounded-lg border border-gray-100">
                  <span className="text-sm font-medium text-gray-600">Phone</span>
                  <span className="font-semibold text-gray-900">{buyer?.phone || "Not provided"}</span>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {orderError && (
              <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-red-900">Payment Error</p>
                  <p className="text-red-800 text-sm">{orderError}</p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Link
                href="/cart"
                className="flex-1 inline-block text-center bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold px-6 py-4 rounded-xl transition duration-200 flex items-center justify-center gap-2"
              >
                ← Back to Cart
              </Link>
              <button
                onClick={async () => {
                  console.log("🔍 Pay button clicked");
                  console.log("🔍 Current state:");
                  console.log("  - items:", items);
                  console.log("  - rentalSchedule:", rentalSchedule);
                  console.log("  - shippingOption:", shippingOption);
                  console.log("  - deliveryQuote:", deliveryQuote);
                  console.log("  - buyer:", buyer);
                  
                  // Use comprehensive validation function
                  const validation = validateCheckoutRequirements(shippingOption, buyer);
                  console.log("🔍 Validation result:", validation);
                  
                  if (!validation.valid) {
                    console.log("❌ Validation failed, showing modal");
                    // Show validation modal
                    setValidationType(validation.type as any);
                    setValidationMessage(validation.message);
                    setValidationModalOpen(true);
                    return;
                  }
                  
                  if (!process.env.NEXT_PUBLIC_PAYSTACK_KEY) {
                    setOrderError("Payment service is not configured");
                    return;
                  }
                  
                  setIsProcessing(true);
                  setOrderError(null);

                  try {
                    const ref = `EMPI-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                    const shippingCost = shippingOption === "empi" ? 2500 : 0;
                    const taxEstimate = subtotalWithCaution * 0.075;
                    const orderTotal = subtotalWithCaution + shippingCost + taxEstimate;
                    const amountInKobo = Math.round(orderTotal * 100);

                    localStorage.setItem('empi_pending_payment', JSON.stringify({
                      reference: ref,
                      email: buyer!.email,
                      amount: amountInKobo,
                      timestamp: Date.now()
                    }));

                    let modalAttempted = false;
                    if (typeof window !== "undefined" && (window as any).PaystackPop) {
                      try {
                        const handler = (window as any).PaystackPop.setup({
                          key: process.env.NEXT_PUBLIC_PAYSTACK_KEY,
                          email: buyer!.email,
                          amount: amountInKobo,
                          currency: "NGN",
                          ref: ref,
                          firstname: buyer!.fullName.split(" ")[0] || "Customer",
                          lastname: buyer!.fullName.split(" ").slice(1).join(" ") || "",
                          phone: buyer!.phone,
                          onClose: () => {
                            verifyAndProcessPayment(ref);
                          },
                          onSuccess: (response: any) => {
                            handlePaymentSuccess(response);
                          },
                        });

                        if (handler?.openIframe) {
                          handler.openIframe();
                          modalAttempted = true;
                          pollForPayment(ref);
                          return;
                        }
                      } catch (err) {
                        console.warn("Modal failed, using redirect:", err);
                      }
                    }

                    if (!modalAttempted) {
                      try {
                        const initRes = await fetch('/api/initialize-payment', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            email: buyer!.email,
                            amount: amountInKobo,
                            reference: ref,
                            firstname: buyer!.fullName.split(" ")[0] || "Customer",
                            lastname: buyer!.fullName.split(" ").slice(1).join(" ") || "",
                            phone: buyer!.phone,
                          }),
                        });

                        const initData = await initRes.json();
                        if (initRes.ok && initData.authorization_url) {
                          window.location.href = initData.authorization_url;
                        } else {
                          setOrderError(initData.error || "Failed to initialize payment");
                          setIsProcessing(false);
                        }
                      } catch (err) {
                        console.error("Payment initialization error:", err);
                        setOrderError("Failed to initialize payment. Please try again.");
                        setIsProcessing(false);
                      }
                    }
                  } catch (error) {
                    console.error("Payment error:", error);
                    setIsProcessing(false);
                    setOrderError("Failed to initialize payment. Please try again.");
                  }
                }}
                disabled={isProcessing}
                className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-400 text-white font-bold px-6 py-4 rounded-xl transition duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4" />
                    Pay ₦{totalAmount.toLocaleString()}
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              {/* Order Summary Sidebar */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-300">
                <h3 className="font-bold text-gray-900 mb-6 text-lg">Order Summary</h3>
                
                <div className="space-y-4">
                  {/* Item Breakdown */}
                  <div className="pb-4 border-b border-gray-200">
                    <p className="text-xs font-semibold text-gray-600 mb-3 uppercase tracking-wide">Items Breakdown</p>
                    <div className="space-y-3">
                      {items.map((item) => (
                        <div key={`${item.id}-${item.mode}`} className="text-sm bg-gray-50 p-3 rounded-lg">
                          <div className="flex justify-between mb-1">
                            <span className="text-gray-700 font-medium">{item.name}</span>
                            <span className="font-semibold text-gray-900">
                              {item.mode === 'rent' 
                                ? `₦${(item.price * item.quantity * (rentalSchedule?.rentalDays || 1)).toLocaleString()}`
                                : `₦${(item.price * item.quantity).toLocaleString()}`
                              }
                            </span>
                          </div>
                          {item.mode === 'rent' ? (
                            <div className="text-xs text-gray-600 mt-2 space-y-1">
                              <div>Qty: {item.quantity} × Price: ₦{item.price.toLocaleString()} × Days: {rentalSchedule?.rentalDays || 1}</div>
                              <div className="text-purple-700 font-semibold">= ₦{(item.price * item.quantity * (rentalSchedule?.rentalDays || 1)).toLocaleString()}</div>
                            </div>
                          ) : (
                            <div className="text-xs text-gray-600 mt-2">
                              Qty: {item.quantity} × ₦{item.price.toLocaleString()}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Subtotal */}
                  <div className="pb-4 border-b border-gray-200">
                    <p className="text-sm text-gray-600 mb-1">Subtotal</p>
                    <p className="font-bold text-gray-900 text-lg">₦{total.toLocaleString()}</p>
                  </div>

                  {/* Caution Fee (if applicable) */}
                  {cautionFee > 0 && (
                    <div className="pb-4 border-b border-gray-200">
                      <p className="text-sm text-amber-700 font-semibold mb-1 flex items-center gap-2">
                        🛡️ Caution Fee (50%)
                      </p>
                      <p className="font-bold text-amber-700 text-lg">₦{cautionFee.toLocaleString()}</p>
                      <p className="text-xs text-amber-600 mt-1">Applied on rental items</p>
                    </div>
                  )}

                  {/* Shipping */}
                  <div className="pb-4 border-b border-gray-200">
                    <p className="text-sm text-gray-600 mb-1">Shipping</p>
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-gray-900">{SHIPPING_OPTIONS[shippingOption].name}</span>
                      <span className="font-bold text-gray-900">{shippingCost === 0 ? "FREE" : `₦${shippingCost.toLocaleString()}`}</span>
                    </div>
                  </div>

                  {/* VAT */}
                  <div className="pb-4 border-b border-gray-200">
                    <p className="text-sm text-gray-600 mb-1">VAT (7.5%)</p>
                    <p className="font-bold text-gray-900">₦{taxEstimate.toLocaleString()}</p>
                  </div>

                  {/* Total */}
                  <div className="pt-4 bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-4">
                    <p className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Total Amount</p>
                    <p className="font-black text-3xl bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                      ₦{totalAmount.toLocaleString()}
                    </p>
                  </div>

                  {/* Status */}
                  <div className="pt-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <p className="text-xs font-bold text-gray-600 uppercase tracking-wide">Status</p>
                    </div>
                    <p className="text-sm text-green-700 font-semibold">✅ Ready for Payment</p>
                  </div>
                </div>
              </div>

              {/* Security Badge */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border border-green-200 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Lock className="h-4 w-4 text-green-600" />
                  <p className="text-xs font-bold text-green-900 uppercase tracking-wide">Secure Payment</p>
                </div>
                <p className="text-xs text-green-800">Your payment information is encrypted and secure. Powered by Paystack.</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Success Modal */}
      <PaymentSuccessModal
        isOpen={successModalOpen}
        onClose={() => {
          setSuccessModalOpen(false);
          // Cart already cleared in handlePaymentSuccess
        }}
        orderReference={successReference}
        total={totalAmount}
      />

      {/* Validation Modal - Checkout Requirements */}
      <CheckoutValidationModal
        isOpen={validationModalOpen}
        onClose={() => setValidationModalOpen(false)}
        validationType={validationType}
        message={validationMessage}
      />

      {/* Auth Modal - Mobile Login/Signup */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onAuthSuccess={(buyer) => {
          console.log("✅ User authenticated:", buyer);
          setAuthModalOpen(false);
        }}
      />

      <Footer />
    </div>
  );
}
