'use client';

import React, { useState, useEffect } from 'react';
import { Send, AlertCircle, CheckCircle, Clock, ChevronDown, Download, X } from 'lucide-react';
import Image from 'next/image';

interface CustomOrderCardProps {
  orderId: string;
  orderNumber: string;
  fullName: string;
  email: string;
  phone: string;
  quantity: number;
  description: string;
  designUrls?: string[];
  status: 'pending' | 'paid' | 'approved' | 'in-progress' | 'ready' | 'completed' | 'rejected';
  quotedPrice?: number;
  quoteItems?: Array<{ itemName: string; quantity: number; unitPrice: number }>;
  paymentVerified?: boolean;
}

export function CustomOrderCard({
  orderId,
  orderNumber,
  fullName,
  email,
  phone,
  quantity,
  description,
  designUrls = [],
  status,
  quotedPrice,
  quoteItems = [],
  paymentVerified = false,
}: CustomOrderCardProps) {
  // Initialize with props data first, then override with database data on mount
  const [lineItems, setLineItems] = useState<Array<{ id: string; itemName: string; quantity: number; unitPrice: number }>>(
    quoteItems && quoteItems.length > 0 
      ? quoteItems.map((item, idx) => ({ id: `item-${idx}`, ...item }))
      : []
  );
  const [itemName, setItemName] = useState('');
  const [itemQuantity, setItemQuantity] = useState('1');
  const [itemPrice, setItemPrice] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [expandDetails, setExpandDetails] = useState(true);
  const [quoteSent, setQuoteSent] = useState(!!quotedPrice);
  const [showResendConfirm, setShowResendConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showProductionConfirm, setShowProductionConfirm] = useState(false);
  const [showCompletedConfirm, setShowCompletedConfirm] = useState(false);
  const [isMarking, setIsMarking] = useState(false);
  const [expandedImageIndex, setExpandedImageIndex] = useState<number | null>(null);

  const VAT_RATE = 0.075; // 7.5%

  // Load quote data on component mount to preserve data after refresh
  useEffect(() => {
    const loadQuoteData = async () => {
      try {
        const response = await fetch(`/api/custom-orders/${orderId}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
          },
        });

        if (!response.ok) {
          return;
        }
        
        const jsonResponse = await response.json();
        
        // Extract order from the data property
        const order = jsonResponse.data || jsonResponse.customOrder || jsonResponse.order;
        
        if (!order) {
          return;
        }
        
        const savedQuoteItems = order.quoteItems;
        
        // Update with saved data from database
        if (Array.isArray(savedQuoteItems) && savedQuoteItems.length > 0) {
          const itemsWithIds = savedQuoteItems.map((item: any, idx: number) => ({ 
            id: `item-${idx}`, 
            itemName: item.itemName,
            quantity: item.quantity,
            unitPrice: item.unitPrice
          }));
          setLineItems(itemsWithIds);
          setQuoteSent(true);
        }
      } catch (error) {
        console.error('Error loading quote data:', error);
      }
    };

    // Load data on mount and whenever orderId changes
    if (orderId) {
      loadQuoteData();
    }
  }, [orderId]);

  // Calculate totals
  const calculateTotals = (items: typeof lineItems) => {
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const vat = subtotal * VAT_RATE;
    const total = subtotal + vat;
    return { subtotal, vat, total };
  };

  const totals = calculateTotals(lineItems);

  // Download a single image
  const handleDownloadImage = (url: string, index: number) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `design-${orderNumber}-${index + 1}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Download all images
  const handleDownloadAll = async () => {
    if (designUrls.length === 0) return;

    // If only one image, download it directly
    if (designUrls.length === 1) {
      handleDownloadImage(designUrls[0], 0);
      return;
    }

    // For multiple images, create a zip or download them sequentially
    for (let i = 0; i < designUrls.length; i++) {
      const url = designUrls[i];
      const link = document.createElement('a');
      link.href = url;
      link.download = `design-${orderNumber}-${i + 1}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Small delay between downloads
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  };

  const handleAddLineItem = () => {
    if (!itemName.trim() || !itemPrice || parseFloat(itemPrice) <= 0 || !itemQuantity || parseFloat(itemQuantity) <= 0) {
      setSubmitStatus('error');
      setErrorMessage('Please fill all fields with valid values');
      setTimeout(() => setSubmitStatus('idle'), 3000);
      return;
    }

    const newItem = {
      id: `item-${Date.now()}`,
      itemName: itemName.trim(),
      quantity: parseFloat(itemQuantity),
      unitPrice: parseFloat(itemPrice),
    };

    setLineItems([...lineItems, newItem]);
    setItemName('');
    setItemQuantity('1');
    setItemPrice('');
    setSubmitStatus('idle');
  };

  const handleSendQuote = async () => {
    if (lineItems.length === 0) {
      setSubmitStatus('error');
      setErrorMessage('Please add at least one quote item');
      setTimeout(() => setSubmitStatus('idle'), 3000);
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      const payload = {
        quoteItems: lineItems.map(({ id, ...item }) => item), // Remove ID before sending
        quotedPrice: totals.total,
      };
      
      console.log('[CustomOrderCard] Sending quote with payload:', payload);
      
      const response = await fetch(`/api/custom-orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      console.log('[CustomOrderCard] PATCH response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[CustomOrderCard] PATCH response error:', errorText);
        throw new Error('Failed to send quote');
      }

      const data = await response.json();
      console.log('[CustomOrderCard] Quote saved successfully, response:', data);
      
      setQuoteSent(true);
      setSubmitStatus('success');
      setErrorMessage('');
      
      // Reset after success
      setTimeout(() => {
        setSubmitStatus('idle');
      }, 3000);
    } catch (error) {
      setSubmitStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Failed to send quote');
      setTimeout(() => setSubmitStatus('idle'), 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuoteSentClick = () => {
    if (quoteSent && !showResendConfirm) {
      setShowResendConfirm(true);
    }
  };

  const handleConfirmResend = async () => {
    setShowResendConfirm(false);
    setQuoteSent(false);
    await handleSendQuote();
  };

  const handleApproveOrder = async () => {
    setIsApproving(true);
    setSubmitStatus('idle');

    try {
      const response = await fetch(`/api/custom-orders?id=${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'approved', // Move to approved tab
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to approve order');
      }

      setSubmitStatus('success');
      setErrorMessage('');
      
      // Reset after success
      setTimeout(() => {
        setSubmitStatus('idle');
      }, 3000);
    } catch (error) {
      setSubmitStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Failed to approve order');
      setTimeout(() => setSubmitStatus('idle'), 3000);
    } finally {
      setIsApproving(false);
    }
  };

  const handleStartProduction = async () => {
    setIsStarting(true);
    setSubmitStatus('idle');

    try {
      const response = await fetch(`/api/custom-orders?id=${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'in-progress', // Change to in-progress for production
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to start production');
      }

      setSubmitStatus('success');
      setSuccessMessage('✅ Production started! Order moved to In Progress');
      setErrorMessage('');
      setShowProductionConfirm(false);
      
      // Reset after success
      setTimeout(() => {
        setSubmitStatus('idle');
      }, 3000);
    } catch (error) {
      setSubmitStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Failed to start production');
      setTimeout(() => setSubmitStatus('idle'), 3000);
    } finally {
      setIsStarting(false);
    }
  };

  const handleDeleteOrder = async () => {
    setIsDeleting(true);
    setSubmitStatus('idle');

    try {
      const response = await fetch(`/api/custom-orders?id=${orderId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error('Failed to delete order');
      }

      setSubmitStatus('success');
      setSuccessMessage('🗑️ Order deleted successfully');
      setErrorMessage('');
      setShowDeleteConfirm(false);
      
      // Reset after success
      setTimeout(() => {
        setSubmitStatus('idle');
      }, 3000);
    } catch (error) {
      setSubmitStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Failed to delete order');
      setTimeout(() => setSubmitStatus('idle'), 3000);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleMarkAsCompleted = async () => {
    setIsMarking(true);
    setSubmitStatus('idle');

    try {
      // Update order status to 'ready' for shipping in the database
      const response = await fetch(`/api/custom-orders?id=${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'ready', // Change to 'ready' for shipping
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to mark order as ready for shipping');
      }

      // Send order to logistics
      try {
        const existingOrders = sessionStorage.getItem('logistics_orders');
        const ordersArray = existingOrders ? JSON.parse(existingOrders) : [];
        
        // Create order object to send to logistics
        const orderToSend = {
          _id: orderId,
          orderNumber,
          fullName,
          email,
          phone,
          quantity,
          description,
          status: 'ready',
          designUrls: designUrls || [],
          quoteItems: quoteItems || [],
          createdAt: new Date().toISOString(),
          _isCustomOrder: true,
        };
        
        // Check if order already exists to avoid duplicates
        const orderExists = ordersArray.some((order: any) => order._id === orderId);
        if (!orderExists) {
          ordersArray.push(orderToSend);
          sessionStorage.setItem('logistics_orders', JSON.stringify(ordersArray));
        }
        
        console.log('[CustomOrderCard] ✅ Order sent to logistics with status ready');
      } catch (logisticsError) {
        console.error('[CustomOrderCard] ⚠️ Failed to send to logistics (non-blocking):', logisticsError);
      }

      setSubmitStatus('success');
      setSuccessMessage('✅ Order marked as ready for shipping! Logistics team has been notified.');
      setErrorMessage('');
      setShowCompletedConfirm(false);
      
      // Reset after success
      setTimeout(() => {
        setSubmitStatus('idle');
      }, 3000);
    } catch (error) {
      setSubmitStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Failed to mark order as ready');
      setTimeout(() => setSubmitStatus('idle'), 3000);
    } finally {
      setIsMarking(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'pending': 'bg-yellow-50 text-yellow-700 border-yellow-200',
      'approved': 'bg-blue-50 text-blue-700 border-blue-200',
      'in-progress': 'bg-purple-50 text-purple-700 border-purple-200',
      'ready': 'bg-green-50 text-green-700 border-green-200',
      'completed': 'bg-emerald-50 text-emerald-700 border-emerald-200',
      'rejected': 'bg-red-50 text-red-700 border-red-200',
    };
    return colors[status] || colors['pending'];
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-2xl border-2 border-blue-300 overflow-hidden shadow-lg hover:shadow-2xl hover:border-blue-400 transition-all">
      {/* Header */}
      <div className="relative bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-bold text-white mb-1">Order #{orderNumber}</h3>
            <p className="text-blue-100 text-sm">Custom Costume Request</p>
          </div>
          <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold flex-shrink-0 whitespace-nowrap border ${getStatusColor(status)}`}>
            {status === 'pending' && <Clock className="h-4 w-4" />}
            {status === 'approved' && <CheckCircle className="h-4 w-4" />}
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-5">
        {/* Customer Info */}
        <div className="grid grid-cols-2 gap-4 bg-white rounded-lg p-4 border border-blue-200">
          <div>
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Customer</p>
            <p className="text-sm font-bold text-gray-900">{fullName}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Quantity</p>
            <p className="text-sm font-bold text-gray-900">{quantity} piece(s)</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Email</p>
            <p className="text-sm text-blue-600 hover:underline break-all">{email}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Phone</p>
            <p className="text-sm text-gray-900">{phone}</p>
          </div>
        </div>

        {/* Expand/Collapse Button for Quote Section */}
        <button
          onClick={() => setExpandDetails(!expandDetails)}
          className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-lime-100 to-green-50 hover:from-lime-200 hover:to-green-100 border-2 border-lime-300 rounded-lg transition-all"
        >
          <span className="font-bold text-gray-900">Quote Details</span>
          <ChevronDown className={`h-5 w-5 text-gray-900 transition-transform duration-300 ${expandDetails ? 'rotate-180' : ''}`} />
        </button>

        {/* Design Images & Description - Always visible */}
        {designUrls.length > 0 && (
          <div className="bg-white rounded-lg p-4 border border-blue-200">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Design Images ({designUrls.length})</p>
              <button
                onClick={handleDownloadAll}
                className="flex items-center gap-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors"
              >
                <Download className="h-4 w-4" />
                Download All
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {designUrls.map((url, idx) => (
                <div
                  key={idx}
                  className="relative aspect-square bg-gray-100 rounded-lg border-2 border-blue-200 overflow-hidden cursor-pointer hover:border-blue-400 hover:shadow-md transition-all"
                  onClick={() => setExpandedImageIndex(idx)}
                >
                  <Image
                    src={url}
                    alt={`Design ${idx + 1}`}
                    fill
                    className="object-cover hover:scale-105 transition-transform"
                    unoptimized={true}
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

        {/* Expanded Image Modal */}
        {expandedImageIndex !== null && designUrls[expandedImageIndex] && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
            <div className="relative max-w-4xl max-h-[90vh] w-full">
              {/* Close button */}
              <button
                onClick={() => setExpandedImageIndex(null)}
                className="absolute -top-12 right-0 p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="h-6 w-6" />
              </button>

              {/* Image */}
              <div className="relative w-full aspect-auto bg-gray-900 rounded-lg overflow-hidden">
                <Image
                  src={designUrls[expandedImageIndex]}
                  alt={`Design ${expandedImageIndex + 1} - Expanded`}
                  width={1200}
                  height={1200}
                  className="w-full h-auto object-contain"
                  unoptimized={true}
                />
              </div>

              {/* Download button in modal */}
              <button
                onClick={() => handleDownloadImage(designUrls[expandedImageIndex], expandedImageIndex)}
                className="absolute bottom-4 right-4 flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
              >
                <Download className="h-5 w-5" />
                Download
              </button>

              {/* Navigation arrows */}
              {designUrls.length > 1 && (
                <>
                  <button
                    onClick={() => setExpandedImageIndex((expandedImageIndex - 1 + designUrls.length) % designUrls.length)}
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/20 hover:bg-white/40 text-white rounded-lg transition-colors"
                  >
                    ←
                  </button>
                  <button
                    onClick={() => setExpandedImageIndex((expandedImageIndex + 1) % designUrls.length)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/20 hover:bg-white/40 text-white rounded-lg transition-colors"
                  >
                    →
                  </button>
                  <p className="absolute bottom-4 left-4 text-white text-sm font-medium">
                    {expandedImageIndex + 1} / {designUrls.length}
                  </p>
                </>
              )}
            </div>
          </div>
        )}

        {/* Description */}
        <div className="bg-white rounded-lg p-4 border border-blue-200">
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Description</p>
          <p className="text-sm text-gray-900 leading-relaxed">{description}</p>
        </div>

        {/* Quote Input Section - Collapsible */}
        {expandDetails && (
          <>
            {!paymentVerified ? (
              // STEP 1: Quote not yet sent, or quote sent but payment not verified
              <div className="space-y-4">
            <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider">📊 Quote Builder - Add Items</h4>
            
            {/* Line Items List */}
            {lineItems.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-600 uppercase mb-3">Quote Items</p>
                {lineItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900">{item.itemName}</p>
                      <p className="text-xs text-gray-600">Qty: {item.quantity} × ₦{item.unitPrice.toLocaleString()} = ₦{(item.quantity * item.unitPrice).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add New Item Form */}
            <div className="bg-white rounded-lg p-4 border-2 border-gray-200 space-y-3">
              <p className="text-xs font-semibold text-gray-600 uppercase">Add New Item</p>
              
              <div>
                <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1 block">Item Name/Description</label>
                <input
                  type="text"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  placeholder="e.g., Red Costume Design, Blue Cape, etc."
                  className="w-full px-3 py-2 rounded-lg border-2 border-gray-300 focus:border-blue-500 focus:outline-none text-sm font-semibold text-gray-900 placeholder-gray-400 transition-colors"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1 block">Quantity</label>
                  <input
                    type="number"
                    value={itemQuantity}
                    onChange={(e) => setItemQuantity(e.target.value)}
                    min="1"
                    className="w-full px-3 py-2 rounded-lg border-2 border-gray-300 focus:border-blue-500 focus:outline-none text-sm font-semibold text-gray-900 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1 block">Unit Price</label>
                  <input
                    type="number"
                    value={itemPrice}
                    onChange={(e) => setItemPrice(e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 rounded-lg border-2 border-gray-300 focus:border-blue-500 focus:outline-none text-sm font-semibold text-gray-900 placeholder-gray-400 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1 block">Action</label>
                  <button
                    onClick={handleAddLineItem}
                    className="w-full px-3 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold text-sm rounded-lg transition-all"
                  >
                    + Add
                  </button>
                </div>
              </div>
            </div>

            {/* Pricing Summary */}
            {lineItems.length > 0 && (
              <div className="bg-gradient-to-r from-white to-gray-50 rounded-lg p-4 border-2 border-emerald-300 space-y-2">
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
            )}

            {/* Send Quote / Quote Sent / Approve Button */}
            {status === 'pending' && !quotedPrice && (
              // Show "Send Quote" button when no quote has been sent yet
              <button
                onClick={handleSendQuote}
                disabled={isSubmitting || lineItems.length === 0}
                className={`w-full px-6 py-4 font-bold text-lg rounded-lg transition-all transform text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 disabled:from-gray-400 disabled:to-gray-400 hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:hover:scale-100`}
              >
                Send Quote
              </button>
            )}
            
            {status === 'pending' && quotedPrice && (
              // Show "Quote Sent" button after quote is sent
              <button
                onClick={handleQuoteSentClick}
                className={`w-full px-6 py-4 font-bold text-lg rounded-lg transition-all transform text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 hover:scale-105 active:scale-95`}
              >
                ✅ Quote Sent
              </button>
            )}
            
            {status === 'paid' && (
              // Show "Approve" button when payment has been verified
              <button
                onClick={handleApproveOrder}
                disabled={isApproving}
                className={`w-full px-6 py-4 font-bold text-lg rounded-lg transition-all transform text-white bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 disabled:from-gray-400 disabled:to-gray-400 hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:hover:scale-100`}
              >
                {isApproving ? 'Approving...' : '✅ Approve Order'}
              </button>
            )}

            {status === 'approved' && (
              // Show "Start Production" and "Delete" buttons when order is approved
              <div className="flex gap-3 items-center">
                <button
                  onClick={() => setShowProductionConfirm(true)}
                  disabled={isStarting}
                  className={`flex-1 px-6 py-4 font-bold text-lg rounded-lg transition-all transform text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-400 hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:hover:scale-100`}
                >
                  {isStarting ? 'Starting...' : '🚀 Start Production'}
                </button>

                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={isDeleting}
                  className={`p-4 font-bold text-lg rounded-lg transition-all transform text-white bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 disabled:from-gray-400 disabled:to-gray-400 hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:hover:scale-100`}
                >
                  {isDeleting ? '...' : '🗑️'}
                </button>
              </div>
            )}

            {status === 'in-progress' && (
              // Show "Ready for Shipping" button when order is in progress
              <button
                onClick={() => setShowCompletedConfirm(true)}
                disabled={isMarking}
                className={`w-full px-6 py-4 font-bold text-lg rounded-lg transition-all transform text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:from-gray-400 disabled:to-gray-400 hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:hover:scale-100`}
              >
                {isMarking ? 'Marking...' : '📦 Ready for Shipping'}
              </button>
            )}

            {/* Status Messages */}
            {submitStatus === 'success' && (
              <div className="flex items-center gap-3 p-3 bg-emerald-100 border border-emerald-300 rounded-lg">
                <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                <p className="text-sm font-semibold text-emerald-700">{successMessage}</p>
              </div>
            )}

            {submitStatus === 'error' && (
              <div className="flex items-center gap-3 p-3 bg-red-100 border border-red-300 rounded-lg">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                <p className="text-sm font-semibold text-red-700">❌ {errorMessage}</p>
              </div>
            )}
          </div>
            ) : (
              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border-2 border-blue-300 p-5 space-y-4">
                <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider">✅ Payment Verified</h4>
                
                <div className="bg-white rounded-lg p-4 border-2 border-blue-200">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold text-gray-700">Total Amount</span>
                    <span className="text-2xl font-black text-blue-600">₦{totals.total.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <p className="text-xs text-gray-600 text-center">Customer has completed payment</p>
                </div>

                {/* Approve Button */}
                <button
                  onClick={handleApproveOrder}
                  disabled={isApproving}
                  className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-400 text-white font-bold text-lg rounded-lg transition-all transform hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  <CheckCircle className="h-6 w-6" />
                  Approve Order
                </button>

                {/* Status Messages */}
                {submitStatus === 'success' && (
                  <div className="flex items-center gap-3 p-3 bg-green-100 border border-green-300 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <p className="text-sm font-semibold text-green-700">✅ Order approved! Moving to approved tab...</p>
                  </div>
                )}

                {submitStatus === 'error' && (
                  <div className="flex items-center gap-3 p-3 bg-red-100 border border-red-300 rounded-lg">
                    <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                    <p className="text-sm font-semibold text-red-700">❌ {errorMessage}</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Resend Confirmation Popup */}
        {showResendConfirm && (
          <div className="fixed inset-0 bg-black/10 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-sm mx-4 border-2 border-emerald-300 shadow-2xl">
              <h3 className="text-lg font-bold text-gray-900 mb-3">Resend Quote?</h3>
              <p className="text-sm text-gray-700 mb-5">Are you sure you want to resend the quote to the customer?</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowResendConfirm(false)}
                  className="flex-1 px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-900 font-bold rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmResend}
                  className="flex-1 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-lg transition-colors"
                >
                  Resend
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Start Production Confirmation Popup */}
        {showProductionConfirm && (
          <div className="fixed inset-0 bg-black/10 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-sm mx-4 border-2 border-purple-300 shadow-2xl">
              <h3 className="text-lg font-bold text-gray-900 mb-3">Start Production?</h3>
              <p className="text-sm text-gray-700 mb-5">Are you ready to start production on this order? Once started, the status will change to In Progress.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowProductionConfirm(false)}
                  className="flex-1 px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-900 font-bold rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleStartProduction}
                  disabled={isStarting}
                  className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-bold rounded-lg transition-colors disabled:cursor-not-allowed"
                >
                  {isStarting ? 'Starting...' : 'Yes, Start'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Popup */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/10 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-sm mx-4 border-2 border-red-300 shadow-2xl">
              <h3 className="text-lg font-bold text-gray-900 mb-3">Delete Order?</h3>
              <p className="text-sm text-gray-700 mb-5">Are you sure you want to delete this order? This action cannot be undone.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-900 font-bold rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteOrder}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-bold rounded-lg transition-colors disabled:cursor-not-allowed"
                >
                  {isDeleting ? 'Deleting...' : 'Yes, Delete'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Mark as Completed Confirmation Popup */}
        {showCompletedConfirm && (
          <div className="fixed inset-0 bg-black/10 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-sm mx-4 border-2 border-emerald-300 shadow-2xl">
              <h3 className="text-lg font-bold text-gray-900 mb-3">Ready for Shipping?</h3>
              <p className="text-sm text-gray-700 mb-5">Is this order ready for shipping? The logistics team will be notified and can start handling delivery.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowCompletedConfirm(false)}
                  className="flex-1 px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-900 font-bold rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleMarkAsCompleted}
                  disabled={isMarking}
                  className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white font-bold rounded-lg transition-colors disabled:cursor-not-allowed"
                >
                  {isMarking ? 'Marking...' : 'Yes, Ready'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
