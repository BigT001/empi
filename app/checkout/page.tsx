"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { useCart } from "../components/CartContext";
import { useBuyer } from "../context/BuyerContext";
import PaymentSuccessModal from "../components/PaymentSuccessModal";
import { ShoppingBag, AlertCircle, CreditCard, Truck, MapPin } from "lucide-react";

const SHIPPING_OPTIONS = {
  empi: { id: "empi", name: "EMPI Delivery", cost: 2500, estimatedDays: "2-5 business days" },
  self: { id: "self", name: "Self Pickup", cost: 0, estimatedDays: "Ready within 24 hours" },
};

export default function CheckoutPage() {
  const { items, clearCart, total } = useCart();
  const { buyer } = useBuyer();
  const router = useRouter();

  const [isHydrated, setIsHydrated] = useState(false);
  const [shippingOption, setShippingOption] = useState<"empi" | "self">("empi");
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [successReference, setSuccessReference] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);

  useEffect(() => {
    setIsHydrated(true);
    // Load shipping preference from localStorage
    const saved = localStorage.getItem("empi_shipping_option");
    if (saved) setShippingOption(saved as "empi" | "self");
  }, []);

  // Handle payment success - save order and invoice
  const handlePaymentSuccess = async (response: any) => {
    console.log("🟢 Payment success handler called");
    console.log("Reference:", response?.reference);

    try {
      const shippingCost = shippingOption === "empi" ? 2500 : 0;
      const taxEstimate = total * 0.075;
      const totalAmount = total + shippingCost + taxEstimate;

      const orderData = {
        reference: response.reference,
        customer: {
          name: buyer?.fullName || "",
          email: buyer?.email || "",
          phone: buyer?.phone || "",
        },
        items,
        pricing: {
          subtotal: total,
          tax: taxEstimate,
          shipping: shippingCost,
          total: totalAmount,
        },
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
        
        // Generate invoice
        const invoiceData = {
          invoiceNumber: `INV-${response.reference}`,
          orderNumber: response.reference,
          customerName: buyer?.fullName || "",
          customerEmail: buyer?.email || "",
          customerPhone: buyer?.phone || "",
          subtotal: total,
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
  const shippingCost = SHIPPING_OPTIONS[shippingOption].cost;
  const taxEstimate = total * 0.075;
  const totalAmount = total + shippingCost + taxEstimate;

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
                <h2 className="font-bold text-gray-900 mb-4">Items in Cart</h2>
                <div className="space-y-3">
                  {items.map((item) => (
                    <div key={`${item.id}-${item.mode}`} className="flex justify-between">
                      <span>{item.name} (x{item.quantity})</span>
                      <span className="font-semibold">₦{(item.price * item.quantity).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pricing */}
              <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8 space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>₦{total.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Shipping ({shippingOption === "empi" ? "EMPI" : "Pickup"})</span>
                  <span>{shippingCost === 0 ? "FREE" : `₦${shippingCost.toLocaleString()}`}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Tax (7.5%)</span>
                  <span>₦{taxEstimate.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-3 border-t-2 border-gray-200">
                  <span>Total Amount</span>
                  <span className="text-purple-600">₦{totalAmount.toLocaleString()}</span>
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

              {/* Shipping Method */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-8">
                <p className="text-xs font-semibold text-green-900 mb-3 flex items-center gap-2">
                  {shippingOption === "empi" ? <Truck className="h-4 w-4" /> : <MapPin className="h-4 w-4" />}
                  Delivery Method
                </p>
                <div className="text-sm text-green-800 space-y-1">
                  <p><span className="font-semibold">Method:</span> {SHIPPING_OPTIONS[shippingOption].name}</p>
                  <p><span className="font-semibold">Est. Delivery:</span> {SHIPPING_OPTIONS[shippingOption].estimatedDays}</p>
                  <p><span className="font-semibold">Cost:</span> {shippingCost === 0 ? "FREE" : `₦${shippingCost.toLocaleString()}`}</p>
                </div>
              </div>

              {/* Payment Notice */}
              {orderError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                  <p className="text-sm text-red-800">
                    <strong>❌ Error:</strong> {orderError}
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
                  onClick={() => {
                    console.log("🖱️ Pay button clicked");
                    
                    if (!buyer?.fullName || !buyer?.email || !buyer?.phone) {
                      setOrderError("Please ensure your profile has complete information");
                      console.error("❌ Missing profile info:", {fullName: buyer?.fullName, email: buyer?.email, phone: buyer?.phone});
                      return;
                    }
                    
                    setIsProcessing(true);
                    setOrderError(null);
                    console.log("💳 Initiating payment for:", buyer.email);

                    // Initialize Paystack
                    const initPaystack = () => {
                      if (typeof window !== "undefined" && (window as any).PaystackPop) {
                        console.log("✅ Paystack loaded");

                        const ref = `EMPI-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                        console.log("📝 Reference generated:", ref);

                        try {
                          const handler = (window as any).PaystackPop.setup({
                            key: process.env.NEXT_PUBLIC_PAYSTACK_KEY || "",
                            email: buyer.email,
                            amount: Math.round(totalAmount * 100),
                            currency: "NGN",
                            ref: ref,
                            firstname: buyer.fullName.split(" ")[0],
                            lastname: buyer.fullName.split(" ").slice(1).join(" ") || " ",
                            phone: buyer.phone,
                            onClose: () => {
                              console.log("🔴 Modal closed - onClose callback fired!");
                              console.log("🔴 Modal closed - verifying payment...");
                              
                              // Verify payment with our API
                              fetch(`/api/verify-payment?reference=${ref}`)
                                .then(async (res) => {
                                  const data = await res.json();
                                  console.log("📊 Verification data:", data);
                                  
                                  if (data.success) {
                                    console.log("✅ Payment verified! Calling handlePaymentSuccess");
                                    handlePaymentSuccess({ 
                                      reference: data.reference,
                                      ...data 
                                    });
                                  } else {
                                    console.warn("⚠️ Payment verification returned false");
                                    setIsProcessing(false);
                                    setOrderError("Payment not confirmed. Please check your email or try again.");
                                  }
                                })
                                .catch(err => {
                                  console.error("❌ Verification error:", err);
                                  setIsProcessing(false);
                                  setOrderError("Could not verify payment. Please check your email or contact support.");
                                });
                            },
                            onSuccess: (response: any) => {
                              console.log("🟢 onSuccess callback fired!");
                              console.log("🟢 onSuccess fired with response:", response);
                              handlePaymentSuccess(response);
                            },
                            onError: (error: any) => {
                              console.error("❌ onError callback fired!");
                              console.error("❌ Payment error:", error);
                              setIsProcessing(false);
                              setOrderError("Payment failed. Please try again.");
                            },
                          });

                          console.log("🔵 Opening iframe...");
                          // Use pay() method which works better on mobile than openIframe()
                          if (typeof (handler as any).pay === 'function') {
                            console.log("📱 Using pay() method for better mobile support");
                            (handler as any).pay();
                          } else if (typeof (handler as any).openIframe === 'function') {
                            console.log("📱 Falling back to openIframe() method");
                            (handler as any).openIframe();
                            // Force display the iframe
                            if (handler.iframe && (handler.iframe as any).style) {
                              (handler.iframe as any).style.display = 'block';
                              (handler.iframe as any).style.visibility = 'visible';
                            }
                          } else {
                            console.error("❌ Neither pay() nor openIframe() is available!");
                            setIsProcessing(false);
                            setOrderError("Failed to open payment modal");
                            return;
                          }
                          
                          // WORKAROUND: Since callbacks don't always fire on mobile, 
                          // poll for payment status every second for 120 seconds
                          let pollCount = 0;
                          const maxPolls = 120;
                          const pollInterval = setInterval(async () => {
                            pollCount++;
                            
                            try {
                              const verifyRes = await fetch(`/api/verify-payment?reference=${ref}`);
                              const verifyData = await verifyRes.json();
                              
                              if (verifyData.success && verifyData.status === 'success') {
                                console.log("✅ PAYMENT DETECTED via polling!");
                                console.log("📊 Verification data:", verifyData);
                                clearInterval(pollInterval);
                                handlePaymentSuccess({ reference: ref, ...verifyData });
                                return;
                              }
                            } catch (err) {
                              // Silently fail - normal if not yet complete
                            }
                            
                            // Stop polling after 120 seconds
                            if (pollCount >= maxPolls) {
                              console.log("⏰ Polling stopped (120 second timeout)");
                              clearInterval(pollInterval);
                              setIsProcessing(false);
                            }
                          }, 1000);
                        } catch (error) {
                          console.error("❌ Setup error:", error);
                          setIsProcessing(false);
                          setOrderError("Failed to open payment modal");
                        }
                      } else {
                        console.log("⏳ Retrying Paystack load...");
                        setTimeout(initPaystack, 500);
                      }
                    };

                    initPaystack();
                  }}
                  disabled={isProcessing}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold px-6 py-3 rounded-lg transition"
                >
                  {isProcessing ? "Processing..." : `Pay ₦${totalAmount.toLocaleString()}`}
                </button>
              </div>
            </div>
          </div>

          {/* Order Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 sticky top-24">
              <h3 className="font-bold text-gray-900 mb-4">Order Summary</h3>
              <div className="space-y-4 text-sm">
                <div className="pb-4 border-b border-gray-200">
                  <p className="text-gray-600 mb-1">Items Count</p>
                  <p className="font-semibold text-gray-900">{items.reduce((sum, i) => sum + i.quantity, 0)} items</p>
                </div>
                <div className="pb-4 border-b border-gray-200">
                  <p className="text-gray-600 mb-1">Subtotal</p>
                  <p className="font-semibold text-gray-900">₦{total.toLocaleString()}</p>
                </div>
                <div className="pb-4 border-b border-gray-200">
                  <p className="text-gray-600 mb-1">Shipping</p>
                  <p className="font-semibold text-gray-900">{shippingCost === 0 ? "FREE" : `₦${shippingCost.toLocaleString()}`}</p>
                </div>
                <div className="pb-4 border-b border-gray-200">
                  <p className="text-gray-600 mb-1">Tax</p>
                  <p className="font-semibold text-gray-900">₦{taxEstimate.toLocaleString()}</p>
                </div>
                <div className="pt-4">
                  <p className="text-gray-600 text-xs mb-2">Total</p>
                  <p className="font-bold text-gray-900 text-xl">₦{totalAmount.toLocaleString()}</p>
                </div>
                <div className="pt-4">
                  <p className="text-gray-600 text-xs mb-2">Status</p>
                  <p className="text-xs text-yellow-600 font-semibold">🟡 Payment Setup In Progress</p>
                </div>
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

      <Footer />
    </div>
  );
}
