"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { useCart } from "../components/CartContext";
import { useBuyer } from "../context/BuyerContext";
import { ShoppingBag, AlertCircle, CreditCard, Upload, Camera, CheckCircle2, Landmark } from "lucide-react";
import { getDiscountPercentage, VAT_RATE } from "@/lib/discountCalculator";
import { validateCheckoutItemsModes } from "@/lib/utils/orderDiagnostics";


const SHIPPING_OPTIONS = {
  empi: { id: "empi", name: "EMPI Delivery", cost: 2500, estimatedDays: "2-5 business days" },
  self: { id: "self", name: "Self Pickup", cost: 0, estimatedDays: "Ready within 24 hours" },
};

export default function CheckoutPage() {
  const { items, clearCart, total, cautionFee, rentalSchedule } = useCart();
  const { buyer } = useBuyer();
  const router = useRouter();

  // CRITICAL: Log items from cart to see if they have mode
  if (items && items.length > 0) {
    console.log('[Checkout] 🛒 ITEMS FROM CART (START):');
    items.forEach((item: any, idx: number) => {
      console.log(`  [${idx + 1}] "${item.name}"`, {
        id: item.id,
        mode: item.mode || '❌ UNDEFINED',
        hasMode: !!item.mode,
        price: item.price,
        qty: item.quantity,
      });
    });
  }

  const [isHydrated, setIsHydrated] = useState(false);
  const shippingOption = "empi"; // Fixed to EMPI Delivery only
  const [successReference, setSuccessReference] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [customQuote, setCustomQuote] = useState<any>(null);
  const [paymentSuccessful, setPaymentSuccessful] = useState(false);
  // CRITICAL: Prevent duplicate order creation from multiple payment callbacks
  const [paymentProcessed, setPaymentProcessed] = useState(false);
  const [guestCustomer, setGuestCustomer] = useState({
    fullName: '',
    email: '',
    phone: '',
    city: '',
    address: '',
    state: '',
  });

  // Payment Method States
  const [paymentMethod, setPaymentMethod] = useState<'paystack' | 'manual'>('paystack');
  const [bankDetails, setBankDetails] = useState<any>(null);
  const [paymentProofUrl, setPaymentProofUrl] = useState<string>('');
  const [isUploadingProof, setIsUploadingProof] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [paymentVisibility, setPaymentVisibility] = useState({ manual: true, paystack: true });

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

        // Load customer info from the custom order if not logged in as a buyer
        if (quote.orderId && !buyer?.id) {
          console.log('[Checkout] Loading customer info from custom order:', quote.orderId);
          // Use unified endpoint
          fetch(`/api/orders/unified/${quote.orderId}`)
            .then(res => res.json())
            .then(customOrder => {
              if (customOrder && customOrder.firstName) {
                const fullName = `${customOrder.firstName} ${customOrder.lastName || ''}`.trim();
                setGuestCustomer({
                  fullName: fullName || '',
                  email: (customOrder.email || '').toLowerCase(),
                  phone: customOrder.phone || '',
                  city: customOrder.city || '',
                  address: customOrder.address || '',
                  state: customOrder.state || '',
                });

                // 🎁 ALSO LOAD DISCOUNT FROM DATABASE if it was persisted
                if (customOrder.discountPercentage !== undefined || customOrder.discountAmount !== undefined) {
                  console.log('[Checkout] 🎁 Loaded discount from database:', {
                    discountPercentage: customOrder.discountPercentage,
                    discountAmount: customOrder.discountAmount,
                  });

                  // Update the quote with database discount values
                  setCustomQuote((prev: any) => ({
                    ...prev,
                    discountPercentage: customOrder.discountPercentage || 0,
                    discountAmount: customOrder.discountAmount || 0,
                  }));
                }

                console.log('[Checkout] ✅ Loaded guest customer from unified order:', {
                  fullName: fullName,
                  email: customOrder.email,
                  phone: customOrder.phone,
                });
              }
            })
            .catch(err => console.error('[Checkout] Error loading custom order:', err));
        }
      } catch (err) {
        console.error('[Checkout] Error parsing quote:', err);
      }
    }

    // Fetch bank details and payment visibility settings
    fetch('/api/bank-details')
      .then(res => res.json())
      .then(data => {
        if (data.bank) {
          setBankDetails(data.bank);
        }
        if (data.paymentMethods) {
          setPaymentVisibility(data.paymentMethods);

          // Adjust default payment method if paystack is hidden
          if (data.paymentMethods.paystack === false && data.paymentMethods.manual === true) {
            setPaymentMethod('manual');
          }
        }
      })
      .catch(err => console.error('Error fetching bank details:', err));
  }, [buyer?.id]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setOrderError("Please upload an image file (JPG, PNG, etc.)");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setOrderError("Image size too large. Please use an image smaller than 5MB.");
      return;
    }

    setIsUploadingProof(true);
    setUploadProgress(10);
    setOrderError(null);

    try {
      // Convert to base64
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const base64Data = reader.result as string;
        setUploadProgress(30);

        try {
          const res = await fetch('/api/cloudinary/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              imageData: base64Data,
              fileName: `proof-of-payment-${Date.now()}.jpg`
            }),
          });

          setUploadProgress(80);
          const data = await res.json();

          if (res.ok && data.url) {
            setPaymentProofUrl(data.url);
            setUploadProgress(100);
            console.log("✅ Proof of payment uploaded:", data.url);
          } else {
            setOrderError(data.error || "Failed to upload proof of payment");
          }
        } catch (err) {
          setOrderError("Error uploading proof of payment to server");
        } finally {
          setIsUploadingProof(false);
        }
      };
    } catch (err) {
      setOrderError("Error reading file");
      setIsUploadingProof(false);
    }
  };

  // Handle payment success - save order (invoice auto-generated via API)
  const handlePaymentSuccess = async (response: any) => {
    console.log("✅ Payment success handler called");
    console.log("Reference:", response?.reference);

    // CRITICAL: Prevent duplicate order creation
    if (paymentProcessed) {
      console.log("⚠️ Payment already processed, ignoring duplicate call");
      return;
    }

    setPaymentProcessed(true);

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
      // Shipping removed from checkout totals and order payloads
      const shippingCost = 0;
      // For regular cart orders, `total` is goods/services subtotal (buy + rental days)
      // Tax should be charged on goods/services only (NOT on caution fee)
      if (customQuote) {
        const subtotal = customQuote.quotedPrice || 0;
        const taxAmount = customQuote.quotedVAT || 0;
        const totalAmount = customQuote.quotedTotal || (subtotal + taxAmount + shippingCost);

        // For custom orders, update via unified endpoint
        // Status should REMAIN 'pending' - admin must explicitly approve
        try {
          const updateRes = await fetch(`/api/orders/unified/${customQuote.orderId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              status: 'pending', // Custom orders stay pending until admin approves
              paymentReference: response.reference,
              paymentVerified: true,
            }),
          });

          if (updateRes.ok) {
            const updateData = await updateRes.json();
            console.log("✅ Custom order payment verified, status remains 'pending':", updateData);
          } else {
            const errorData = await updateRes.json();
            console.error("❌ Failed to update custom order status:", errorData);
          }
        } catch (err) {
          console.error("Error updating custom order status:", err);
        }

        // Call verify-payment to trigger invoice generation for custom orders
        console.log("📧 Triggering invoice generation for custom order...");
        try {
          const params = new URLSearchParams();
          params.append('reference', response.reference);
          params.append('email', customerInfo.email.toLowerCase());
          params.append('name', customerInfo.fullName);
          const verifyRes = await fetch(`/api/verify-payment?${params.toString()}`);
          const verifyData = await verifyRes.json();

          if (verifyData.success) {
            console.log("✅ Invoice generated for custom order:", verifyData.invoiceNumber || 'N/A');
          } else {
            console.warn("⚠️ Invoice generation returned non-success:", verifyData);
          }
        } catch (err) {
          console.error("❌ Error calling verify-payment for invoice:", err);
        }

        // Don't need to create a separate order, but we can still log payment success
        console.log("🎉 Payment successful for custom order!");
        setPaymentSuccessful(true);
        setSuccessReference(response.reference);

        // Clear custom quote from sessionStorage
        sessionStorage.removeItem('customOrderQuote');
        return;
      } else {
        console.log("[Checkout] Full items array from cart:", JSON.stringify(items, null, 2));
        const buyItems = items.filter((item: any) => item.mode === 'buy');
        const rentalItems = items.filter((item: any) => item.mode === 'rent');

        // Buy subtotal (before discount)
        const buySubtotal = buyItems.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);

        // Rental subtotal (with rental days)
        const rentalSubtotal = rentalItems.reduce((sum: number, item: any) => {
          const days = rentalSchedule?.rentalDays || item.rentalDays || 1;
          return sum + (item.price * item.quantity * days);
        }, 0);

        // Apply discount ONLY to buy items
        const buyQuantity = buyItems.reduce((sum: number, item: any) => sum + item.quantity, 0);
        const discountPercent = getDiscountPercentage(buyQuantity);
        const discountAmt = buySubtotal * (discountPercent / 100);
        const buySubtotalAfterDiscount = buySubtotal - discountAmt;

        // Total goods = buy after discount + rental (no discount)
        const goodsSubtotal = buySubtotalAfterDiscount + rentalSubtotal;
        const taxAmount = Number((goodsSubtotal * VAT_RATE).toFixed(2));
        const totalAmount = goodsSubtotal + (cautionFee || 0) + shippingCost + taxAmount;

        // Log the subtotal breakdown for debugging
        console.log('[Checkout] 💰 PRICING BREAKDOWN:', {
          buySubtotal,
          rentalSubtotal,
          goodsSubtotal,
          discountAmount: discountAmt,
          taxAmount,
          cautionFee: cautionFee || 0,
          totalAmount
        });

        // Attach rentalDays to each item for persistence/visibility in admin UI
        const itemsWithRentalDays = items.map((it: any) => {
          const mappedItem = {
            ...it,
            id: it.id,
            name: it.name,
            price: it.price,
            quantity: it.quantity,
            image: it.image || '', // Explicitly include image from cart
            mode: it.mode,
            unitPrice: it.price,
            rentalDays: it.rentalDays || rentalSchedule?.rentalDays || 1,
          };
          // CRITICAL LOGGING: Verify mode is set before sending to API
          console.log(`[Checkout] 📦 Item "${it.name}":`, {
            mode: mappedItem.mode,
            hasMode: !!mappedItem.mode,
            originalMode: it.mode,
            qty: it.quantity,
            price: it.price
          });
          return mappedItem;
        });

        // LOG THE ENTIRE ORDER DATA BEFORE SENDING
        console.log('[Checkout] 🚀 ABOUT TO SEND ORDER TO API:', {
          itemCount: itemsWithRentalDays.length,
          items: itemsWithRentalDays.map((i: any) => ({
            name: i.name,
            mode: i.mode,
            qty: i.quantity
          })),
          total: totalAmount
        });

        // VALIDATE item modes before sending
        const modeValidation = validateCheckoutItemsModes(itemsWithRentalDays);
        if (modeValidation.itemsWithoutMode > 0) {
          console.error('[Checkout] ❌ CRITICAL: Items missing mode field!');
          console.error('[Checkout] This will cause issues in production!');
        }

        // Parse full name into firstName and lastName for unified schema
        const nameParts = (customerInfo.fullName || '').trim().split(/\s+/);
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        orderData = {
          reference: response.reference,
          email: customerInfo.email.toLowerCase(),
          firstName: firstName,
          lastName: lastName,
          phone: customerInfo.phone,
          buyerId: buyer?.id || null,
          city: customerInfo.city || '',
          address: customerInfo.address || '',
          state: customerInfo.state || '',
          orderType: 'regular',
          items: itemsWithRentalDays,
          rentalSchedule: rentalSchedule || null,
          shippingType: shippingOption || 'standard',
          status: paymentMethod === 'manual' ? 'pending' : 'pending', // Both pending, but manual stays longer
          paymentMethod: paymentMethod, // Store payment method
          paymentProofUrl: paymentProofUrl || null, // Store proof URL
          shippingCost: 0,
          subtotal: goodsSubtotal,  // ← CRITICAL FIX: Use goodsSubtotal (buy + rental), not just buySubtotal
          // CRITICAL: Add top-level discount and VAT fields (not just in pricing object)
          discountPercentage: discountPercent,
          discountAmount: discountAmt,
          subtotalAfterDiscount: buySubtotalAfterDiscount,
          vat: taxAmount,
          cautionFee: (cautionFee || 0),  // CRITICAL: Save caution fee to top-level field
          total: totalAmount,
          pricing: {
            subtotal: goodsSubtotal,  // ← Use goodsSubtotal here too
            buySubtotal: buySubtotal,
            rentalSubtotal: rentalSubtotal,
            goodsSubtotal: goodsSubtotal,
            cautionFee: (cautionFee || 0),
            tax: taxAmount,
            shipping: 0,
            total: totalAmount,
            discount: discountAmt,
            discountPercentage: discountPercent,
            subtotalAfterDiscount: buySubtotalAfterDiscount,
          },
          createdAt: new Date().toISOString(),
          paymentVerified: paymentMethod === 'paystack', // Manual payments are not verified yet
        };
      }

      console.log("💾 Saving order to unified endpoint...");
      console.log("Order data:", JSON.stringify(orderData, null, 2));

      // Add idempotency key to prevent duplicate order creation
      const idempotencyKey = response?.reference || `checkout-${Date.now()}`;

      // Use unified endpoint for creating regular orders
      const res = await fetch("/api/orders/unified", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Idempotency-Key": idempotencyKey,
        },
        body: JSON.stringify(orderData),
      });

      if (res.ok) {
        const orderRes = await res.json();
        console.log("✅ Order saved to unified system");
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
        // Stop polling if payment already processed
        if (paymentProcessed) {
          clearInterval(pollInterval);
          return;
        }

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
      // Skip if payment already processed
      if (paymentProcessed) {
        console.log("⚠️ Payment already processed, skipping verification");
        return;
      }

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
  let shippingCost, taxEstimate, totalAmount, displayItems, displayTotal, displaySubtotal, discountAmount = 0, discountPercentage = 0, displaySubtotalAfterDiscount = 0;

  if (customQuote) {
    // Custom order totals - ensure all values are numbers
    const quotedPrice = typeof customQuote.quotedPrice === 'number' ? customQuote.quotedPrice : parseFloat(customQuote.quotedPrice) || 0;
    const quotedVAT = typeof customQuote.quotedVAT === 'number' ? customQuote.quotedVAT : parseFloat(customQuote.quotedVAT) || 0;
    const quotedTotal = typeof customQuote.quotedTotal === 'number' ? customQuote.quotedTotal : parseFloat(customQuote.quotedTotal) || 0;

    // 🎁 Extract discount information from custom quote
    discountPercentage = customQuote.discountPercentage || 0;
    discountAmount = customQuote.discountAmount || 0;

    shippingCost = 0;
    taxEstimate = quotedVAT;
    totalAmount = quotedTotal || (quotedPrice + quotedVAT);

    // Build display items from quote items if available
    if (customQuote.items && Array.isArray(customQuote.items) && customQuote.items.length > 0) {
      displayItems = customQuote.items.map((item: any) => ({
        name: item.itemName || 'Custom Item',
        quantity: item.quantity || 1,
        price: item.unitPrice || 0,
        total: (item.quantity || 1) * (item.unitPrice || 0)
      }));
    } else {
      displayItems = [{
        name: `Custom Order`,
        quantity: customQuote.quantity || 1,
        price: quotedPrice,
        total: quotedPrice * (customQuote.quantity || 1)
      }];
    }

    displaySubtotal = quotedPrice;
    displayTotal = totalAmount;

    console.log('[Checkout] Calculated custom quote totals:', {
      quotedPrice,
      quotedVAT,
      quotedTotal,
      discountPercentage,
      discountAmount,
      displayItems,
      displaySubtotal,
      displayTotal,
    });
  } else {
    // Cart totals - with discount calculation ONLY on buy items
    shippingCost = 0;

    // Separate buy and rental items
    const buyItems = items.filter(item => item.mode === 'buy');
    const rentalItems = items.filter(item => item.mode === 'rent');

    // Calculate buy subtotal
    const buySubtotal = buyItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Calculate rental total (with rental days)
    const rentalSubtotal = rentalItems.reduce((sum, item) => {
      const days = rentalSchedule?.rentalDays || item.rentalDays || 1;
      return sum + (item.price * item.quantity * days);
    }, 0);

    // Apply discount ONLY to buy items, NOT rentals
    const buyQuantity = buyItems.reduce((sum, item) => sum + item.quantity, 0);
    discountPercentage = getDiscountPercentage(buyQuantity);
    discountAmount = buySubtotal * (discountPercentage / 100);
    const buySubtotalAfterDiscount = buySubtotal - discountAmount;

    // Total goods/services = buy after discount + rental (no discount)
    const goodsSubtotal = buySubtotalAfterDiscount + rentalSubtotal;

    // Tax calculated on goods only (not caution fee)
    taxEstimate = goodsSubtotal * VAT_RATE;

    // Include caution fee in displayed subtotal and in final total
    displaySubtotal = buySubtotal + rentalSubtotal + (cautionFee || 0);
    displaySubtotalAfterDiscount = goodsSubtotal + (cautionFee || 0);
    totalAmount = displaySubtotalAfterDiscount + shippingCost + taxEstimate;
    displayItems = items;
    displayTotal = totalAmount;

    console.log('[Checkout] Calculated cart totals with discount on buy only:', {
      buySubtotal,
      buyQuantity,
      discountPercentage,
      discountAmount,
      buySubtotalAfterDiscount,
      rentalSubtotal,
      goodsSubtotal,
      taxEstimate,
      cautionFee,
      displaySubtotal,
      displaySubtotalAfterDiscount,
      displayTotal,
    });
  }

  // ===== CHECKOUT FORM =====
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 max-w-4xl mx-auto px-4 py-12 w-full pt-20 sm:pt-24 md:pt-20">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Payment Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-8">
              <div className="flex items-center gap-3 mb-6">
                <CreditCard className="h-6 w-6 text-purple-600" />
                <h1 className="text-3xl font-bold text-gray-900">Order Summary</h1>
              </div>

              {/* Order Summary */}
              <div className="bg-gray-50 rounded-lg p-6 mb-8">
                <h2 className="font-bold text-gray-900 mb-4">Items in {customQuote ? 'Order' : 'Cart'}</h2>
                <div className="space-y-3">
                  {displayItems.map((item: any, idx: number) => {
                    // Determine if this is a rental or purchase item
                    const isRental = item.mode === 'rent';
                    const itemMode = item.mode ? (isRental ? 'RENTAL' : 'BUY') : '';
                    const modeColor = isRental ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700';
                    const modeEmoji = isRental ? '🔄' : '🛍️';

                    return (
                      <div key={idx} className="flex justify-between items-center gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-gray-900">{item.name}</span>
                            {itemMode && (
                              <span className={`text-xs px-2 py-0.5 rounded font-bold ${modeColor} whitespace-nowrap`}>
                                {modeEmoji} {itemMode}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-600 ml-0">
                            Qty: {item.quantity || 1}
                            {isRental && rentalSchedule?.rentalDays && (
                              <span> • {rentalSchedule.rentalDays} days rental</span>
                            )}
                          </div>
                        </div>
                        <span className="font-semibold whitespace-nowrap text-gray-900">₦{((item.total || item.price * (item.quantity || 1)) || 0).toLocaleString()}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Pricing */}
              <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8 space-y-3">
                <div className="flex justify-between text-sm text-gray-800">
                  <span>Subtotal</span>
                  <span className="font-medium">₦{displaySubtotal.toLocaleString()}</span>
                </div>
                {/* Discount (if applicable for cart orders) */}
                {!customQuote && discountPercentage > 0 && (
                  <div className="flex justify-between text-sm text-green-600 bg-green-50 px-3 py-2 rounded">
                    <span>🎁 Discount ({discountPercentage}%)</span>
                    <span>-₦{Math.round(discountAmount).toLocaleString()}</span>
                  </div>
                )}
                {/* Discount for custom orders */}
                {customQuote && customQuote.discountPercentage > 0 && (
                  <div className="flex justify-between text-sm text-green-600 bg-green-50 px-3 py-2 rounded">
                    <span>🎁 Bulk Discount ({customQuote.discountPercentage}%)</span>
                    <span>-₦{customQuote.discountAmount.toLocaleString()}</span>
                  </div>
                )}
                {/* Caution Fee (rentals) */}
                {cautionFee > 0 && (
                  <div className="flex justify-between text-sm text-amber-700">
                    <span>🔒 Caution Fee (50% of rentals)</span>
                    <span>₦{Math.round(cautionFee).toLocaleString()}</span>
                  </div>
                )}
                {/* Shipping is handled separately and intentionally hidden on checkout */}
                <div className="flex justify-between text-sm text-gray-800">
                  <span>Tax (7.5%)</span>
                  <span className="font-medium">₦{Math.round(taxEstimate).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-3 border-t-2 border-gray-200 text-gray-900">
                  <span>Total Amount</span>
                  <span className="text-purple-600">₦{displayTotal.toLocaleString()}</span>
                </div>
              </div>



            </div>

            {/* Payment Method Selector */}
            <div className="mb-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Choose Payment Method</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Paystack Option */}
                {paymentVisibility.paystack && (
                  <button
                    onClick={() => setPaymentMethod('paystack')}
                    className={`flex flex-col p-4 rounded-xl border-2 transition text-left relative overflow-hidden ${paymentMethod === 'paystack'
                      ? 'border-purple-600 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className={`p-2 rounded-lg ${paymentMethod === 'paystack' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
                        <CreditCard className="h-5 w-5" />
                      </div>
                      {paymentMethod === 'paystack' && (
                        <CheckCircle2 className="h-5 w-5 text-purple-600" />
                      )}
                    </div>
                    <p className="font-bold text-gray-900">Pay Online</p>
                    <p className="text-xs text-gray-600 mt-1">Instant confirmation via Paystack (Cards, Transfer, USSD)</p>
                  </button>
                )}

                {/* Manual Transfer Option */}
                {paymentVisibility.manual && (
                  <button
                    onClick={() => setPaymentMethod('manual')}
                    className={`flex flex-col p-4 rounded-xl border-2 transition text-left relative overflow-hidden ${paymentMethod === 'manual'
                      ? 'border-lime-600 bg-lime-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className={`p-2 rounded-lg ${paymentMethod === 'manual' ? 'bg-lime-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
                        <Landmark className="h-5 w-5" />
                      </div>
                      {paymentMethod === 'manual' && (
                        <CheckCircle2 className="h-5 w-5 text-lime-600" />
                      )}
                    </div>
                    <p className="font-bold text-gray-900">Bank Transfer</p>
                    <p className="text-xs text-gray-600 mt-1">Direct transfer to our bank account. Requires confirmation.</p>
                  </button>
                )}
              </div>
            </div>

            {/* Manual Payment Instructions */}
            {paymentMethod === 'manual' && (
              <div className="bg-lime-50 border border-lime-200 rounded-xl p-6 mb-8 animate-in fade-in slide-in-from-top-4 duration-300">
                <h3 className="text-lg font-bold text-lime-900 mb-4 flex items-center gap-2">
                  <Landmark className="h-5 w-5" />
                  How to Pay via Bank Transfer
                </h3>

                {bankDetails ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="bg-white p-3 rounded-lg border border-lime-100">
                        <p className="text-xs text-gray-500 uppercase font-semibold">Bank Name</p>
                        <p className="font-bold text-gray-900">{bankDetails.bankName}</p>
                      </div>
                      <div className="bg-white p-3 rounded-lg border border-lime-100">
                        <p className="text-xs text-gray-500 uppercase font-semibold">Account Number</p>
                        <p className="font-bold text-gray-900 text-lg tracking-wider">{bankDetails.accountNumber}</p>
                      </div>
                      <div className="bg-white p-3 rounded-lg border border-lime-100 sm:col-span-2">
                        <p className="text-xs text-gray-500 uppercase font-semibold">Account Name</p>
                        <p className="font-bold text-gray-900">{bankDetails.accountName}</p>
                      </div>
                    </div>


                    <div className="pt-4 border-t border-lime-200">
                      <p className="text-sm font-bold text-lime-900 mb-3">Step 2: Upload Proof of Payment</p>
                      <p className="text-xs text-lime-800 mb-4">Please upload a screenshot of your transfer confirmation or receipt.</p>

                      <div className="relative">
                        {!paymentProofUrl ? (
                          <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition ${isUploadingProof ? 'bg-gray-50 border-gray-300' : 'bg-white border-lime-300 hover:bg-lime-50 hover:border-lime-400'
                            }`}>
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                              {isUploadingProof ? (
                                <div className="flex flex-col items-center gap-2">
                                  <div className="w-10 h-10 border-4 border-lime-600 border-t-transparent rounded-full animate-spin"></div>
                                  <p className="text-xs font-semibold text-gray-600">Uploading {uploadProgress}%...</p>
                                </div>
                              ) : (
                                <>
                                  <Camera className="w-10 h-10 text-lime-600 mb-2" />
                                  <p className="text-sm text-gray-700 font-semibold">Click to upload receipt</p>
                                  <p className="text-xs text-gray-500 mt-1">JPG, PNG or PDF (max 5MB)</p>
                                </>
                              )}
                            </div>
                            <input type="file" className="hidden" onChange={handleFileUpload} disabled={isUploadingProof} accept="image/*" />
                          </label>
                        ) : (
                          <div className="relative rounded-xl overflow-hidden border-2 border-lime-500 shadow-md">
                            <img src={paymentProofUrl} alt="Payment Proof" className="w-full h-48 object-cover" />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition">
                              <button
                                onClick={() => setPaymentProofUrl('')}
                                className="bg-white text-red-600 px-4 py-2 rounded-lg font-bold flex items-center gap-2"
                              >
                                <Upload className="h-4 w-4" /> Change Receipt
                              </button>
                            </div>
                            <div className="absolute top-2 right-2 bg-green-500 text-white p-1.5 rounded-full shadow-lg">
                              <CheckCircle2 className="h-5 w-5" />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <div className="w-8 h-8 border-4 border-lime-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    <p className="text-sm text-lime-800">Loading bank details...</p>
                  </div>
                )}
              </div>
            )}

            {/* Customer Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-xs font-semibold text-blue-900 mb-3 uppercase">Billing Information</p>

              {buyer ? (
                <div className="text-sm text-blue-800 space-y-1">
                  <p><span className="font-semibold">Name:</span> {buyer.fullName}</p>
                  <p><span className="font-semibold">Email:</span> {buyer.email}</p>
                  <p><span className="font-semibold">Phone:</span> {buyer.phone}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={guestCustomer.fullName}
                    onChange={(e) => setGuestCustomer({ ...guestCustomer, fullName: e.target.value })}
                    className="w-full px-3 py-2 border border-blue-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 text-gray-900"
                  />
                  <input
                    type="email"
                    placeholder="Email Address"
                    value={guestCustomer.email}
                    onChange={(e) => setGuestCustomer({ ...guestCustomer, email: e.target.value })}
                    className="w-full px-3 py-2 border border-blue-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 text-gray-900"
                  />
                  <input
                    type="tel"
                    placeholder="Phone Number (11 digits)"
                    maxLength={11}
                    value={guestCustomer.phone}
                    onChange={(e) => setGuestCustomer({ ...guestCustomer, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-blue-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 text-gray-900"
                  />
                </div>
              )}
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
                  console.log("Pay button clicked. Method:", paymentMethod);

                  // Use buyer info if logged in, otherwise use guest customer info
                  const customerInfo = buyer || guestCustomer;

                  if (!customerInfo?.fullName || !customerInfo?.email || !customerInfo?.phone) {
                    setOrderError("Please provide your full name, email, and phone number");
                    return;
                  }

                  // Validate email format
                  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                  if (!emailRegex.test(customerInfo.email)) {
                    setOrderError("Please provide a valid email address");
                    return;
                  }

                  // Manual Payment Flow
                  if (paymentMethod === 'manual') {
                    if (!paymentProofUrl) {
                      setOrderError("Please upload a proof of payment receipt before proceeding.");
                      // Scroll to upload area
                      document.querySelector('.relative')?.scrollIntoView({ behavior: 'smooth' });
                      return;
                    }

                    setIsProcessing(true);
                    setOrderError(null);

                    try {
                      const ref = `MAN-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
                      console.log("📝 Processing Manual Payment:", { ref, amount: displayTotal, email: customerInfo.email });

                      // Call handlePaymentSuccess directly with manual reference
                      await handlePaymentSuccess({ reference: ref, manual: true });
                    } catch (err) {
                      console.error("Manual payment error:", err);
                      setOrderError("Failed to process request. Please try again.");
                      setIsProcessing(false);
                    }
                    return;
                  }

                  // Paystack Logic (Original logic continues below)
                  if (!process.env.NEXT_PUBLIC_PAYSTACK_KEY) {
                    setOrderError("Online payment service is currently undergoing maintenance. Please use Bank Transfer.");
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
      </main>

      <Footer />
    </div>
  );
}

