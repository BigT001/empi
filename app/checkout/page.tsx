"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { useCart } from "../components/CartContext";
import { useBuyer } from "../context/BuyerContext";
import { ShoppingBag, AlertCircle, CreditCard } from "lucide-react";

const SHIPPING_OPTIONS = {
  empi: { id: "empi", name: "EMPI Delivery", cost: 2500, estimatedDays: "2-5 business days" },
  self: { id: "self", name: "Self Pickup", cost: 0, estimatedDays: "Ready within 24 hours" },
};

export default function CheckoutPage() {
  const { items, clearCart, total } = useCart();
  const { buyer } = useBuyer();
  const router = useRouter();

  const [isHydrated, setIsHydrated] = useState(false);
  const shippingOption = "empi"; // Fixed to EMPI Delivery only
  const [successReference, setSuccessReference] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [customQuote, setCustomQuote] = useState<any>(null);
  const [paymentSuccessful, setPaymentSuccessful] = useState(false);
  const [guestCustomer, setGuestCustomer] = useState({
    fullName: '',
    email: '',
    phone: '',
  });

  useEffect(() => {
    setIsHydrated(true);
    // Load custom order quote if coming from chat
    const savedQuote = sessionStorage.getItem('customOrderQuote');
    if (savedQuote) {
      try {
        const quote = JSON.parse(savedQuote);
        console.log('[Checkout] Loaded custom quote from sessionStorage:', quote);
        
        // Ensure all required quote fields have proper values
        const completeQuote = {
          orderId: quote.orderId,
          orderNumber: quote.orderNumber,
          quotedPrice: quote.quotedPrice || 0,
          quotedVAT: quote.quotedVAT || 0,
          quotedTotal: quote.quotedTotal || (quote.quotedPrice || 0) + (quote.quotedVAT || 0),
          quantity: quote.quantity || 1,
          discountPercentage: quote.discountPercentage || 0,
          discountAmount: quote.discountAmount || 0,
        };
        
        console.log('[Checkout] Processed quote with values:', completeQuote);
        setCustomQuote(completeQuote);
      } catch (err) {
        console.error('[Checkout] Error parsing quote:', err);
      }
    }
  }, []);

  // Handle payment success - save order (invoice auto-generated via API)
  const handlePaymentSuccess = async (response: any) => {
    console.log("✅ Payment success handler called");
    console.log("Reference:", response?.reference);

    try {
      // Use buyer info or guest customer info
      const customerInfo = buyer || guestCustomer;
      
      if (!customerInfo.fullName || !customerInfo.email || !customerInfo.phone) {
        setOrderError("Customer information is incomplete. Please fill in all required fields.");
        setIsProcessing(false);
        return;
      }

      let orderData;
      
      // Consolidated order data - treat all orders the same way
      const shippingCost = customQuote ? 0 : (shippingOption === "empi" ? 2500 : 0);
      const subtotal = customQuote ? (customQuote.quotedPrice || 0) : total;
      const taxAmount = customQuote ? (customQuote.quotedVAT || 0) : (subtotal * 0.075);
      const totalAmount = customQuote ? (customQuote.quotedTotal || 0) : (subtotal + shippingCost + taxAmount);

      orderData = {
        reference: response.reference,
        buyerId: buyer?.id || null,
        customer: {
          name: customerInfo.fullName,
          email: customerInfo.email,
          phone: customerInfo.phone,
        },
        items: customQuote 
          ? [{
              id: customQuote.orderId,
              name: `Order #${customQuote.orderNumber}`,
              quantity: customQuote.quantity || 1,
              price: customQuote.quotedPrice || 0,
              mode: 'buy'
            }]
          : items,
        shippingType: shippingOption || 'standard',
        shippingCost: shippingCost,
        pricing: {
          subtotal: subtotal,
          discount: customQuote?.discountAmount || 0,
          tax: taxAmount,
          shipping: shippingCost,
          total: totalAmount,
        },
        status: "confirmed",
        createdAt: new Date().toISOString(),
        // Custom order linking fields
        isCustomOrder: !!customQuote,
        customOrderId: customQuote?.orderId || null,
      };

      console.log("💾 Saving order...");
      console.log("Order data:", JSON.stringify(orderData, null, 2));
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      });

      if (res.ok) {
        const orderRes = await res.json();
        console.log("✅ Order saved");
        console.log("Invoice generated:", orderRes.invoice?.invoiceNumber || "N/A");
        console.log("Order ID:", orderRes.orderId);
        
        if (!orderRes.orderId) {
          console.error("❌ ERROR: Order response missing orderId!");
          console.error("Full response:", orderRes);
          setOrderError("Order created but ID not returned. Please contact support.");
          setIsProcessing(false);
          return;
        }
        
        // Show success message
        console.log("🎉 Payment successful!");
        setPaymentSuccessful(true);
        setSuccessReference(response.reference);
        
        clearCart();
        
        // Clear custom quote from sessionStorage
        sessionStorage.removeItem('customOrderQuote');
      } else {
        let errorData: any = {};
        try {
          const text = await res.text();
          console.error("Raw response:", text);
          if (text) {
            errorData = JSON.parse(text);
          }
        } catch (e) {
          console.error("Could not parse error response as JSON");
        }
        console.error("❌ Order save failed with status:", res.status);
        console.error("Error details:", errorData);
        console.error("Full error object:", { status: res.status, statusText: res.statusText, body: errorData });
        
        // Log the orderData being sent for debugging
        console.error("Order data that was sent:", JSON.stringify(orderData, null, 2));
        
        setOrderError(errorData?.error || errorData?.details || "Failed to save order. Please contact support.");
      }
    } catch (error) {
      console.error("❌ Error saving order:", error);
      setOrderError("An error occurred. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Helper function to poll for payment
  const pollForPayment = (ref: string, customerEmail: string = '', customerName: string = '') => {
    let pollCount = 0;
    const maxPolls = 180;
    const pollInterval = setInterval(async () => {
      pollCount++;
      try {
        const params = new URLSearchParams();
        params.append('reference', ref);
        if (customerEmail) params.append('email', customerEmail);
        if (customerName) params.append('name', customerName);
        const verifyRes = await fetch(`/api/verify-payment?${params.toString()}`);
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
  const verifyAndProcessPayment = async (ref: string, customerEmail: string = '', customerName: string = '') => {
    try {
      const params = new URLSearchParams();
      params.append('reference', ref);
      if (customerEmail) params.append('email', customerEmail);
      if (customerName) params.append('name', customerName);
      const res = await fetch(`/api/verify-payment?${params.toString()}`);
      const data = await res.json();
      
      if (data.success && data.status === 'success') {
        console.log("✅ Payment confirmed!");
        handlePaymentSuccess({ reference: ref, ...data });
      } else {
        console.log("Payment pending or failed");
        const customerInfo = buyer || guestCustomer;
        pollForPayment(ref, customerInfo?.email || '', customerInfo?.fullName || '');
      }
    } catch (err) {
      console.error("Verification error:", err);
      pollForPayment(ref);
    }
  };

  if (!isHydrated) return null;

  // ===== PAYMENT SUCCESS - Show success message =====
  if (paymentSuccessful) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 max-w-2xl mx-auto px-4 py-12 w-full">
          <div className="bg-white rounded-lg shadow-md border border-green-200 p-12">
            <div className="text-center">
              {/* Success Icon */}
              <div className="mb-6 flex justify-center">
                <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-5xl">📦</span>
                </div>
              </div>

              {/* Title */}
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Track Your Order</h1>

              {/* Description */}
              <p className="text-gray-600 text-lg mb-8">
                Check messages on your product card and visit the dashboard to track your order progress in real-time
              </p>

              {/* Buttons */}
              <div className="space-y-3 max-w-sm mx-auto">
                <Link href="/dashboard?tab=orders" className="block w-full bg-gradient-to-r from-lime-600 to-green-600 hover:from-lime-700 hover:to-green-700 text-white px-6 py-3 rounded-lg font-semibold transition shadow-md hover:shadow-lg">
                  Go to Dashboard Orders
                </Link>
                <Link href="/" className="block w-full bg-gray-100 hover:bg-gray-200 text-gray-900 px-6 py-3 rounded-lg font-semibold transition">
                  Continue Shopping
                </Link>
              </div>

              {/* Reference Number */}
              {successReference && (
                <div className="mt-8 pt-8 border-t border-gray-200">
                  <p className="text-sm text-gray-600 mb-1">Order Reference</p>
                  <p className="text-xl font-semibold text-gray-900">{successReference}</p>
                </div>
              )}
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // ===== EMPTY CART - But allow if custom order quote exists or payment was successful =====
  if (items.length === 0 && !customQuote && !paymentSuccessful) {
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
  let shippingCost, taxEstimate, totalAmount, displayItems, displayTotal, displaySubtotal;
  
  if (customQuote) {
    // Custom order totals - ensure all values are numbers
    const quotedPrice = typeof customQuote.quotedPrice === 'number' ? customQuote.quotedPrice : parseFloat(customQuote.quotedPrice) || 0;
    const quotedVAT = typeof customQuote.quotedVAT === 'number' ? customQuote.quotedVAT : parseFloat(customQuote.quotedVAT) || 0;
    const quotedTotal = typeof customQuote.quotedTotal === 'number' ? customQuote.quotedTotal : parseFloat(customQuote.quotedTotal) || 0;
    
    shippingCost = 0;
    taxEstimate = quotedVAT;
    totalAmount = quotedTotal || (quotedPrice + quotedVAT);
    displayItems = [{
      name: `Custom Order #${customQuote.orderNumber}`,
      quantity: customQuote.quantity || 1,
      price: quotedPrice,
      total: quotedPrice * (customQuote.quantity || 1)
    }];
    displaySubtotal = quotedPrice;
    displayTotal = totalAmount;
    
    console.log('[Checkout] Calculated custom quote totals:', {
      quotedPrice,
      quotedVAT,
      quotedTotal,
      displaySubtotal,
      displayTotal,
    });
  } else {
    // Cart totals
    shippingCost = SHIPPING_OPTIONS[shippingOption].cost;
    taxEstimate = total * 0.075;
    totalAmount = total + shippingCost + taxEstimate;
    displayItems = items;
    displaySubtotal = total;
    displayTotal = totalAmount;
  }

  // ===== CHECKOUT FORM =====
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 max-w-4xl mx-auto px-4 py-12 w-full">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Payment Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-8">
              <div className="flex items-center gap-3 mb-6">
                <CreditCard className="h-6 w-6 text-purple-600" />
                <h1 className="text-3xl font-bold">Order Summary</h1>
              </div>

              {/* Order Summary */}
              <div className="bg-gray-50 rounded-lg p-6 mb-8">
                <h2 className="font-bold text-gray-900 mb-4">Items in {customQuote ? 'Order' : 'Cart'}</h2>
                <div className="space-y-3">
                  {displayItems.map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between">
                      <span>{item.name} {item.quantity && item.quantity > 1 ? `(x${item.quantity})` : ''}</span>
                      <span className="font-semibold">₦{((item.total || item.price * (item.quantity || 1)) || 0).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pricing */}
              <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8 space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>₦{displaySubtotal.toLocaleString()}</span>
                </div>
                {customQuote && customQuote.discountAmount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount</span>
                    <span>-₦{customQuote.discountAmount.toLocaleString()}</span>
                  </div>
                )}
                {!customQuote && (
                  <div className="flex justify-between text-sm">
                    <span>Shipping ({shippingOption === "empi" ? "EMPI" : "Pickup"})</span>
                    <span>{shippingCost === 0 ? "FREE" : `₦${shippingCost.toLocaleString()}`}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span>Tax (7.5%)</span>
                  <span>₦{taxEstimate.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-3 border-t-2 border-gray-200">
                  <span>Total Amount</span>
                  <span className="text-purple-600">₦{displayTotal.toLocaleString()}</span>
                </div>
              </div>

              {/* Customer Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-xs font-semibold text-blue-900 mb-3 uppercase">Billing Information</p>
                <div className="text-sm text-blue-800 space-y-1">
                  <p><span className="font-semibold">Name:</span> {buyer?.fullName || "Guest Customer"}</p>
                  <p><span className="font-semibold">Email:</span> {buyer?.email || "Not provided"}</p>
                  <p><span className="font-semibold">Phone:</span> {buyer?.phone || "Not provided"}</p>
                </div>
              </div>

              {/* Payment Notice */}
              {orderError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                  <p className="text-sm text-red-800">
                    <strong>⚠️ Error:</strong> {orderError}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Link
                  href="/cart"
                  className="flex-1 inline-block text-center bg-gray-600 hover:bg-gray-700 text-white font-semibold px-6 py-3 rounded-lg transition"
                >
                  ← Back to Cart
                </Link>
                <button
                  onClick={async () => {
                    console.log("Pay button clicked");
                    
                    // Use buyer info if logged in, otherwise use guest customer info
                    const customerInfo = buyer || guestCustomer;
                    
                    if (!customerInfo?.fullName || !customerInfo?.email || !customerInfo?.phone) {
                      setOrderError("Please provide your full name, email, and phone number");
                      console.log("Incomplete customer info:", { fullName: customerInfo?.fullName, email: customerInfo?.email, phone: customerInfo?.phone });
                      return;
                    }
                    
                    // Validate email format
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (!emailRegex.test(customerInfo.email)) {
                      setOrderError("Please provide a valid email address");
                      console.log("Invalid email format:", customerInfo.email);
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
                      const amountInKobo = Math.round(displayTotal * 100);

                      console.log("💳 Payment Details:", { ref, amount: displayTotal, email: customerInfo.email });

                      // Store payment info in localStorage
                      localStorage.setItem('empi_pending_payment', JSON.stringify({
                        reference: ref,
                        email: customerInfo.email,
                        amount: amountInKobo,
                        timestamp: Date.now()
                      }));

                      // Attempt modal first if Paystack is available
                      let modalAttempted = false;
                      if (typeof window !== "undefined" && (window as any).PaystackPop) {
                        try {
                          console.log("Attempting Paystack modal...");
                          const handler = (window as any).PaystackPop.setup({
                            key: process.env.NEXT_PUBLIC_PAYSTACK_KEY,
                            email: buyer?.email || customerInfo.email,
                            amount: amountInKobo,
                            currency: "NGN",
                            ref: ref,
                            firstname: customerInfo.fullName.split(" ")[0] || "Customer",
                            lastname: customerInfo.fullName.split(" ").slice(1).join(" ") || "",
                            phone: customerInfo.phone,
                            onClose: () => {
                              console.log("Paystack modal closed - verifying payment...");
                              // Small delay to ensure payment is processed
                              setTimeout(() => {
                                verifyAndProcessPayment(ref, customerInfo.email, customerInfo.fullName);
                              }, 1500);
                            },
                            onSuccess: (response: any) => {
                              console.log("Paystack onSuccess called with response:", response);
                              // Immediately handle success
                              handlePaymentSuccess({ reference: ref, ...response });
                            },
                          });

                          if (handler?.openIframe) {
                            console.log("Opening Paystack iframe...");
                            handler.openIframe();
                            modalAttempted = true;
                            // Start polling in case onSuccess doesn't fire
                            setTimeout(() => {
                              console.log("Starting payment verification poll...");
                              pollForPayment(ref);
                            }, 2000);
                            return;
                          } else if (handler?.pay) {
                            // Fallback to pay() method
                            console.log("Using pay() method...");
                            handler.pay();
                            modalAttempted = true;
                            setTimeout(() => {
                              console.log("Starting payment verification poll (pay method)...");
                              pollForPayment(ref);
                            }, 2000);
                            return;
                          }
                        } catch (err) {
                          console.warn("Modal failed, using redirect:", err);
                        }
                      }

                      // Fallback to backend initialization
                      if (!modalAttempted) {
                        console.log("Using backend payment initialization");
                        try {
                          const initRes = await fetch('/api/initialize-payment', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              email: customerInfo.email,
                              amount: amountInKobo,
                              reference: ref,
                              firstname: customerInfo.fullName.split(" ")[0] || "Customer",
                              lastname: customerInfo.fullName.split(" ").slice(1).join(" ") || "",
                              phone: customerInfo.phone,
                            }),
                          });

                          const initData = await initRes.json();
                          if (initRes.ok && initData.authorization_url) {
                            console.log("✅ Payment initialized, redirecting to:", initData.authorization_url);
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
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold px-6 py-3 rounded-lg transition"
                >
                  {isProcessing ? "Processing..." : `Pay ₦${displayTotal.toLocaleString()}`}
                </button>
              </div>

              {/* Secured by Paystack Badge */}
              <div className="mt-4 text-center">
                <p className="text-xs text-gray-500 flex items-center justify-center gap-2">
                  🔒 Secured by{" "}
                  <span className="font-semibold text-gray-700">Paystack</span>
                </p>
              </div>
            </div>
          </div>

          {/* Order Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 sticky top-24">
              <h3 className="font-bold text-gray-900 mb-4">Order Summary</h3>
              <div className="space-y-4 text-sm">
                {!customQuote && (
                  <div className="pb-4 border-b border-gray-200">
                    <p className="text-gray-600 mb-1">Items Count</p>
                    <p className="font-semibold text-gray-900">{items.reduce((sum, i) => sum + i.quantity, 0)} items</p>
                  </div>
                )}
                <div className="pb-4 border-b border-gray-200">
                  <p className="text-gray-600 mb-1">Subtotal</p>
                  <p className="font-semibold text-gray-900">₦{displaySubtotal.toLocaleString()}</p>
                </div>
                {!customQuote && (
                  <div className="pb-4 border-b border-gray-200">
                    <p className="text-gray-600 mb-1">Shipping</p>
                    <p className="font-semibold text-gray-900">{shippingCost === 0 ? "FREE" : `₦${shippingCost.toLocaleString()}`}</p>
                  </div>
                )}
                <div className="pb-4 border-b border-gray-200">
                  <p className="text-gray-600 mb-1">Tax</p>
                  <p className="font-semibold text-gray-900">₦{taxEstimate.toLocaleString()}</p>
                </div>
                <div className="pt-4">
                  <p className="text-gray-600 text-xs mb-2">Total</p>
                  <p className="font-bold text-gray-900 text-xl">₦{displayTotal.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

