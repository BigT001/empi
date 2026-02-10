'use client';

import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle, MessageCircle, AlertCircle, Zap, ChevronDown, Trash2, Hourglass } from 'lucide-react';
import { checkPaymentStatus } from '@/lib/utils/paymentUtils';

interface UserCustomOrderCardProps {
  orderId: string;
  orderNumber: string;
  description: string;
  quantity: number;
  status: 'pending' | 'paid' | 'approved' | 'in-progress' | 'ready' | 'completed' | 'rejected';
  quotedPrice?: number;
  quoteItems?: Array<{ itemName: string; quantity: number; unitPrice: number }>;
  email: string;
  phone: string;
  designUrls?: string[];
  paymentProofUrl?: string;
  paymentVerified?: boolean;
  // CRITICAL: Add discount fields from admin calculation
  subtotal?: number;
  discountPercentage?: number;
  discountAmount?: number;
  subtotalAfterDiscount?: number;
  vat?: number;
  total?: number;
  onChat?: () => void;
  onProceedToPayment?: (orderId: string, price: number, items: Array<{ itemName: string; quantity: number; unitPrice: number }>) => void;
  pollingIntervalMs?: number; // For testing, default 30s in production
}

export function UserCustomOrderCard({
  orderId,
  orderNumber,
  description,
  quantity,
  status,
  quotedPrice,
  quoteItems = [],
  email,
  phone,
  designUrls = [],
  paymentProofUrl,
  paymentVerified = false,
  subtotal,
  discountPercentage,
  discountAmount,
  subtotalAfterDiscount,
  vat: vatFromAdmin,
  total: totalFromAdmin,
  onChat,
  onProceedToPayment,
  pollingIntervalMs = 10000,
}: UserCustomOrderCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [currentQuote, setCurrentQuote] = useState<number | undefined>(quotedPrice);
  const [currentQuoteItems, setCurrentQuoteItems] = useState<Array<{ itemName: string; quantity: number; unitPrice: number }>>(quoteItems);
  const [currentDesignUrls, setCurrentDesignUrls] = useState<string[]>(designUrls);
  const [isPolling, setIsPolling] = useState(!quotedPrice);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [paymentData, setPaymentData] = useState({ paymentProofUrl, paymentVerified });

  // Log initial data
  console.log('[UserCustomOrderCard] Initialized with:', {
    orderNumber,
    orderId,
    quantity,
    designUrlsCount: designUrls.length,
    quotedPriceFromProps: quotedPrice,
    quoteItemsFromProps: quoteItems?.length || 0,
    // CRITICAL: Log admin-calculated pricing fields
    pricingFromAdmin: {
      subtotal,
      discountPercentage,
      discountAmount,
      subtotalAfterDiscount,
      vat: vatFromAdmin,
      total: totalFromAdmin,
    },
    description: description ? '✅' : '❌',
    email,
    phone,
    paymentProofUrl: paymentProofUrl ? '✅' : '❌',
    paymentVerified,
  });

  // Calculate totals from quote items OR use admin's calculated values
  const calculateTotals = () => {
    // CRITICAL FIX: If admin sent pricing, use it directly (trust admin's calculation)
    if (subtotal !== undefined && totalFromAdmin !== undefined) {
      console.log('[UserCustomOrderCard] 💎 USING ADMIN PRICING:', {
        subtotal,
        discountPercentage,
        discountAmount,
        subtotalAfterDiscount,
        vat: vatFromAdmin,
        total: totalFromAdmin,
      });
      return {
        subtotal: subtotal || 0,
        discount: discountAmount || 0,
        discountPercentage: discountPercentage || 0,
        subtotalAfterDiscount: subtotalAfterDiscount || 0,
        vat: vatFromAdmin || 0,
        total: totalFromAdmin || 0,
      };
    }

    // Fallback: recalculate from quote items if no admin pricing
    if (currentQuoteItems.length > 0) {
      const subtotalCalc = currentQuoteItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
      const vatCalc = subtotalCalc * VAT_RATE;
      const totalCalc = subtotalCalc + vatCalc;
      return { subtotal: subtotalCalc, vat: vatCalc, total: totalCalc, discount: 0, discountPercentage: 0, subtotalAfterDiscount: subtotalCalc };
    }
    return { subtotal: 0, vat: 0, total: currentQuote || 0, discount: 0, discountPercentage: 0, subtotalAfterDiscount: 0 };
  };

  const totals = calculateTotals();
  const VAT_RATE = 0.075; // 7.5%

  // Sync payment data from props
  useEffect(() => {
    if (paymentProofUrl !== undefined || paymentVerified !== undefined) {
      console.log('[UserCustomOrderCard] 💳 Payment data updated:', {
        paymentProofUrl: paymentProofUrl ? '✅' : '❌',
        paymentVerified,
      });
      setPaymentData({
        paymentProofUrl,
        paymentVerified,
      });
    }
  }, [paymentProofUrl, paymentVerified]);

  const handleDelete = async () => {
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true);
      return;
    }

    try {
      setIsDeleting(true);
      const response = await fetch(`/api/orders/unified/${orderId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to delete order');
      }

      // Redirect to dashboard on successful deletion
      window.location.href = '/dashboard';
    } catch (error) {
      console.error('[UserCustomOrderCard] Error deleting order:', error);
      alert(error instanceof Error ? error.message : 'Failed to delete order');
      setShowDeleteConfirm(false);
      setIsDeleting(false);
    }
  };

  // IMPORTANT: Sync props to state first before polling
  // This ensures we have the latest data from parent
  useEffect(() => {
    console.log('[UserCustomOrderCard] 🔄 Prop Sync - quotedPrice:', quotedPrice, 'quoteItems count:', quoteItems?.length || 0);

    // Always sync these from props when they arrive
    if (quotedPrice && quotedPrice > 0) {
      console.log('[UserCustomOrderCard] 💰 Syncing quotedPrice prop to state:', quotedPrice);
      setCurrentQuote(quotedPrice);
    }

    if (quoteItems && quoteItems.length > 0) {
      console.log('[UserCustomOrderCard] 📋 Syncing quoteItems prop to state:', quoteItems);
      setCurrentQuoteItems(quoteItems);
    }

    if (designUrls && designUrls.length > 0) {
      console.log('[UserCustomOrderCard] 🖼️ Syncing designUrls prop to state:', designUrls.length, 'URLs');
      setCurrentDesignUrls(designUrls);
    }
  }, [quotedPrice, quoteItems, designUrls]); // Re-run when props change

  // CRITICAL: Stop polling when quote arrives from props
  // This is separate from the polling effect to ensure we stop polling
  // as soon as props update
  useEffect(() => {
    if (quotedPrice && quotedPrice > 0) {
      console.log('[UserCustomOrderCard] ✅ Quote received via props, stopping poll');
      setIsPolling(false);
    }
  }, [quotedPrice]);

  // CRITICAL: Polling logic - SEPARATE from prop syncing
  // Only depends on orderId and polling interval
  useEffect(() => {
    // If polling is disabled, don't run
    if (!isPolling) {
      console.log('[UserCustomOrderCard] ⏸️ Polling disabled, skipping poll');
      return;
    }

    console.log('[UserCustomOrderCard] 🔄 Starting polling...');

    let mounted = true;
    let interval: NodeJS.Timeout | null = null;

    const pollForQuote = async () => {
      if (!mounted) return;

      try {
        console.log('[UserCustomOrderCard] ⏱️ Polling for quote update...');
        const response = await fetch(`/api/orders/unified/${orderId}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('[UserCustomOrderCard] ❌ Poll request failed:', {
            status: response.status,
            statusText: response.statusText,
            errorResponse: errorText,
          });
          return;
        }

        const data = await response.json();
        if (!mounted) return;

        console.log('[UserCustomOrderCard] 📥 Poll response received');
        console.log('  ├─ Raw response keys:', Object.keys(data).slice(0, 15));
        console.log('  ├─ Response structure:', {
          hasCustomOrder: !!data.customOrder,
          hasOrder: !!data.order,
          hasQuotedPrice: !!data.quotedPrice,
          hasQuoteItems: !!data.quoteItems,
        });

        const order = data.customOrder || data.order || data;
        const newQuote = order?.quotedPrice;
        const newQuoteItems = order?.quoteItems || [];
        const newDesignUrls = order?.designUrls || (order?.designUrl ? [order.designUrl] : []);

        console.log('[UserCustomOrderCard] 📊 Extracted Quote Data from API:');
        console.log('  ├─ quotedPrice:', newQuote, typeof newQuote);
        console.log('  ├─ quoteItemsCount:', newQuoteItems.length);
        console.log('  ├─ quoteItems:', newQuoteItems);
        console.log('  ├─ designUrls:', newDesignUrls.length, 'items');
        console.log('  └─ Full order object keys:', Object.keys(order).slice(0, 20));
        console.log('  ├─ quoteItemsCount:', newQuoteItems.length);
        console.log('  ├─ quoteItems:', newQuoteItems);
        console.log('  └─ Quote Changed?:', newQuote && newQuote !== currentQuote);

        // Update design URLs if they've changed
        if (newDesignUrls.length > 0) {
          const urlsChanged = newDesignUrls.length !== currentDesignUrls.length ||
            !newDesignUrls.every((url: any, idx: number) => url === currentDesignUrls[idx]);
          if (urlsChanged) {
            console.log('[UserCustomOrderCard] 🖼️ Updated design URLs:', newDesignUrls);
            setCurrentDesignUrls(newDesignUrls);
          }
        }

        // Update quote items if available
        if (newQuoteItems.length > 0) {
          const itemsChanged = newQuoteItems.length !== currentQuoteItems.length ||
            !newQuoteItems.every((item: any, idx: number) =>
              item.itemName === currentQuoteItems[idx]?.itemName &&
              item.quantity === currentQuoteItems[idx]?.quantity &&
              item.unitPrice === currentQuoteItems[idx]?.unitPrice
            );
          if (itemsChanged) {
            console.log('[UserCustomOrderCard] ✅ Updated quote items');
            setCurrentQuoteItems(newQuoteItems);
          }
        }

        // Check for payment status updates
        const newPaymentProofUrl = order?.paymentProofUrl;
        const newPaymentVerified = order?.paymentVerified;
        if (newPaymentProofUrl !== paymentData.paymentProofUrl || newPaymentVerified !== paymentData.paymentVerified) {
          console.log('[UserCustomOrderCard] 💳 Payment status updated from API:', {
            paymentProofUrl: newPaymentProofUrl ? '✅' : '❌',
            paymentVerified: newPaymentVerified,
          });
          setPaymentData({
            paymentProofUrl: newPaymentProofUrl,
            paymentVerified: newPaymentVerified,
          });
        }

        // Update quote if changed
        if (newQuote && newQuote > 0) {
          console.log('[UserCustomOrderCard] 💰 Quote received from API:', newQuote);
          console.log('  ├─ Current quote in state:', currentQuote);
          console.log('  ├─ Quote changed?', newQuote !== currentQuote);
          console.log('  └─ Setting state: setCurrentQuote(', newQuote, ')');
          setCurrentQuote(newQuote);
          if (mounted) {
            console.log('[UserCustomOrderCard] ✅ Stopping polling - quote received');
            setIsPolling(false);
          }
        } else {
          console.log('[UserCustomOrderCard] ⏳ No quote from API yet:', { newQuote, hasValue: !!newQuote });
        }

        setLastChecked(new Date());
      } catch (error) {
        console.error('[UserCustomOrderCard] ❌ Error polling for quote:', error);
      }
    };

    // Initial poll immediately
    pollForQuote();

    // Then set up interval for continuous polling
    interval = setInterval(pollForQuote, pollingIntervalMs);

    return () => {
      mounted = false;
      if (interval) clearInterval(interval);
    };
  }, [orderId, pollingIntervalMs, isPolling]); // Re-run when polling flag changes

  const getStatusColor = (status: string) => {
    const colors: Record<string, { bg: string; text: string; icon: string }> = {
      'pending': { bg: 'bg-yellow-50', text: 'text-yellow-700', icon: 'text-yellow-600' },
      'approved': { bg: 'bg-blue-50', text: 'text-blue-700', icon: 'text-blue-600' },
      'in-progress': { bg: 'bg-purple-50', text: 'text-purple-700', icon: 'text-purple-600' },
      'ready': { bg: 'bg-green-50', text: 'text-green-700', icon: 'text-green-600' },
      'completed': { bg: 'bg-emerald-50', text: 'text-emerald-700', icon: 'text-emerald-600' },
      'rejected': { bg: 'bg-red-50', text: 'text-red-700', icon: 'text-red-600' },
    };
    return colors[status] || colors['pending'];
  };

  // Check payment status
  const paymentStatus = checkPaymentStatus({
    paymentProofUrl: paymentData.paymentProofUrl,
    paymentVerified: paymentData.paymentVerified,
    status,
  });

  const getPaymentButtonState = () => {
    if (paymentStatus.isFullyPaid) {
      return {
        text: '✅ Payment Verified',
        isDisabled: true,
        isSending: false,
        className: 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white cursor-not-allowed opacity-75',
      };
    }
    if (paymentStatus.hasMixedPayment) {
      return {
        text: '⏳ Awaiting Confirmation',
        isDisabled: true,
        isSending: false,
        className: 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white cursor-not-allowed opacity-75',
      };
    }
    return {
      text: 'Proceed to Payment',
      isDisabled: false,
      isSending: false,
      className: 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white',
    };
  };

  const colors = getStatusColor(status);
  const hasQuote = currentQuote && currentQuote > 0;
  const paymentButtonState = getPaymentButtonState();

  // CRITICAL: Log render state to debug why quote isn't showing
  console.log('[UserCustomOrderCard] 🎨 RENDERING:', {
    orderNumber,
    orderId,
    hasQuote,
    currentQuote,
    currentQuoteItems: currentQuoteItems.length,
    isPolling,
    currentDesignUrls: currentDesignUrls.length,
  });

  return (
    <div className={`${colors.bg} dark:bg-[#111] rounded-2xl border-2 ${hasQuote ? 'border-emerald-300 dark:border-emerald-500/50 shadow-lg' : 'border-yellow-300 dark:border-yellow-500/50 shadow-md'} overflow-hidden transition-all duration-300`}>
      {/* Header */}
      <div className={`${hasQuote ? 'bg-gradient-to-r from-emerald-500 to-teal-500' : 'bg-gradient-to-r from-yellow-500 to-amber-500'} px-6 py-4`}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-bold text-white mb-1">Custom Order #{orderNumber}</h3>
            <p className="text-white text-opacity-90 text-sm">Status: {status.charAt(0).toUpperCase() + status.slice(1)}</p>
          </div>
          {/* Expand/Collapse Button */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex-shrink-0 p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-all transform"
            aria-label={isExpanded ? 'Collapse' : 'Expand'}
          >
            <ChevronDown
              className={`h-6 w-6 text-white transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
            />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className={`p-6 space-y-5 transition-all duration-300 ${!isExpanded ? 'max-h-96' : ''}`}>
        {/* Status Info - Only show when pending and waiting/received quote */}
        {status === 'pending' && (
          <div className="bg-white dark:bg-black/20 rounded-lg p-4 border-2 border-gray-200 dark:border-white/10">
            <div className="flex items-center gap-3 mb-3">
              {hasQuote ? (
                <>
                  <CheckCircle className="h-6 w-6 text-emerald-600 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wide">Quote Received!</p>
                    <p className="text-sm text-gray-900 dark:text-gray-100 font-semibold">Admin has sent your quotation</p>
                  </div>
                </>
              ) : (
                <>
                  <Clock className="h-6 w-6 text-yellow-600 animate-spin flex-shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wide">Waiting for Quote</p>
                    <p className="text-sm text-gray-900 dark:text-gray-100 font-semibold">Admin is preparing your quote...</p>
                  </div>
                </>
              )}
            </div>

            {lastChecked && !hasQuote && (
              <p className="text-xs text-gray-500 ml-9">Last checked: {lastChecked.toLocaleTimeString()}</p>
            )}
          </div>
        )}

        {/* Collapsible Content - Hidden when collapsed */}
        {isExpanded && (
          <>
            {/* Order Details */}
            <div className="grid grid-cols-2 gap-4 bg-white dark:bg-black/20 rounded-lg p-4 border-2 border-gray-200 dark:border-white/10 animate-fadeIn">
              <div>
                <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-1">Quantity</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">{quantity}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-1">Status</p>
                <p className={`text-sm font-bold ${colors.text} dark:text-lime-400`}>{status.charAt(0).toUpperCase() + status.slice(1)}</p>
              </div>
            </div>

            {/* Description */}
            <div className="bg-white dark:bg-black/20 rounded-lg p-4 border-2 border-gray-200 dark:border-white/10 animate-fadeIn">
              <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-2">Your Request</p>
              <p className="text-sm text-gray-900 dark:text-gray-200 leading-relaxed">{description}</p>
            </div>

            {/* Design Images */}
            {currentDesignUrls.length > 0 && (
              <div className="bg-white rounded-lg p-4 border-2 border-gray-200 animate-fadeIn">
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">Design Images ({currentDesignUrls.length})</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {currentDesignUrls.map((url, idx) => (
                    <div
                      key={idx}
                      className="relative aspect-square bg-gray-100 dark:bg-black/40 rounded-lg border-2 border-gray-300 dark:border-white/10 overflow-hidden hover:border-lime-400 transition-colors"
                    >
                      <img
                        src={url}
                        alt={`Design ${idx + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const img = e.target as HTMLImageElement;
                          img.style.display = 'none';
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Quote Section */}
        {hasQuote ? (
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/10 dark:to-teal-900/10 rounded-xl border-2 border-emerald-300 dark:border-emerald-500/50 p-5 space-y-4">
            {/* Line Items */}
            {currentQuoteItems.length > 0 && (
              <div className="bg-white dark:bg-black/20 rounded-lg p-4 border-2 border-emerald-200 dark:border-white/10 space-y-2">
                <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase mb-3">Quote Items</p>
                {currentQuoteItems.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-emerald-50 dark:bg-emerald-900/10 rounded border border-emerald-100 dark:border-emerald-900/20">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900 dark:text-white">{item.itemName}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Qty: {item.quantity} × ₦{item.unitPrice.toLocaleString()} = ₦{(item.quantity * item.unitPrice).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pricing Breakdown */}
            <div className="bg-white dark:bg-black/20 rounded-lg p-4 border-2 border-emerald-200 dark:border-white/10 space-y-2">
              {/* Subtotal (before discount) */}
              <div className="flex justify-between text-sm">
                <span className="font-semibold text-gray-700 dark:text-gray-400">Subtotal:</span>
                <span className="font-bold text-gray-900 dark:text-white">₦{(totals.subtotal || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}</span>
              </div>

              {/* 🎁 Discount - Show if present */}
              {totals.discountPercentage && totals.discountPercentage > 0 ? (
                <div className="flex justify-between text-sm bg-green-50 px-3 py-2 rounded border border-green-200">
                  <span className="font-semibold text-green-700">🎁 Discount ({totals.discountPercentage}%):</span>
                  <span className="font-bold text-green-600">-₦{(totals.discount || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}</span>
                </div>
              ) : null}

              {/* Subtotal After Discount (if discount applied) */}
              {totals.subtotalAfterDiscount && totals.subtotalAfterDiscount > 0 && totals.subtotalAfterDiscount !== totals.subtotal ? (
                <div className="flex justify-between text-sm font-semibold text-gray-800 bg-white px-3 py-1.5 rounded border border-gray-200">
                  <span>Subtotal After Discount:</span>
                  <span>₦{(totals.subtotalAfterDiscount).toLocaleString('en-NG', { minimumFractionDigits: 2 })}</span>
                </div>
              ) : null}

              <div className="flex justify-between text-sm border-t border-emerald-200 dark:border-white/10 pt-2">
                <span className="font-semibold text-gray-700 dark:text-gray-400">VAT (7.5%):</span>
                <span className="font-bold text-emerald-600 dark:text-lime-400">₦{(totals.vat || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-lg border-t-2 border-emerald-300 dark:border-white/20 pt-2">
                <span className="font-bold text-gray-900 dark:text-white">Total:</span>
                <span className="font-black text-emerald-600 dark:text-lime-400">₦{(totals.total || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

            {/* Action Buttons - Only show when pending with quote */}
            {status === 'pending' && hasQuote && (
              <div className="flex gap-3 pt-3 border-t border-emerald-300">
                <button
                  onClick={() => !paymentButtonState.isDisabled && onProceedToPayment?.(orderId, totals.total, currentQuoteItems)}
                  disabled={paymentButtonState.isDisabled}
                  className={`flex-1 px-4 py-3 ${paymentButtonState.className} font-bold rounded-lg transition-all transform ${!paymentButtonState.isDisabled ? 'hover:scale-105 active:scale-95' : ''} whitespace-nowrap text-sm`}
                  title={paymentButtonState.isDisabled ? 'Payment is being processed. Please wait for confirmation.' : 'Click to proceed with payment'}
                >
                  {paymentButtonState.text}
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-all flex items-center gap-2 text-sm"
                  title="Delete this order"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              </div>
            )}

            {/* Delete Button for non-pending with quote */}
            {!(status === 'pending' && hasQuote) && (
              <div className="pt-3 border-t border-emerald-300">
                <button
                  onClick={handleDelete}
                  className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-all flex items-center justify-center gap-2 text-sm"
                  title="Delete this order"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Order
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/10 dark:to-amber-900/10 rounded-xl border-2 border-yellow-300 dark:border-yellow-500/50 p-5 space-y-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-6 w-6 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-gray-900 dark:text-white mb-1">Quote Not Yet Sent</p>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                  The admin is reviewing your request and will send you a quotation soon.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-[#111] rounded-2xl shadow-2xl max-w-md w-full p-6 border border-gray-200 dark:border-white/10">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Delete Order?</h3>
              <p className="text-gray-700 dark:text-gray-400 text-sm mb-6">
                Are you sure you want to delete this custom order? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold rounded-lg transition"
                  disabled={isDeleting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition flex items-center justify-center gap-2"
                  disabled={isDeleting}
                >
                  <Trash2 className="h-4 w-4" />
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
