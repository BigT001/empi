'use client';

import React from 'react';
import Image from 'next/image';
import { MessageCircle, Clock, Check, MapPin, Package, Calendar, DollarSign, ArrowRight, Trash2 } from 'lucide-react';
import { CountdownTimer } from '../components/CountdownTimer';
import { getDiscountPercentage } from '@/lib/discountCalculator';

interface CustomOrder {
  _id: string;
  orderNumber: string;
  fullName: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone: string;
  address?: string;
  city: string;
  state?: string;
  country?: string;
  description: string;
  designUrl?: string;
  designUrls?: string[];
  quantity?: number;
  deliveryDate?: string;
  proposedDeliveryDate?: string;
  buyerAgreedToDate?: boolean;
  status: "pending" | "approved" | "in-progress" | "ready" | "completed" | "rejected";
  notes?: string;
  quotedPrice?: number;
  productId?: string;
  deadlineDate?: string;
  timerStartedAt?: string;
  timerDurationDays?: number;
  items?: any[];
  // Pricing fields - UNIFIED for both custom and regular orders
  subtotal?: number;
  discountPercentage?: number;
  discountAmount?: number;
  subtotalAfterDiscount?: number;
  vat?: number;
  cautionFee?: number;
  total?: number;
  shippingCost?: number;
  shippingType?: string;
  orderType?: string;
  // Rental fields
  rentalSchedule?: {
    pickupDate: string;
    pickupTime: string;
    returnDate: string;
    pickupLocation: 'iba' | 'surulere';
    rentalDays: number;
  };
  rentalPolicyAgreed?: boolean;
  // Pricing breakdown (alternative structure)
  pricing?: {
    subtotal?: number;
    discount?: number;
    discountPercentage?: number;
    subtotalAfterDiscount?: number;
    tax?: number;
    total?: number;
  };
  createdAt: string;
  updatedAt: string;
}

interface OrderCardProps {
  order: CustomOrder;
  messageCount: { total: number; unread: number };
  onChat: () => void;
  onViewImages: () => void;
}

export function OrderCard({
  order,
  messageCount,
  onChat,
  onViewImages,
}: OrderCardProps) {
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);

  const handleDelete = async () => {
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true);
      return;
    }

    try {
      setIsDeleting(true);
      console.log('[OrderCard] 🗑️ Attempting to delete order:', order._id);
      
      const response = await fetch(`/api/orders/unified/${order._id}`, {
        method: 'DELETE',
      });

      console.log('[OrderCard] Delete response status:', response.status);

      if (!response.ok) {
        const data = await response.json();
        console.error('[OrderCard] Delete error response:', { status: response.status, data });
        throw new Error(data.message || data.error || `Failed to delete order (${response.status})`);
      }

      const deleteResult = await response.json();
      console.log('[OrderCard] ✅ Order deleted:', deleteResult);
      
      // Redirect to dashboard on successful deletion
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 500);
    } catch (error) {
      console.error('[OrderCard] Error deleting order:', error);
      alert(error instanceof Error ? error.message : 'Failed to delete order');
      setShowDeleteConfirm(false);
      setIsDeleting(false);
    }
  };

  const calculateTotal = (order: CustomOrder) => {
    const basePrice = order.quotedPrice || 0;
    const quantity = order.quantity || 1;
    const subtotal = basePrice * quantity;
    const vat = (subtotal * 7.5) / 100;
    return subtotal + vat;
  };

  const getPricingDetails = (order: CustomOrder) => {
    const basePrice = order.quotedPrice || 0;
    const quantity = order.quantity || 1;
    const subtotal = basePrice * quantity;
    
    // For custom orders (which are buy mode), apply discount based on quantity
    const discountPercent = getDiscountPercentage(quantity);
    const discount = subtotal * (discountPercent / 100);
    const subtotalAfterDiscount = subtotal - discount;
    const vat = subtotalAfterDiscount * 0.075;
    const total = subtotalAfterDiscount + vat;
    
    return { quantity, subtotal, discount, discountPercent, subtotalAfterDiscount, vat, total };
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, { badge: string; text: string }> = {
      'pending': { badge: 'bg-yellow-50 text-yellow-700 border-yellow-200', text: 'text-yellow-600' },
      'approved': { badge: 'bg-blue-50 text-blue-700 border-blue-200', text: 'text-blue-600' },
      'in-progress': { badge: 'bg-purple-50 text-purple-700 border-purple-200', text: 'text-purple-600' },
      'ready': { badge: 'bg-green-50 text-green-700 border-green-200', text: 'text-green-600' },
      'shipped': { badge: 'bg-indigo-50 text-indigo-700 border-indigo-200', text: 'text-indigo-600' },
      'completed': { badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', text: 'text-emerald-600' },
      'rejected': { badge: 'bg-red-50 text-red-700 border-red-200', text: 'text-red-600' }
    };
    return colors[status] || colors['pending'];
  };

  const deliveryMethod = order.productId ? 'Pickup' : 'Delivery';
  const statusColors = getStatusColor(order.status);

  return (
    <div
      key={order._id}
      id={`order-${order._id}`}
      className="bg-white rounded-xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden flex flex-col border border-gray-100 hover:border-lime-300 group"
    >
      {/* Header Section */}
      <div className="relative bg-gradient-to-br from-lime-50 via-green-50 to-emerald-50 border-b border-lime-200 px-4 md:px-5 py-4 md:py-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2 mb-2">
              <h3 className="text-lg md:text-xl font-bold text-gray-900">Order #{order.orderNumber}</h3>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold flex-shrink-0 whitespace-nowrap border ${statusColors.badge}`}>
                {order.status === 'pending' && <Clock className="h-3.5 w-3.5" />}
                {order.status === 'completed' && <Check className="h-3.5 w-3.5" />}
                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
              </span>
            </div>
            <p className={`text-xs font-medium ${statusColors.text}`}>Created {new Date(order.createdAt).toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 px-4 md:px-5 py-4 md:py-5 space-y-3">
        {/* Items Section - Show if items exist */}
        {order.items && order.items.length > 0 ? (
          <div>
            <p className="text-xs text-gray-600 font-bold uppercase tracking-wide mb-2">Items Ordered</p>
            <div className="space-y-2">
              {order.items.map((item: any, idx: number) => {
                const itemPrice = item.price || item.unitPrice || 0;
                const itemQuantity = item.quantity || 1;
                const itemTotal = itemPrice * itemQuantity;
                return (
                  <div key={idx} className="bg-white border border-lime-200 rounded-lg p-3">
                    <div className="flex gap-3">
                      {/* Product Image */}
                      <div className="relative aspect-square bg-gray-100 rounded border border-lime-300 overflow-hidden flex-shrink-0 w-16 h-16">
                        {item.image || item.imageUrl ? (
                            <Image
                              src={item.image || item.imageUrl}
                              alt={item.name || 'Product image'}
                              fill
                              className="w-full h-full object-cover"
                              onError={() => {}}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-200">
                              <span className="text-xs text-gray-600">No Image</span>
                            </div>
                          )}
                      </div>
                      {/* Product Details */}
                      <div className="flex-1 flex flex-col gap-2 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-gray-900">{item.name || item.productName || 'Product'}</h4>
                          {/* Mode Badge - ONLY show if mode is explicitly set */}
                          {item.mode === 'rent' && (
                            <span className="text-xs px-2 py-0.5 rounded font-semibold bg-purple-100 text-purple-700 whitespace-nowrap">
                              🔄 RENTAL
                            </span>
                          )}
                          {item.mode === 'buy' && (
                            <span className="text-xs px-2 py-0.5 rounded font-semibold bg-green-100 text-green-700 whitespace-nowrap">
                              🛍️ BUY
                            </span>
                          )}
                          {!item.mode && (
                            <span className="text-xs px-2 py-0.5 rounded font-semibold bg-red-100 text-red-700 whitespace-nowrap">
                              ⚠️ MODE MISSING
                            </span>
                          )}
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-600">Price:</span>
                            <span className="font-semibold text-gray-900">₦{(itemPrice).toLocaleString('en-NG')}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-600">Qty:</span>
                            <span className="font-semibold text-gray-900">{itemQuantity}</span>
                          </div>
                          <div className="flex justify-between text-sm pt-1 border-t border-gray-200">
                            <span className="font-semibold text-gray-700">Subtotal:</span>
                            <span className="font-bold text-lime-700">₦{(itemTotal).toLocaleString('en-NG')}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div>
            <p className="text-xs text-gray-600 font-bold uppercase tracking-wide mb-1.5">Description</p>
            <p className="text-sm text-gray-700 line-clamp-2 leading-relaxed">
              {order.description}
            </p>
          </div>
        )}
        {/* Quick Stats Grid - removed empty pricing fields */}

        {/* Countdown Timer */}
        {order.timerStartedAt && order.deadlineDate && (
          <div className="mt-1">
            <CountdownTimer
              timerStartedAt={order.timerStartedAt}
              deadlineDate={order.deadlineDate}
              status={order.status}
              compact={true}
            />
          </div>
        )}

        {/* Design Images Gallery - Show all design images */}
        {order.designUrls && order.designUrls.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-gray-600 font-bold uppercase tracking-wide">Design Images</p>
            <div className="overflow-x-auto pb-2 -mx-4 md:-mx-5 px-4 md:px-5">
              <div className="flex gap-3 min-w-min">
                {order.designUrls.map((imageUrl, idx) => (
                  <div
                    key={idx}
                    className="relative aspect-square bg-gray-100 rounded-lg border-2 border-lime-200 overflow-hidden flex-shrink-0 w-24 h-24 hover:border-lime-500 transition-colors cursor-pointer shadow-sm hover:shadow-md"
                  >
                    <Image
                      src={imageUrl}
                      alt={`Design ${idx + 1}`}
                      fill
                      className="w-full h-full object-cover"
                      onError={() => {}}
                    />
                  </div>
                ))}
              </div>
            </div>
            <p className="text-xs text-gray-500 text-center">← Scroll to see all designs →</p>
          </div>
        )}

        {/* Admin Notes */}
        {order.notes && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5">
            <p className="text-xs text-amber-700 font-bold uppercase tracking-wide mb-1">Note</p>
            <p className="text-sm text-amber-900 line-clamp-2">{order.notes}</p>
          </div>
        )}
      </div>

      {/* Rental Schedule Section - if rental order */}
      {(order as any).rentalSchedule && (
        <div className="border-t border-gray-200 px-4 md:px-5 py-3 md:py-4 space-y-2 bg-gradient-to-r from-blue-50 to-cyan-50">
          <h4 className="font-semibold text-gray-900 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-600" />
            📅 Rental Schedule
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Pickup Date:</span>
              <span className="font-semibold text-gray-900">{(order as any).rentalSchedule.pickupDate}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Pickup Time:</span>
              <span className="font-semibold text-gray-900">{(order as any).rentalSchedule.pickupTime}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Return Date:</span>
              <span className="font-semibold text-gray-900">{(order as any).rentalSchedule.returnDate}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Rental Duration:</span>
              <span className="font-semibold text-blue-600">{(order as any).rentalSchedule.rentalDays} day{(order as any).rentalSchedule.rentalDays > 1 ? 's' : ''}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Pickup Location:</span>
              <span className="font-semibold text-gray-900 capitalize">{(order as any).rentalSchedule.pickupLocation === 'iba' ? 'Ibafo Branch' : 'Surulere Branch'}</span>
            </div>
            {(order as any).rentalPolicyAgreed && (
              <div className="flex items-center justify-between text-green-700 bg-green-50 px-2 py-1 rounded">
                <span className="text-xs">✅ Rental Policy Agreed</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Pricing Breakdown Section - Display what admin sent */}
      <div className="border-t border-gray-200 px-4 md:px-5 py-3 md:py-4 space-y-2 bg-gradient-to-r from-lime-50 to-green-50">
        {/* Subtotal (Original, before discount) */}
        {(order.subtotal || order.pricing?.subtotal) && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-700">Subtotal:</span>
            <span className="font-semibold text-gray-900">₦{((order.subtotal || order.pricing?.subtotal || 0)).toLocaleString('en-NG')}</span>
          </div>
        )}
        
        {/* 🎁 Discount - Highlight with emoji and green styling (from admin calculation) */}
        {(order.discountPercentage && order.discountPercentage > 0) || order.discountAmount ? (
          <div className="flex items-center justify-between text-sm bg-green-50 px-3 py-2 rounded border border-green-200">
            <span className="text-green-700 font-semibold">🎁 Discount ({order.discountPercentage || 0}%):</span>
            <span className="font-bold text-green-600">-₦{(order.discountAmount || 0).toLocaleString('en-NG')}</span>
          </div>
        ) : null}

        {/* Subtotal After Discount (if discount applied) */}
        {order.subtotalAfterDiscount ? (
          <div className="flex items-center justify-between text-sm font-semibold text-gray-800 bg-white px-3 py-1.5 rounded border border-gray-200">
            <span>Subtotal After Discount:</span>
            <span>₦{(order.subtotalAfterDiscount).toLocaleString('en-NG')}</span>
          </div>
        ) : null}
        
        {/* VAT (7.5%) - Applied to subtotal after discount */}
        {(order.vat !== null && order.vat !== undefined) || (order.pricing?.tax !== null && order.pricing?.tax !== undefined) ? (
          <div className="flex items-center justify-between text-sm border-t border-gray-300 pt-2">
            <span className="text-gray-700 font-semibold">VAT (7.5%):</span>
            <span className="font-bold text-amber-700">₦{((order.vat !== null && order.vat !== undefined ? order.vat : order.pricing?.tax) || 0).toLocaleString('en-NG')}</span>
          </div>
        ) : null}

        {/* Caution Fee - for rental orders (50% of rental subtotal) */}
        {(order as any).cautionFee && (order as any).cautionFee > 0 ? (
          <div className="flex items-center justify-between text-sm bg-orange-50 px-3 py-2 rounded border border-orange-200">
            <span className="text-orange-700 font-semibold">⚠️ Caution Fee (50%):</span>
            <span className="font-bold text-orange-600">₦{((order as any).cautionFee).toLocaleString('en-NG')}</span>
          </div>
        ) : null}

        {/* Total Amount */}
        {order.total || order.pricing?.total ? (
          <div className="flex items-center justify-between text-base border-t-2 border-gray-300 pt-2">
            <span className="font-bold text-gray-900">Total Amount:</span>
            <span className="text-lg font-bold text-green-600">₦{((order.total || order.pricing?.total || 0)).toLocaleString('en-NG')}</span>
          </div>
        ) : null}
      </div>

      {/* Footer - Actions */}
      <div className="border-t border-gray-100 px-4 md:px-5 py-3 md:py-4 bg-gradient-to-r from-gray-50/50 to-lime-50/50 flex items-center gap-3">
        {/* View Images Button */}
        {(order.designUrls && order.designUrls.length > 0) || order.designUrl ? (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onViewImages();
            }}
            className="flex-1 bg-gradient-to-r from-lime-500 to-green-500 hover:from-lime-600 hover:to-green-600 text-white font-semibold py-2.5 px-3 rounded-lg transition-all duration-200 text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span>View Design ({order.designUrls?.length || 1})</span>
          </button>
        ) : null}

        {/* Delete Button */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleDelete();
          }}
          className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 px-4 rounded-lg transition-all duration-200 text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
          title="Delete this order"
        >
          <Trash2 className="w-4 h-4" />
          Delete
        </button>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Order?</h3>
            <p className="text-gray-700 text-sm mb-6">
              Are you sure you want to delete order #{order.orderNumber}? This action cannot be undone.
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
  );
}
