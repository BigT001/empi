'use client';

import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle, MessageCircle, AlertCircle, Zap, ChevronDown, Trash2 } from 'lucide-react';

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

  const VAT_RATE = 0.075; // 7.5%

  // Calculate totals from quote items
  const calculateTotals = () => {
    if (currentQuoteItems.length > 0) {
      const subtotal = currentQuoteItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
      const vat = subtotal * VAT_RATE;
      const total = subtotal + vat;
      return { subtotal, vat, total };
    }
    return { subtotal: 0, vat: 0, total: currentQuote || 0 };
  };

  const totals = calculateTotals();

  const handleDelete = async () => {
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true);
      return;
    }

    try {
      setIsDeleting(true);
      const response = await fetch(`/api/custom-orders?id=${orderId}`, {
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

  // Poll for quote updates if not already quoted
  useEffect(() => {
    if (currentQuote) {
      setIsPolling(false);
      return;
    }

    const pollForQuote = async () => {
      try {
        console.log('[UserCustomOrderCard] Polling for quote update...');
        const response = await fetch(`/api/custom-orders/${orderId}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
          },
        });
        if (response.ok) {
          const data = await response.json();
          console.log('[UserCustomOrderCard] Poll response:', data);
          
          const order = data.customOrder || data.order || data;
          const newQuote = order?.quotedPrice;
          const newQuoteItems = order?.quoteItems || [];
          const newDesignUrls = order?.designUrls || order?.designUrl ? [order.designUrl] : [];
          
          console.log('[UserCustomOrderCard] newQuote:', newQuote, 'currentQuote:', currentQuote);
          console.log('[UserCustomOrderCard] newQuoteItems:', newQuoteItems);
          
          // Update design URLs if available
          if (newDesignUrls.length > currentDesignUrls.length) {
            console.log('[UserCustomOrderCard] Updated design URLs');
            setCurrentDesignUrls(newDesignUrls);
          }

          // Update quote items if available
          if (newQuoteItems.length > 0) {
            console.log('[UserCustomOrderCard] Updated quote items');
            setCurrentQuoteItems(newQuoteItems);
          }
          
          // Update quote if changed
          if (newQuote && newQuote !== currentQuote) {
            console.log('[UserCustomOrderCard] Quote updated:', newQuote);
            setCurrentQuote(newQuote);
            setIsPolling(false); // Stop polling once quote received
          }
          setLastChecked(new Date());
        }
      } catch (error) {
        console.error('[UserCustomOrderCard] Error polling for quote:', error);
      }
    };

    if (isPolling) {
      // Check immediately, then set up interval
      console.log('[UserCustomOrderCard] Starting poll interval...');
      pollForQuote();
      const interval = setInterval(pollForQuote, pollingIntervalMs);
      return () => clearInterval(interval);
    }
  }, [orderId, currentQuote, isPolling, pollingIntervalMs, currentDesignUrls, currentQuoteItems]);

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

  const colors = getStatusColor(status);
  const hasQuote = currentQuote && currentQuote > 0;

  return (
    <div className={`${colors.bg} rounded-2xl border-2 ${hasQuote ? 'border-emerald-300 shadow-lg' : 'border-yellow-300 shadow-md'} overflow-hidden transition-all duration-300`}>
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
          <div className="bg-white rounded-lg p-4 border-2 border-gray-200">
            <div className="flex items-center gap-3 mb-3">
              {hasQuote ? (
                <>
                  <CheckCircle className="h-6 w-6 text-emerald-600 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-gray-600 uppercase tracking-wide">Quote Received!</p>
                    <p className="text-sm text-gray-900 font-semibold">Admin has sent your quotation</p>
                  </div>
                </>
              ) : (
                <>
                  <Clock className="h-6 w-6 text-yellow-600 animate-spin flex-shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-gray-600 uppercase tracking-wide">Waiting for Quote</p>
                    <p className="text-sm text-gray-900 font-semibold">Admin is preparing your quote...</p>
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
            <div className="grid grid-cols-2 gap-4 bg-white rounded-lg p-4 border-2 border-gray-200 animate-fadeIn">
              <div>
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Quantity</p>
                <p className="text-lg font-bold text-gray-900">{quantity}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Status</p>
                <p className={`text-sm font-bold ${colors.text}`}>{status.charAt(0).toUpperCase() + status.slice(1)}</p>
              </div>
            </div>

            {/* Description */}
            <div className="bg-white rounded-lg p-4 border-2 border-gray-200 animate-fadeIn">
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Your Request</p>
              <p className="text-sm text-gray-900 leading-relaxed">{description}</p>
            </div>

            {/* Design Images */}
            {currentDesignUrls.length > 0 && (
              <div className="bg-white rounded-lg p-4 border-2 border-gray-200 animate-fadeIn">
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">Design Images ({currentDesignUrls.length})</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {currentDesignUrls.map((url, idx) => (
                    <div
                      key={idx}
                      className="relative aspect-square bg-gray-100 rounded-lg border-2 border-gray-300 overflow-hidden hover:border-lime-400 transition-colors"
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
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border-2 border-emerald-300 p-5 space-y-4">
            {/* Line Items */}
            {currentQuoteItems.length > 0 && (
              <div className="bg-white rounded-lg p-4 border-2 border-emerald-200 space-y-2">
                <p className="text-xs font-semibold text-gray-600 uppercase mb-3">Quote Items</p>
                {currentQuoteItems.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-emerald-50 rounded border border-emerald-100">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900">{item.itemName}</p>
                      <p className="text-xs text-gray-600">Qty: {item.quantity} × ₦{item.unitPrice.toLocaleString()} = ₦{(item.quantity * item.unitPrice).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pricing Breakdown */}
            <div className="bg-white rounded-lg p-4 border-2 border-emerald-200 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-semibold text-gray-700">Subtotal:</span>
                <span className="font-bold text-gray-900">₦{totals.subtotal.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-sm border-t border-emerald-200 pt-2">
                <span className="font-semibold text-gray-700">VAT (7.5%):</span>
                <span className="font-bold text-emerald-600">₦{totals.vat.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-lg border-t-2 border-emerald-300 pt-2">
                <span className="font-bold text-gray-900">Total:</span>
                <span className="font-black text-emerald-600">₦{totals.total.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

            {/* Action Buttons - Only show when pending with quote */}
            {status === 'pending' && hasQuote && (
              <div className="flex gap-3 pt-3 border-t border-emerald-300">
                <button
                  onClick={() => onProceedToPayment?.(orderId, totals.total, currentQuoteItems)}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold rounded-lg transition-all transform hover:scale-105 active:scale-95 whitespace-nowrap text-sm"
                >
                  Proceed to Payment
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
          <div className="bg-gradient-to-r from-yellow-50 to-amber-50 rounded-xl border-2 border-yellow-300 p-5 space-y-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-6 w-6 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-gray-900 mb-1">Quote Not Yet Sent</p>
                <p className="text-sm text-gray-700 leading-relaxed">
                  The admin is reviewing your request and will send you a quotation soon.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Order?</h3>
              <p className="text-gray-700 text-sm mb-6">
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
