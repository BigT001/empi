"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Footer } from "../components/Footer";
import { useCart } from "../components/CartContext";
import { useBuyer } from "../context/BuyerContext";
import AuthModal from "../components/AuthModal";
import { CheckoutValidationModal } from "../components/CheckoutValidationModal";
import PaymentSuccessModal from "../components/PaymentSuccessModal";
import DeliveryMethodModal from "../components/DeliveryMethodModal";
import { ShoppingBag, AlertCircle, CreditCard, Truck, MapPin, Clock, Lock, CheckCircle2, FileText, ArrowRight } from "lucide-react";

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
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"paystack">("paystack");
  const [validationModalOpen, setValidationModalOpen] = useState(false);
  const [validationType, setValidationType] = useState<"rental_schedule" | "delivery_info" | "buyer_info">("rental_schedule");
  const [validationMessage, setValidationMessage] = useState("");
  const [customOrderQuote, setCustomOrderQuote] = useState<any>(null);
  const [isFromQuote, setIsFromQuote] = useState(false);
  const [customOrderDetails, setCustomOrderDetails] = useState<any>(null);
  const [loadingCustomOrder, setLoadingCustomOrder] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);
  const [paymentProofUrl, setPaymentProofUrl] = useState<string | null>(null);
  const [orderSummary, setOrderSummary] = useState<any>(null);
  const [paymentSuccessModalOpen, setPaymentSuccessModalOpen] = useState(false);
  const [paymentReference, setPaymentReference] = useState<string | null>(null);
  const [verifyingPayment, setVerifyingPayment] = useState(false);
  const [deliveryMethodModalOpen, setDeliveryMethodModalOpen] = useState(false);

  // Calculate caution fee (50% of rental items total)
  const rentalTotal = orderSummary?.rentalTotal ?? items.reduce((sum, item) => {
    if (item.mode === 'rent') {
      const days = rentalSchedule?.rentalDays || 1;
      return sum + (item.price * item.quantity * days);
    }
    return sum;
  }, 0);
  const cautionFee = orderSummary?.cautionFee ?? (rentalTotal * 0.5);

  // Calculate bulk discount - Only for BUY items (not rentals)
  const buyItems = orderSummary?.items?.filter((item: any) => item.mode === 'buy') ?? items.filter(item => item.mode === 'buy');
  const totalBuyQuantity = orderSummary?.totalBuyQuantity ?? buyItems.reduce((sum: number, item: any) => sum + item.quantity, 0);
  
  // Discount tiers
  let discountPercentage = orderSummary?.discountPercentage ?? 0;
  if (!orderSummary && totalBuyQuantity >= 10) {
    discountPercentage = 10; // 10% for 10+ sets
  } else if (!orderSummary && totalBuyQuantity >= 6) {
    discountPercentage = 7; // 7% for 6-9 sets
  } else if (!orderSummary && totalBuyQuantity >= 3) {
    discountPercentage = 5; // 5% for 3-5 sets
  }

  // Calculate buy subtotal (before discount)
  const buySubtotal = orderSummary?.buySubtotal ? (orderSummary.buySubtotal + orderSummary.discountAmount) : items.reduce((sum, item) => {
    if (item.mode === 'buy') {
      return sum + (item.price * item.quantity);
    }
    return sum;
  }, 0);

  // Apply discount to buy items only
  const discountAmount = orderSummary?.discountAmount ?? (buySubtotal * (discountPercentage / 100));
  const buySubtotalAfterDiscount = orderSummary?.buySubtotal ?? (buySubtotal - discountAmount);

  // Subtotal for VAT = goods/services only (buy with discount + rent, NO caution fee)
  const subtotalForVAT = buySubtotalAfterDiscount + rentalTotal;
  
  // Total with caution fee (for order summary display)
  const subtotalWithCaution = subtotalForVAT + cautionFee;

  useEffect(() => {
    setIsHydrated(true);
    // Load shipping preference from localStorage
    const saved = localStorage.getItem("empi_shipping_option");
    if (saved) setShippingOption(saved as "empi" | "self");
    
    // Load custom order quote from sessionStorage (from chat Pay Now button)
    // Check URL parameter first to get the orderId
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const orderId = params.get('orderId');
      const quoteData = sessionStorage.getItem('customOrderQuote');
      
      if (quoteData) {
        try {
          const parsedQuote = JSON.parse(quoteData);
          
          // Validate that the quote has essential fields
          if (!parsedQuote.orderId || !parsedQuote.quotedTotal) {
            console.error('[Checkout] ❌ Invalid quote data - missing orderId or quotedTotal:', parsedQuote);
            sessionStorage.removeItem('customOrderQuote');
            setCustomOrderQuote(null);
            setIsFromQuote(false);
          } else {
            setCustomOrderQuote(parsedQuote);
            setIsFromQuote(true);
            console.log('[Checkout] ✅ Loaded quote from chat:', {
              orderId: parsedQuote.orderId,
              orderNumber: parsedQuote.orderNumber,
              quotedTotal: parsedQuote.quotedTotal,
              quantity: parsedQuote.quantity
            });
          }
        } catch (error) {
          console.error('[Checkout] Error parsing quote data:', error);
          sessionStorage.removeItem('customOrderQuote');
        }
      }
    }
    
    // Check if user is logged in on mobile - show auth modal if not
    if (!buyer && typeof window !== "undefined") {
      const isMobile = window.innerWidth < 768; // md breakpoint
      if (isMobile) {
        setAuthModalOpen(true);
      }
    }

    // Handle Paystack redirect with payment reference
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const reference = params.get('reference');
      
      if (reference) {
        console.log('[Checkout] 🔗 Paystack redirect detected with reference:', reference);
        setPaymentReference(reference);
        setCreatedOrderId(reference); // Set orderId from reference for modal
        setVerifyingPayment(true);
        
        // Verify payment with our API
        const verifyPayment = async () => {
          try {
            console.log('[Checkout] 📡 Calling /api/verify-payment with reference:', reference);
            const verifyRes = await fetch(`/api/verify-payment?reference=${reference}`);
            console.log('[Checkout] Verify response status:', verifyRes.status);
            const verifyData = await verifyRes.json();
            console.log('[Checkout] Verify response data:', verifyData);
            
            if (verifyRes.ok && verifyData.success) {
              console.log('[Checkout] ✅ Payment verified successfully');
              console.log('[Checkout] Order details:', verifyData);
              
              // Clear cart now that payment is confirmed
              clearCart();
              console.log('[Checkout] ✅ Cart cleared after payment verification');
              
              // Show delivery method modal instead of success modal
              console.log('[Checkout] 🚪 Opening delivery method modal');
              setDeliveryMethodModalOpen(true);
              
              // Clean up URL (remove reference parameter)
              window.history.replaceState({}, '', '/checkout');
            } else {
              console.error('[Checkout] ❌ Payment verification failed:', verifyData);
              setOrderError('Payment verification failed: ' + (verifyData.error || 'Unknown error'));
            }
          } catch (error) {
            console.error('[Checkout] ❌ Error verifying payment:', error);
            setOrderError('Error verifying payment: ' + (error instanceof Error ? error.message : 'Unknown error'));
          } finally {
            console.log('[Checkout] Verification complete, setting verifyingPayment to false');
            setVerifyingPayment(false);
          }
        };
        
        verifyPayment();
      } else {
        console.log('[Checkout] No reference parameter in URL');
      }
    }
  }, [buyer]);

  // Auto-create order when checkout page loads with items and buyer is authenticated
  useEffect(() => {
    if (isHydrated && items.length > 0 && buyer && !createdOrderId && !isProcessing && !isFromQuote) {
      const autoCreateOrder = async () => {
        // Validate rental schedule if needed
        if (items.some(i => i.mode === 'rent') && !rentalSchedule) {
          console.log('[Checkout] Skipping auto-create: missing rental schedule');
          return;
        }

        console.log('[Checkout] 🚀 Auto-creating order...');
        setIsProcessing(true);
        setOrderError(null);

        try {
          const shippingCost = shippingOption === "empi" ? 2500 : 0;
          const taxEstimate = subtotalForVAT * 0.075;
          const orderTotal = subtotalWithCaution + shippingCost + taxEstimate;

          // Parse buyer name
          const nameParts = (buyer?.fullName || "").trim().split(" ");
          const firstName = nameParts[0] || buyer?.fullName || "Customer";
          const lastName = nameParts.slice(1).join(" ") || (nameParts[0] || "");
          
          const orderData = {
            buyerId: buyer?.id,
            firstName: firstName,
            lastName: lastName,
            email: buyer?.email,
            phone: buyer?.phone,
            address: deliveryQuote?.deliveryPoint?.address || (shippingOption === "self" ? "EMPI Pickup Location - Lagos" : ""),
            city: deliveryQuote?.deliveryPoint?.city || (shippingOption === "self" ? "Lagos" : ""),
            state: deliveryQuote?.deliveryPoint?.state || (shippingOption === "self" ? "Lagos" : ""),
            zipCode: deliveryQuote?.deliveryPoint?.zipCode || "",
            country: "Nigeria",
            shippingType: shippingOption,
            items: items.map(item => ({
              productId: item.id,
              name: item.name,
              quantity: item.quantity,
              price: item.price,
              mode: item.mode,
              rentalDays: rentalSchedule?.rentalDays || 0,
              selectedSize: item.size,
              imageUrl: item.image,
            })),
            rentalSchedule: rentalSchedule || undefined,
            deliveryQuote: shippingOption === "empi" ? deliveryQuote : null,
            subtotal: buySubtotalAfterDiscount,
            vat: taxEstimate,
            total: orderTotal,
            cautionFee: cautionFee || 0,
            isFromQuote: false,
            customOrderId: null,
            discountAmount: discountAmount,
            paymentMethod: "paystack", // Use Paystack instead of bank transfer
          };

          const createRes = await fetch('/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData),
          });

          if (!createRes.ok) {
            const error = await createRes.json();
            throw new Error(error.error || 'Failed to create order');
          }

          const orderRes = await createRes.json();
          console.log('✅ Order auto-created:', orderRes);
          
          // Store order summary before clearing cart so we can display it
          setOrderSummary({
            items: items,
            buySubtotal: buySubtotalAfterDiscount,
            rentalTotal: rentalTotal,
            cautionFee: cautionFee,
            discountAmount: discountAmount,
            discountPercentage: discountPercentage,
            totalBuyQuantity: totalBuyQuantity,
            shippingCost: shippingCost,
            taxEstimate: taxEstimate,
            totalAmount: subtotalWithCaution + shippingCost + taxEstimate,
            rentalSchedule: rentalSchedule,
            shippingOption: shippingOption,
          });
          
          setCreatedOrderId(orderRes.orderId);
          
          // DON'T clear cart here - only clear it after payment is verified
          // This allows users to keep shopping if they navigate away without paying
          console.log('✅ Order auto-created (cart NOT cleared yet - will clear after payment)');
        } catch (error) {
          console.error('Auto-create order error:', error);
          setOrderError(error instanceof Error ? error.message : 'Failed to create order');
        } finally {
          setIsProcessing(false);
        }
      };

      autoCreateOrder();
    }
  }, [isHydrated, items, buyer, createdOrderId, isProcessing, isFromQuote, shippingOption, rentalSchedule, deliveryQuote, subtotalForVAT, subtotalWithCaution, cautionFee, buySubtotalAfterDiscount, discountAmount]);

  // Load custom order details when we have a quote
  useEffect(() => {
    if (isFromQuote && customOrderQuote?.orderId) {
      const fetchCustomOrder = async () => {
        try {
          setLoadingCustomOrder(true);
          const response = await fetch(`/api/custom-orders/${customOrderQuote.orderId}`);
          if (response.ok) {
            const data = await response.json();
            setCustomOrderDetails(data);
            console.log('[Checkout] Loaded custom order details:', data);
          } else {
            console.warn('[Checkout] Failed to load custom order details');
          }
        } catch (error) {
          console.error('[Checkout] Error loading custom order:', error);
        } finally {
          setLoadingCustomOrder(false);
        }
      };
      
      fetchCustomOrder();
    }
  }, [isFromQuote, customOrderQuote?.orderId]);

  // Handle Paystack payment initialization
  const handleProceedToPayment = async () => {
    if (!createdOrderId) {
      setOrderError('Order not created yet');
      return;
    }

    console.log('[Checkout] 💳 Initializing Paystack payment...');
    setIsProcessing(true);
    setOrderError(null);

    try {
      const nameParts = (buyer?.fullName || "").trim().split(" ");
      const firstName = nameParts[0] || buyer?.fullName || "Customer";
      const lastName = nameParts.slice(1).join(" ") || (nameParts[0] || "");

      // Step 1: Initialize Paystack payment
      const paymentInitRes = await fetch('/api/initialize-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: buyer?.email,
          amount: Math.round(totalAmount * 100), // Convert to kobo
          reference: createdOrderId,
          firstname: firstName,
          lastname: lastName,
          phone: buyer?.phone,
        }),
      });

      if (!paymentInitRes.ok) {
        const error = await paymentInitRes.json();
        throw new Error(error.error || 'Failed to initialize payment');
      }

      const paymentData = await paymentInitRes.json();
      console.log('✅ Paystack initialized:', paymentData);

      // Use Paystack's JavaScript library if available, otherwise redirect
      if (typeof window !== 'undefined' && (window as any).PaystackPop) {
        const PaystackPop = (window as any).PaystackPop;
        const paystackConfig = {
          key: process.env.NEXT_PUBLIC_PAYSTACK_KEY,
          email: buyer?.email,
          amount: Math.round(totalAmount * 100),
          ref: createdOrderId,
          onClose: function() {
            console.log('[Checkout] ❌ User closed payment modal without paying');
            setOrderError('Payment cancelled. Please try again.');
            setIsProcessing(false);
          },
          onSuccess: function(response: any) {
            console.log('[Checkout] ✅ Paystack payment successful - response:', response);
            console.log('[Checkout] Reference from Paystack:', response.reference);
            setPaymentReference(response.reference);
            setIsProcessing(false);
            // Redirect to verify payment with the reference
            const redirectUrl = `/checkout?reference=${response.reference}`;
            console.log('[Checkout] 🔄 Redirecting to:', redirectUrl);
            console.log('[Checkout] Setting location.href...');
            window.location.href = redirectUrl;
            // Fallback in case window.location.href doesn't work immediately
            setTimeout(() => {
              console.log('[Checkout] ⚠️ Fallback redirect attempt (window.location.href may not have worked)');
              window.location.replace(redirectUrl);
            }, 1000);
          },
        };
        
        console.log('[Checkout] Opening Paystack modal with config:', paystackConfig);
        PaystackPop.setup(paystackConfig).openIframe();
      } else if (paymentData.authorization_url) {
        // Fallback: Direct redirect to Paystack
        console.log('[Checkout] PaystackPop not available, using direct redirect to Paystack');
        window.location.href = paymentData.authorization_url;
      } else {
        throw new Error('No authorization URL received from Paystack');
      }
    } catch (error) {
      console.error('Payment initialization error:', error);
      setOrderError(error instanceof Error ? error.message : 'Failed to process payment');
      setIsProcessing(false);
    }
  };

  if (!isHydrated) return null;

  // ===== VERIFYING PAYMENT =====
  if (verifyingPayment) {
    return (
      <div className="min-h-screen flex flex-col">
        <header className="border-b border-gray-200 sticky top-0 z-40 bg-white shadow-sm">
          <div className="mx-auto w-full px-2 md:px-6 py-2 md:py-4">
            <h1 className="text-2xl font-bold text-gray-900">💳 Checkout</h1>
          </div>
        </header>
        <main className="flex-1 max-w-4xl mx-auto px-4 py-12 w-full flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-lime-600 border-t-transparent mx-auto mb-6"></div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Verifying your payment...</h2>
            <p className="text-gray-600">Please wait while we confirm your transaction with Paystack</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // ===== EMPTY CART =====
  if (items.length === 0 && !isFromQuote && !createdOrderId) {
    return (
      <div className="min-h-screen flex flex-col">
        <header className="border-b border-gray-200 sticky top-0 z-40 bg-white shadow-sm">
          <div className="mx-auto w-full px-2 md:px-6 py-2 md:py-4">
            <h1 className="text-2xl font-bold text-gray-900">🛒 Checkout</h1>
          </div>
        </header>
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

  // Loading state for custom order
  if (isFromQuote && loadingCustomOrder) {
    return (
      <div className="min-h-screen flex flex-col">
        <header className="border-b border-gray-200 sticky top-0 z-40 bg-white shadow-sm">
          <div className="mx-auto w-full px-2 md:px-6 py-2 md:py-4">
            <h1 className="text-2xl font-bold text-gray-900">⏳ Loading Quote...</h1>
          </div>
        </header>
        <main className="flex-1 max-w-4xl mx-auto px-4 py-12 w-full">
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lime-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading quote details...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // ===== CALCULATE TOTALS =====
  const itemCount = orderSummary?.items?.reduce((sum: number, i: any) => sum + i.quantity, 0) ?? items.reduce((sum, i) => sum + i.quantity, 0);
  const shippingCost = orderSummary?.shippingCost ?? SHIPPING_OPTIONS[shippingOption].cost;
  // VAT is only on goods/services (NOT on caution fee)
  const taxEstimate = orderSummary?.taxEstimate ?? (subtotalForVAT * 0.075);
  // Use quote total if from quote, otherwise calculate regular checkout total
  const totalAmount = isFromQuote && customOrderQuote 
    ? customOrderQuote.quotedTotal 
    : (orderSummary?.totalAmount ?? (subtotalWithCaution + shippingCost + taxEstimate));

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <header className="border-b border-gray-200 sticky top-0 z-40 bg-white shadow-sm">
        <div className="mx-auto w-full px-2 md:px-6 py-2 md:py-4">
          <h1 className="text-2xl font-bold text-gray-900">💳 Checkout</h1>
        </div>
      </header>
      <main className="flex-1 max-w-6xl mx-auto px-4 py-8 md:py-12 w-full">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-gradient-to-br from-lime-600 to-green-600 rounded-lg p-3">
              <CreditCard className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-lime-600 to-green-600 bg-clip-text text-transparent">
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
            {!isFromQuote && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 hover:shadow-md transition-shadow duration-300">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-gradient-to-br from-blue-100 to-blue-50 rounded-lg p-3">
                  <ShoppingBag className="h-5 w-5 text-blue-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Order Items ({itemCount})</h2>
              </div>
              
              <div className="space-y-3">
                {(orderSummary?.items || items).map((item: any) => (
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
            )}

            {/* Custom Order Details with Image (Quote Mode) */}
            {isFromQuote && customOrderDetails && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 hover:shadow-md transition-shadow duration-300">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-gradient-to-br from-blue-100 to-blue-50 rounded-lg p-3">
                    <ShoppingBag className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Order Item (1)</h2>
                    <p className="text-xs text-gray-500 mt-1">Custom Order</p>
                  </div>
                </div>
                
                <div className="grid md:grid-cols-3 gap-8">
                  {/* Image Section - Main Picture Only */}
                  <div className="md:col-span-1">
                    <div className="bg-gray-100 rounded-xl overflow-hidden">
                      {customOrderDetails.designUrl || customOrderDetails.designUrls?.[0] ? (
                        <img
                          src={customOrderDetails.designUrl || customOrderDetails.designUrls?.[0]}
                          alt={customOrderDetails.description}
                          className="w-full h-64 object-cover"
                        />
                      ) : (
                        <div className="w-full h-64 flex items-center justify-center bg-gray-200 text-gray-500">
                          <div className="text-center">
                            <ShoppingBag className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                            <p className="text-sm">No image available</p>
                          </div>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-2 text-center">Main design image</p>
                  </div>

                  {/* Details Section */}
                  <div className="md:col-span-2 space-y-4">
                    {/* Order Number & Name */}
                    <div>
                      <p className="text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Order Number</p>
                      <p className="text-lg font-bold text-gray-900">{customOrderDetails.orderNumber}</p>
                      <p className="text-sm text-gray-600 mt-2">Customer: {customOrderDetails.fullName}</p>
                    </div>

                    {/* Description */}
                    <div className="pt-2 border-t border-gray-200">
                      <p className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Description</p>
                      <p className="text-sm text-gray-700 leading-relaxed">{customOrderDetails.description}</p>
                    </div>

                    {/* Quantity & Location */}
                    <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-200">
                      <div>
                        <p className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Quantity</p>
                        <p className="text-lg font-bold text-gray-900">{customOrderDetails.quantity} unit(s)</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Location</p>
                        <p className="text-sm text-gray-900">{customOrderDetails.city}</p>
                        {customOrderDetails.state && (
                          <p className="text-sm text-gray-600">{customOrderDetails.state}</p>
                        )}
                      </div>
                    </div>

                    {/* Contact Info */}
                    <div className="bg-gradient-to-r from-blue-50 to-transparent rounded-lg p-4 pt-4 border-t border-gray-200 mt-4">
                      <p className="text-xs font-semibold text-gray-600 mb-3 uppercase tracking-wide">Contact Information</p>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-600 font-medium">Email:</span>
                          <span className="text-sm text-gray-900">{customOrderDetails.email}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-600 font-medium">Phone:</span>
                          <span className="text-sm text-gray-900">{customOrderDetails.phone}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Custom Order Quote (from chat Pay Now) */}
            {isFromQuote && customOrderQuote && (
              <div className="bg-gradient-to-br from-lime-50 to-green-50 rounded-2xl shadow-sm border border-lime-300 p-8 hover:shadow-md transition-shadow duration-300">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-lime-100 rounded-lg p-3">
                    <FileText className="h-5 w-5 text-lime-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Custom Order Quote</h2>
                    <p className="text-sm text-gray-600 mt-1">{customOrderQuote.orderNumber}</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  {/* Unit Price */}
                  <div className="flex justify-between items-center p-4 bg-white/60 rounded-xl border border-lime-200">
                    <div>
                      <p className="text-sm font-semibold text-gray-600">Unit Price</p>
                      <p className="text-xs text-gray-500 mt-1">Per item quoted by admin</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg text-gray-900">₦{customOrderQuote.quotedPrice?.toLocaleString() || '0'}</p>
                      <p className="text-xs text-gray-600">× {customOrderQuote.quantity || 1}</p>
                    </div>
                  </div>

                  {/* Discount (if applicable) */}
                  {customOrderQuote.discountPercentage > 0 && (
                    <div className="flex justify-between items-center p-4 bg-green-50 rounded-xl border border-green-200">
                      <div>
                        <p className="text-sm font-semibold text-green-700">Discount ({customOrderQuote.discountPercentage}%)</p>
                        <p className="text-xs text-green-600 mt-1">Special offer from admin</p>
                      </div>
                      <p className="font-bold text-lg text-green-700">-₦{customOrderQuote.discountAmount?.toLocaleString() || '0'}</p>
                    </div>
                  )}

                  {/* VAT */}
                  <div className="flex justify-between items-center p-4 bg-blue-50 rounded-xl border border-blue-200">
                    <div>
                      <p className="text-sm font-semibold text-blue-700">VAT (7.5%)</p>
                      <p className="text-xs text-blue-600 mt-1">Tax on quoted amount</p>
                    </div>
                    <p className="font-bold text-lg text-blue-700">₦{customOrderQuote.quotedVAT?.toLocaleString() || '0'}</p>
                  </div>

                  {/* Total Amount */}
                  <div className="pt-4 bg-gradient-to-br from-lime-100 to-green-100 rounded-xl p-4 border border-lime-400">
                    <p className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Total Amount to Pay</p>
                    <p className="font-black text-4xl bg-gradient-to-r from-lime-600 to-green-600 bg-clip-text text-transparent">
                      ₦{customOrderQuote.quotedTotal?.toLocaleString() || '0'}
                    </p>
                  </div>
                </div>
              </div>
            )}

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
            {createdOrderId && !isProcessing && (
              <div className="flex gap-3 pt-4">
                <Link
                  href="/cart"
                  className="flex-1 inline-block text-center bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold px-6 py-4 rounded-xl transition duration-200 flex items-center justify-center gap-2"
                >
                  ← Back to Cart
                </Link>
                <button
                  onClick={handleProceedToPayment}
                  className="flex-1 bg-gradient-to-r from-lime-600 to-green-600 hover:from-lime-700 hover:to-green-700 text-white font-semibold px-6 py-4 rounded-xl transition duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                >
                  💳 Proceed to Payment <ArrowRight className="h-5 w-5" />
                </button>
              </div>
            )}

            {isProcessing && (
              <div className="flex gap-3 pt-4">
                <div className="flex-1 bg-gray-100 text-gray-600 font-semibold px-6 py-4 rounded-xl flex items-center justify-center gap-2">
                  <div className="animate-spin h-5 w-5 border-2 border-lime-600 border-t-transparent rounded-full"></div>
                  Processing...
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              {/* Order Summary Sidebar */}
              <div className={`${isFromQuote ? 'bg-gradient-to-br from-lime-50 to-green-50 border-lime-300' : 'bg-white border-gray-100'} rounded-2xl shadow-sm border p-6 hover:shadow-md transition-shadow duration-300`}>
                <h3 className="font-bold text-gray-900 mb-6 text-lg">{isFromQuote ? 'Quote Summary' : 'Order Summary'}</h3>
                
                <div className="space-y-4">
                  {isFromQuote && customOrderQuote ? (
                    <>
                      {/* Quote Summary */}
                      <div className="pb-4 border-b border-lime-200">
                        <p className="text-xs font-semibold text-gray-600 mb-3 uppercase tracking-wide">Quote Details</p>
                        <div className="bg-white rounded-lg p-4 space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-700">Order Number:</span>
                            <span className="font-semibold text-gray-900">{customOrderQuote.orderNumber}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-700">Quantity:</span>
                            <span className="font-semibold text-gray-900">{customOrderQuote.quantity || 1}</span>
                          </div>
                        </div>
                      </div>

                      {/* Pricing Breakdown for Quote */}
                      <div className="pb-4 border-b border-lime-200">
                        <p className="text-xs font-semibold text-gray-600 mb-3 uppercase tracking-wide">Pricing Breakdown</p>
                        
                        {/* Unit Price */}
                        <div className="flex justify-between items-center mb-2">
                          <p className="text-sm text-gray-600">Unit Price</p>
                          <p className="font-bold text-gray-900">₦{customOrderQuote.quotedPrice?.toLocaleString() || '0'}</p>
                        </div>

                        {/* Discount */}
                        {customOrderQuote.discountPercentage > 0 && (
                          <div className="bg-green-50 p-3 rounded-lg mb-3 space-y-2">
                            <div className="flex justify-between items-center">
                              <p className="text-xs font-semibold text-green-700">Discount ({customOrderQuote.discountPercentage}%)</p>
                              <p className="font-bold text-green-700">-₦{customOrderQuote.discountAmount?.toLocaleString() || '0'}</p>
                            </div>
                          </div>
                        )}

                        {/* VAT */}
                        <div className="flex justify-between items-center">
                          <p className="text-sm text-gray-600">VAT (7.5%)</p>
                          <p className="font-bold text-gray-900">₦{customOrderQuote.quotedVAT?.toLocaleString() || '0'}</p>
                        </div>
                      </div>

                      {/* Total for Quote */}
                      <div className="pt-4 bg-gradient-to-br from-lime-100 to-green-100 rounded-xl p-4 border border-lime-400">
                        <p className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Total Amount</p>
                        <p className="font-black text-3xl bg-gradient-to-r from-lime-600 to-green-600 bg-clip-text text-transparent">
                          ₦{customOrderQuote.quotedTotal?.toLocaleString() || '0'}
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
                    </>
                  ) : (
                    <>
                      {/* Item Breakdown */}
                      <div className="pb-4 border-b border-gray-200">
                        <p className="text-xs font-semibold text-gray-600 mb-3 uppercase tracking-wide">Items Breakdown</p>
                        <div className="space-y-3">
                          {(orderSummary?.items || items).map((item: any) => (
                            <div key={`${item.id}-${item.mode}`} className="text-sm bg-gray-50 p-3 rounded-lg">
                              <div className="flex justify-between mb-1">
                                <span className="text-gray-700 font-medium">{item.name}</span>
                                <span className="font-semibold text-gray-900">
                                  {item.mode === 'rent' 
                                    ? `₦${(item.price * item.quantity * (orderSummary?.rentalSchedule?.rentalDays || rentalSchedule?.rentalDays || 1)).toLocaleString()}`
                                    : `₦${(item.price * item.quantity).toLocaleString()}`
                                  }
                                </span>
                              </div>
                              {item.mode === 'rent' ? (
                                <div className="text-xs text-gray-600 mt-2 space-y-1">
                                  <div>Qty: {item.quantity} × Price: ₦{item.price.toLocaleString()} × Days: {orderSummary?.rentalSchedule?.rentalDays || rentalSchedule?.rentalDays || 1}</div>
                                  <div className="text-purple-700 font-semibold">= ₦{(item.price * item.quantity * (orderSummary?.rentalSchedule?.rentalDays || rentalSchedule?.rentalDays || 1)).toLocaleString()}</div>
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
                        <div className="flex justify-between items-center mb-2">
                          <p className="text-sm text-gray-600">Subtotal</p>
                          <p className="font-bold text-gray-900">₦{buySubtotal.toLocaleString()}</p>
                        </div>
                        
                        {/* Bulk Discount (if applicable) */}
                        {discountPercentage > 0 && (
                          <div className="mt-3 pt-3 border-t border-green-200 bg-green-50 p-3 rounded-lg space-y-2">
                            <div className="flex justify-between items-center">
                              <p className="text-xs font-semibold text-green-700">🎉 Bulk Discount ({discountPercentage}%)</p>
                              <p className="font-bold text-green-700">-₦{discountAmount.toLocaleString()}</p>
                            </div>
                            <p className="text-xs text-green-600">Applied on {totalBuyQuantity} buy items</p>
                            
                            {/* Subtotal after discount */}
                            <div className="border-t border-green-300 pt-2 flex justify-between items-center">
                              <p className="text-xs font-semibold text-green-800">After Discount</p>
                              <p className="font-bold text-green-800">₦{buySubtotalAfterDiscount.toLocaleString()}</p>
                            </div>
                          </div>
                        )}
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
                      <div className="pt-4 bg-gradient-to-br from-lime-100 to-green-100 rounded-xl p-4">
                        <p className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Total Amount</p>
                        <p className="font-black text-3xl bg-gradient-to-r from-lime-600 to-green-600 bg-clip-text text-transparent">
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
                    </>
                  )}
                </div>
              </div>

              {/* Security Badge */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border border-green-200 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Lock className="h-4 w-4 text-green-600" />
                  <p className="text-xs font-bold text-green-900 uppercase tracking-wide">Secure Payment</p>
                </div>
                <p className="text-xs text-green-800">Your payment is processed securely through Paystack.</p>
              </div>
            </div>
          </div>
        </div>
      </main>

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

      {/* Delivery Method Modal - Shows after payment verification */}
      <DeliveryMethodModal
        isOpen={deliveryMethodModalOpen}
        orderId={createdOrderId || ''}
        orderReference={paymentReference || ''}
        onClose={() => {
          setDeliveryMethodModalOpen(false);
        }}
        total={totalAmount}
        buyerEmail={buyer?.email}
        buyerPhone={buyer?.phone}
        buyerName={buyer?.fullName}
        onDeliveryConfirmed={() => {
          // After delivery method is confirmed, close the delivery modal and show success modal
          setDeliveryMethodModalOpen(false);
          setPaymentSuccessModalOpen(true);
        }}
      />

      {/* Payment Success Modal - Shows after delivery form is submitted */}
      <PaymentSuccessModal
        isOpen={paymentSuccessModalOpen}
        orderReference={paymentReference || ''}
        total={totalAmount}
        onClose={() => {
          setPaymentSuccessModalOpen(false);
          // Navigate to orders dashboard after closing success modal
          router.push("/dashboard?tab=orders");
        }}
      />

      {/* Verifying Payment - Show loading state */}
      {verifyingPayment && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999]">
          <div className="bg-white rounded-2xl p-8 text-center max-w-sm">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-lime-200 border-t-lime-600 mx-auto mb-4"></div>
            <p className="text-gray-900 font-semibold">Verifying your payment...</p>
            <p className="text-sm text-gray-600 mt-2">Please wait while we confirm your transaction with Paystack</p>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
