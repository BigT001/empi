'use client';

import React, { useState } from "react";
import Image from "next/image";
import {
  ChevronDown,
  ChevronUp,
  Clock,
  Check,
  AlertCircle,
  FileText,
  Trash2,
  Eye,
  ShoppingBag,
  User,
  MapPin,
  Calendar,
  CreditCard,
  Sparkles,
  ExternalLink
} from "lucide-react";

export interface OrderItem {
  productId?: string;
  name: string;
  quantity: number;
  price: number;
  mode?: 'buy' | 'rent';
  imageUrl?: string;
}

export interface PendingOrderData {
  _id: string;
  orderNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  total: number;
  status: string;
  paymentStatus?: string;
  createdAt: string;
  items?: OrderItem[];
  rentalSchedule?: {
    pickupDate?: string;
    pickupTime?: string;
    returnDate?: string;
    pickupLocation?: 'iba' | 'surulere';
    rentalDays?: number;
  } | null;
  rentalPolicyAgreed?: boolean;
  cautionFee?: number | null;
  // Shipping details
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  // Custom order fields
  isCustomOrder?: boolean;
  description?: string;
  designUrls?: string[];
  quotedPrice?: number;
  quantity?: number;
  requiredQuantity?: number;
  fullName?: string;
  paymentVerified?: boolean;
  paymentProofUrl?: string;
  paymentMethod?: string;
  quoteItems?: Array<{ itemName: string; quantity: number; unitPrice: number }>;
  // Pricing/Discount fields
  subtotal?: number;
  discountPercentage?: number;
  discountAmount?: number;
  subtotalAfterDiscount?: number;
  vat?: number;
}

interface OrdersTableProps {
  orders: PendingOrderData[];
  paymentStatusMap: Record<string, 'pending' | 'paid' | 'approved'>;
  approvingOrderId: string | null;
  productImages: Record<string, { name: string; imageUrl?: string }>;
  loading?: boolean;
  onApprove: (orderId: string) => void;
  onDelete: (orderId: string) => void;
  onOpenConfirmModal: (orderId: string) => void;
  onViewInvoice?: (order: PendingOrderData) => void;
  formatCurrency: (amount: number) => string;
}

export function OrdersTable({
  orders,
  paymentStatusMap,
  approvingOrderId,
  productImages,
  loading = false,
  onApprove,
  onDelete,
  onOpenConfirmModal,
  onViewInvoice,
  formatCurrency,
}: OrdersTableProps) {
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const [selectedProofUrl, setSelectedProofUrl] = useState<string | null>(null);

  const toggleRow = (id: string) => {
    setExpandedRowId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="w-full space-y-4">
      {/* Proof Modal */}
      {selectedProofUrl && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
          onClick={() => setSelectedProofUrl(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-2xl w-full p-6 relative overflow-hidden shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" /> Payment Receipt / Proof
              </h3>
              <button
                onClick={() => setSelectedProofUrl(null)}
                className="p-1 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition"
              >
                ✕
              </button>
            </div>
            <div className="relative w-full h-[60vh] rounded-xl overflow-hidden bg-gray-100 border border-gray-200">
              <Image
                src={selectedProofUrl}
                alt="Payment Proof"
                fill
                className="object-contain"
                unoptimized
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <a
                href={selectedProofUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold rounded-lg text-sm transition flex items-center gap-1.5"
              >
                <ExternalLink className="h-4 w-4" /> Open Full Image
              </a>
              <button
                onClick={() => setSelectedProofUrl(null)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-sm transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Table Container */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50/80 text-gray-700 text-xs font-bold uppercase tracking-wider border-b border-gray-200">
              <tr>
                <th className="py-4 px-4 sm:px-6">Order Details</th>
                <th className="py-4 px-4">Customer</th>
                <th className="py-4 px-4">Date</th>
                <th className="py-4 px-4">Items / Mode</th>
                <th className="py-4 px-4">Payment & Status</th>
                <th className="py-4 px-4 text-right">Total Amount</th>
                <th className="py-4 px-4 text-center">Actions</th>
                <th className="py-4 px-4 text-center">Expand</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-sm">
              {loading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={`skeleton-${idx}`} className="animate-pulse">
                    <td className="py-4 px-4 sm:px-6">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                        <div className="space-y-1.5">
                          <div className="w-24 h-4 bg-gray-200 rounded"></div>
                          <div className="w-16 h-3 bg-gray-150 rounded"></div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="space-y-1.5">
                        <div className="w-28 h-4 bg-gray-200 rounded"></div>
                        <div className="w-36 h-3 bg-gray-150 rounded"></div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="w-20 h-4 bg-gray-200 rounded"></div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-12 h-4 bg-gray-200 rounded"></div>
                        <div className="w-10 h-5 bg-gray-200 rounded-full"></div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="w-24 h-6 bg-gray-200 rounded-full"></div>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="w-20 h-4 bg-gray-200 rounded ml-auto"></div>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <div className="w-16 h-8 bg-gray-200 rounded-lg mx-auto"></div>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <div className="w-6 h-6 bg-gray-200 rounded-full mx-auto"></div>
                    </td>
                  </tr>
                ))
              ) : orders.map((order) => {
                const isExpanded = expandedRowId === order._id;
                const isApproved = order.status === 'approved' || order.status === 'confirmed';
                const statusState = paymentStatusMap[order._id] || (isApproved ? 'approved' : 'pending');
                const isPaid = statusState === 'paid' || statusState === 'approved' || Boolean(order.paymentVerified);
                const isApproving = approvingOrderId === order._id;
                const customerName = `${order.firstName || ''} ${order.lastName || ''}`.trim() || order.fullName || 'Customer';
                
                const itemsCount = order.items?.length || (order.quantity || 1);
                const firstItem = order.items?.[0];
                const firstItemImg = firstItem?.imageUrl || productImages[firstItem?.productId || '']?.imageUrl || order.designUrls?.[0];

                return (
                  <React.Fragment key={order._id}>
                    {/* Collapsed Row */}
                    <tr
                      onClick={() => toggleRow(order._id)}
                      className={`cursor-pointer transition-colors hover:bg-gray-50/80 ${
                        isExpanded ? 'bg-lime-50/20' : ''
                      }`}
                    >
                      {/* Order Details */}
                      <td className="py-4 px-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          <div className={`p-2.5 rounded-xl shrink-0 ${
                            order.isCustomOrder ? 'bg-purple-100 text-purple-700' : 'bg-lime-100 text-lime-700'
                          }`}>
                            {order.isCustomOrder ? <Sparkles className="h-5 w-5" /> : <ShoppingBag className="h-5 w-5" />}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 font-mono tracking-tight text-sm">
                              {order.orderNumber}
                            </p>
                            <span className={`inline-block mt-0.5 px-2 py-0.5 text-[10px] font-extrabold uppercase rounded-full ${
                              order.isCustomOrder
                                ? 'bg-purple-100 text-purple-800'
                                : firstItem?.mode === 'rent'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {order.isCustomOrder ? 'Custom Order' : firstItem?.mode === 'rent' ? 'Rental' : 'Direct Buy'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Customer */}
                      <td className="py-4 px-4">
                        <div>
                          <p className="font-bold text-gray-900">{customerName}</p>
                          <p className="text-xs text-gray-500">{order.email}</p>
                          {order.phone && <p className="text-[11px] text-gray-400 font-mono">{order.phone}</p>}
                        </div>
                      </td>

                      {/* Date */}
                      <td className="py-4 px-4 text-xs text-gray-600 whitespace-nowrap">
                        {new Date(order.createdAt).toLocaleDateString('en-NG', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                        <p className="text-[10px] text-gray-400">
                          {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </td>

                      {/* Items / Mode */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          {firstItemImg ? (
                            <div className="relative w-9 h-9 rounded-lg overflow-hidden border border-gray-200 shrink-0 bg-gray-100">
                              <Image src={firstItemImg} alt="Product" fill className="object-cover" unoptimized />
                            </div>
                          ) : (
                            <div className="w-9 h-9 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-400 text-xs shrink-0">
                              🛒
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-xs text-gray-900 line-clamp-1">
                              {firstItem?.name || order.description || `${itemsCount} item(s)`}
                            </p>
                            <p className="text-[11px] text-gray-500 font-semibold">
                              {itemsCount} {itemsCount === 1 ? 'item' : 'items'}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Payment & Status */}
                      <td className="py-4 px-4">
                        <div className="space-y-1">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold uppercase rounded-full ${
                            isApproved || isPaid
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-amber-100 text-amber-800 border border-amber-300'
                          }`}>
                            {isApproved ? (
                              <><Check className="h-3 w-3" /> Approved</>
                            ) : isPaid ? (
                              <><Check className="h-3 w-3" /> Paid (Pending)</>
                            ) : (
                              <><Clock className="h-3 w-3" /> Unpaid / Pending</>
                            )}
                          </span>
                          <p className="text-[10px] font-bold text-gray-500 uppercase">
                            {order.paymentMethod === 'manual' ? 'Bank Transfer' : 'Online Payment'}
                          </p>
                        </div>
                      </td>

                      {/* Total Amount */}
                      <td className="py-4 px-4 text-right">
                        <p className="font-extrabold text-base text-gray-900">
                          {formatCurrency(order.total)}
                        </p>
                        {order.vat !== undefined && order.vat > 0 ? (
                          <p className="text-[10px] text-gray-500">Includes ₦{Math.round(order.vat).toLocaleString()} VAT</p>
                        ) : (
                          <p className="text-[10px] text-emerald-600 font-semibold">VAT Exempt (0%)</p>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1.5">
                          {!isApproved && (
                            <button
                              onClick={() => onOpenConfirmModal(order._id)}
                              disabled={isApproving}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold text-white transition flex items-center gap-1 shadow-xs ${
                                isPaid || (order.paymentMethod === 'manual' && order.paymentProofUrl)
                                  ? 'bg-emerald-600 hover:bg-emerald-700'
                                  : 'bg-amber-500 hover:bg-amber-600'
                              }`}
                            >
                              <Check className="h-3.5 w-3.5" />
                              {isApproving ? 'Approving...' : isPaid ? 'Approve' : 'Confirm'}
                            </button>
                          )}

                          {onViewInvoice && (
                            <button
                              onClick={() => onViewInvoice(order)}
                              className="p-1.5 rounded-lg bg-gray-100 hover:bg-blue-100 text-gray-700 hover:text-blue-700 transition"
                              title="View Invoice"
                            >
                              <FileText className="h-4 w-4" />
                            </button>
                          )}

                          <button
                            onClick={() => onDelete(order._id)}
                            className="p-1.5 rounded-lg bg-gray-100 hover:bg-red-100 text-gray-700 hover:text-red-700 transition"
                            title="Delete Order"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>

                      {/* Expand Toggle */}
                      <td className="py-4 px-4 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleRow(order._id);
                          }}
                          className="p-1.5 rounded-full hover:bg-gray-200 text-gray-500 hover:text-gray-900 transition"
                        >
                          {isExpanded ? <ChevronUp className="h-5 w-5 text-lime-600" /> : <ChevronDown className="h-5 w-5" />}
                        </button>
                      </td>
                    </tr>

                    {/* Expanded Inline Drawer */}
                    {isExpanded && (
                      <tr className="bg-gray-50/90 border-b border-gray-200">
                        <td colSpan={8} className="p-6">
                          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-xs space-y-6">
                            {/* Drawer Header */}
                            <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4 border-gray-100">
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="font-bold text-lg text-gray-900">
                                    Order #{order.orderNumber}
                                  </h4>
                                  <span className={`px-2.5 py-0.5 text-xs font-bold uppercase rounded-full ${
                                    isApproved ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                                  }`}>
                                    Status: {order.status.toUpperCase()}
                                  </span>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                  Placed on {new Date(order.createdAt).toLocaleString()}
                                </p>
                              </div>

                              <div className="flex items-center gap-2">
                                {order.paymentProofUrl && (
                                  <button
                                    onClick={() => setSelectedProofUrl(order.paymentProofUrl || null)}
                                    className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                                  >
                                    <Eye className="h-4 w-4" /> View Payment Receipt
                                  </button>
                                )}

                                {!isApproved && (
                                  <button
                                    onClick={() => onOpenConfirmModal(order._id)}
                                    disabled={isApproving}
                                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                                  >
                                    <Check className="h-4 w-4" /> Approve & Fulfill Order
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Two-Column Detail Grid */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                              {/* Left Column: Products List (2 cols) */}
                              <div className="lg:col-span-2 space-y-4">
                                <h5 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                                  <ShoppingBag className="h-4 w-4 text-lime-600" /> Products Ordered ({itemsCount})
                                </h5>

                                {order.items && order.items.length > 0 ? (
                                  <div className="space-y-3">
                                    {order.items.map((item, idx) => {
                                      const img = item.imageUrl || productImages[item.productId || '']?.imageUrl;
                                      return (
                                        <div
                                          key={idx}
                                          className="flex items-center justify-between p-3.5 bg-gray-50 rounded-xl border border-gray-200"
                                        >
                                          <div className="flex items-center gap-3">
                                            {img ? (
                                              <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-gray-200 shrink-0 bg-white">
                                                <Image src={img} alt={item.name} fill className="object-cover" unoptimized />
                                              </div>
                                            ) : (
                                              <div className="w-12 h-12 rounded-lg bg-gray-200 flex items-center justify-center text-gray-400 font-bold shrink-0">
                                                📦
                                              </div>
                                            )}
                                            <div>
                                              <p className="font-bold text-sm text-gray-900">{item.name}</p>
                                              <div className="flex items-center gap-2 mt-0.5">
                                                <span className={`px-2 py-0.5 text-[10px] font-black uppercase rounded-full ${
                                                  item.mode === 'rent' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                                                }`}>
                                                  {item.mode === 'rent' ? 'Rent' : 'Buy'}
                                                </span>
                                                <span className="text-xs text-gray-500">Qty: {item.quantity}</span>
                                                <span className="text-xs text-gray-500">@ {formatCurrency(item.price)}</span>
                                              </div>
                                            </div>
                                          </div>
                                          <p className="font-extrabold text-sm text-gray-900">
                                            {formatCurrency(item.price * item.quantity)}
                                          </p>
                                        </div>
                                      );
                                    })}
                                  </div>
                                ) : order.isCustomOrder ? (
                                  <div className="p-4 bg-purple-50 rounded-xl border border-purple-200 space-y-2">
                                    <p className="text-xs font-bold text-purple-900">Custom Order Description:</p>
                                    <p className="text-xs text-purple-800 leading-relaxed">{order.description || "Custom costume commission request."}</p>
                                    {order.designUrls && order.designUrls.length > 0 && (
                                      <div className="pt-2 flex gap-2 overflow-x-auto">
                                        {order.designUrls.map((url, i) => (
                                          <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="relative w-16 h-16 rounded-lg overflow-hidden border border-purple-300 shrink-0">
                                            <Image src={url} alt="Design reference" fill className="object-cover" unoptimized />
                                          </a>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <p className="text-xs text-gray-500 italic p-4 bg-gray-50 rounded-xl">No explicit line items recorded.</p>
                                )}

                                {/* Rental Schedule (If applicable) */}
                                {order.rentalSchedule && (
                                  <div className="p-4 bg-amber-50/80 rounded-xl border border-amber-200 space-y-2 text-xs">
                                    <h6 className="font-bold text-amber-900 flex items-center gap-1.5">
                                      <Calendar className="h-4 w-4 text-amber-700" /> Rental Schedule Details
                                    </h6>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-amber-950">
                                      <div><span className="text-amber-700">Pickup Date:</span> {order.rentalSchedule.pickupDate || 'N/A'}</div>
                                      <div><span className="text-amber-700">Return Date:</span> {order.rentalSchedule.returnDate || 'N/A'}</div>
                                      <div><span className="text-amber-700">Rental Days:</span> {order.rentalSchedule.rentalDays || 1} day(s)</div>
                                      <div><span className="text-amber-700">Location:</span> {(order.rentalSchedule.pickupLocation || '').toUpperCase()}</div>
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Right Column: Pricing & Customer Summary (1 col) */}
                              <div className="space-y-4">
                                {/* Pricing breakdown box */}
                                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
                                  <h5 className="font-bold text-sm text-gray-900 border-b pb-2">Financial Breakdown</h5>
                                  
                                  <div className="space-y-1.5 text-xs text-gray-600">
                                    <div className="flex justify-between">
                                      <span>Items Subtotal:</span>
                                      <span className="font-semibold text-gray-900">{formatCurrency(order.subtotal || order.total)}</span>
                                    </div>

                                    {order.discountAmount !== undefined && order.discountAmount > 0 && (
                                      <div className="flex justify-between text-emerald-700 font-medium">
                                        <span>Discount ({order.discountPercentage || 0}%):</span>
                                        <span>-₦{Math.round(order.discountAmount).toLocaleString()}</span>
                                      </div>
                                    )}

                                    <div className="flex justify-between">
                                      <span>VAT Tax ({order.vat !== undefined && order.vat > 0 ? "7.5%" : "0% Disabled"}):</span>
                                      <span className="font-semibold text-gray-900">
                                        {order.vat !== undefined ? `₦${Math.round(order.vat).toLocaleString()}` : "₦0"}
                                      </span>
                                    </div>

                                    {order.cautionFee !== undefined && order.cautionFee !== null && order.cautionFee > 0 && (
                                      <div className="flex justify-between text-amber-800 font-medium">
                                        <span>Caution Fee (Refundable):</span>
                                        <span>₦{Math.round(order.cautionFee).toLocaleString()}</span>
                                      </div>
                                    )}

                                    <div className="flex justify-between pt-2 border-t border-gray-200 text-sm font-extrabold text-gray-900">
                                      <span>Total Payable:</span>
                                      <span className="text-lime-700">{formatCurrency(order.total)}</span>
                                    </div>
                                  </div>
                                </div>

                                {/* Customer Info Box */}
                                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-2 text-xs">
                                  <h5 className="font-bold text-sm text-gray-900 flex items-center gap-1.5 border-b pb-2">
                                    <User className="h-4 w-4 text-blue-600" /> Customer & Shipping Info
                                  </h5>
                                  <p className="font-semibold text-gray-900">{customerName}</p>
                                  <p className="text-gray-600">{order.email}</p>
                                  <p className="text-gray-600">{order.phone || 'No phone provided'}</p>

                                  {(order.address || order.city || order.state) && (
                                    <div className="pt-2 border-t border-gray-200 flex items-start gap-1 text-gray-700">
                                      <MapPin className="h-3.5 w-3.5 text-red-500 shrink-0 mt-0.5" />
                                      <span>
                                        {[order.address, order.city, order.state, order.country].filter(Boolean).join(', ')}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
