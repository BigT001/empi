import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Package, Trash2, Truck, Calendar, Clock, AlertCircle } from 'lucide-react';

interface LogisticsCardProps {
  order: any;
  onMarkShipped: () => void;
  onDelete: () => void;
  formatCurrency: (amount: number) => string;
  isShipped?: boolean;
}

export function LogisticsOrderCard({ order, onMarkShipped, onDelete, formatCurrency, isShipped = false }: LogisticsCardProps) {
  const [expanded, setExpanded] = useState(false);
  
  const userDetails = order.userDetails || {};
  const deliveryDetails = order.deliveryDetails || {};

  // Prioritize deliveryDetails from order, fallback to buyer profile
  const address = deliveryDetails.address || userDetails.address || 'Not provided';
  const city = order.city || userDetails.city || 'Not provided';
  const state = deliveryDetails.state || userDetails.state || 'Not provided';
  const phone = deliveryDetails.phone || userDetails.phone || order.phone || 'Not provided';
  const location = deliveryDetails.location || 'Not specified';
  
  // Helper to get display name
  const getCustomerName = () => {
    return order.fullName || `${order.firstName || ''} ${order.lastName || ''}`.trim() || order.costumeName || 'Unknown Customer';
  };

  return (
    <div className="bg-gradient-to-br from-lime-50 to-green-50 rounded-2xl border-2 border-lime-300 overflow-hidden shadow-md hover:shadow-xl hover:border-lime-400 transition-all flex flex-col">
      {/* Card Header with Customer Name and Order Info */}
      <div className="bg-gradient-to-r from-lime-100 to-green-100 border-b border-lime-300 px-5 py-4">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900">{getCustomerName()}</h3>
            <p className="text-sm text-gray-600 mt-1">Order #{order.orderNumber}</p>
          </div>
          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold whitespace-nowrap">
            {order.status || 'ready'}
          </span>
        </div>
        
        {/* Email in header */}
        <p className="text-sm text-gray-700 font-medium">{order.email || order.customerEmail || 'No email'}</p>
      </div>

      {/* Main Content */}
      <div className="p-5 space-y-3 flex-1 flex flex-col overflow-y-auto">
        {/* Customer Contact Details */}
        <div className="bg-white rounded-lg p-3 border border-lime-200 space-y-2">
          <p className="text-xs font-semibold text-gray-600 uppercase">📞 Contact Information</p>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-gray-500 text-xs font-semibold">Phone</p>
              <p className="font-medium text-gray-900">{order.phone || phone || 'Not provided'}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs font-semibold">Email</p>
              <p className="font-medium text-gray-900 truncate">{order.email || order.customerEmail || 'Not provided'}</p>
            </div>
          </div>
        </div>

        {/* Order Items / Product Details */}
        {order.items && order.items.length > 0 ? (
          <div className="bg-white rounded-lg p-3 border border-lime-200">
            <p className="text-xs font-semibold text-gray-600 uppercase mb-2">📦 Items in Order</p>
            <div className="space-y-2">
              {order.items.map((item: any, idx: number) => (
                <div key={idx} className="flex gap-2 bg-lime-50 rounded p-2 border border-lime-200">
                  {item.imageUrl && (
                    <div className="relative aspect-square bg-gray-100 rounded border border-lime-300 overflow-hidden flex-shrink-0 w-12 h-12">
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-full h-full object-cover"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2">
                      <p className="font-semibold text-gray-900 text-sm">{item.name || item.productName || 'Product'}</p>
                      {item.mode === 'rent' && (
                        <span className="text-xs px-2 py-0.5 rounded bg-purple-100 text-purple-700 border border-purple-300 font-semibold flex-shrink-0 whitespace-nowrap">
                          🔄 RENTAL
                        </span>
                      )}
                      {item.mode === 'buy' && (
                        <span className="text-xs px-2 py-0.5 rounded bg-green-100 text-green-700 border border-green-300 font-semibold flex-shrink-0 whitespace-nowrap">
                          🛍️ BUY
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-600">Qty: {item.quantity || 1} · ₦{(item.price || 0).toLocaleString('en-NG')}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {/* Rental Schedule (if rental order) */}
        {order.rentalSchedule && (
          <div className="bg-blue-50 rounded-lg p-3 border border-blue-300">
            <p className="text-xs font-semibold text-blue-700 uppercase mb-2">📅 Rental Schedule</p>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-700">Pickup Date:</span>
                <span className="font-semibold text-gray-900">{order.rentalSchedule.pickupDate || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">Pickup Time:</span>
                <span className="font-semibold text-gray-900">{order.rentalSchedule.pickupTime || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">Return Date:</span>
                <span className="font-semibold text-gray-900">{order.rentalSchedule.returnDate || 'N/A'}</span>
              </div>
              <div className="flex justify-between pt-1.5 border-t border-blue-200">
                <span className="text-gray-700 font-semibold">Duration:</span>
                <span className="font-bold text-blue-700">{order.rentalSchedule.rentalDays} day{order.rentalSchedule.rentalDays > 1 ? 's' : ''}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">Pickup Location:</span>
                <span className="font-semibold text-gray-900 capitalize">{order.rentalSchedule.pickupLocation === 'iba' ? 'Ibafo' : 'Surulere'}</span>
              </div>
              {order.rentalPolicyAgreed && (
                <div className="flex items-center justify-center text-green-700 bg-green-50 px-2 py-1 rounded text-xs font-semibold border border-green-300 mt-1">
                  ✅ Rental Policy Agreed
                </div>
              )}
            </div>
          </div>
        )}

        {/* Pricing & Fees */}
        {(order.quotedPrice || order.price) && (
          <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
            <p className="text-xs font-semibold text-amber-700 uppercase mb-2">💰 Pricing Breakdown</p>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-700">Subtotal:</span>
                <span className="font-semibold text-gray-900">₦{((order.quotedPrice || order.price || 0)).toLocaleString('en-NG')}</span>
              </div>
              {order.discountAmount && order.discountAmount > 0 && (
                <div className="flex justify-between text-green-700">
                  <span className="font-semibold">Discount ({order.discountPercentage}%):</span>
                  <span className="font-bold">-₦{(order.discountAmount).toLocaleString('en-NG')}</span>
                </div>
              )}
              {order.cautionFee && order.cautionFee > 0 && (
                <div className="flex justify-between border-t border-amber-200 pt-1.5">
                  <span className="text-gray-700 font-semibold">🔒 Caution Fee (50%):</span>
                  <span className="font-bold text-amber-700">₦{(order.cautionFee).toLocaleString('en-NG')}</span>
                </div>
              )}
              {order.vat && order.vat > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-700 font-semibold">VAT (7.5%):</span>
                  <span className="font-bold text-amber-700">₦{(order.vat).toLocaleString('en-NG')}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-amber-300 pt-1.5">
                <span className="font-bold text-gray-900">Total Amount:</span>
                <span className="text-lg font-bold text-amber-700">₦{(order.total || ((order.quotedPrice || order.price || 0) * 1.075 + (order.cautionFee || 0))).toLocaleString('en-NG')}</span>
              </div>
            </div>
          </div>
        )}

        {/* Custom Order Description (if applicable) */}
        {order.description && (
          <div className="bg-white rounded-lg p-3 border border-lime-200">
            <p className="text-xs font-semibold text-gray-600 uppercase mb-2">📝 Description</p>
            <p className="text-sm text-gray-700">{order.description}</p>
            {order.quantity && (
              <p className="text-xs text-gray-600 mt-2">Quantity: <span className="font-semibold">{order.quantity}</span></p>
            )}
          </div>
        )}

        {/* Product Images */}
        {order.designUrls && order.designUrls.length > 0 && (
          <div className="bg-white rounded-lg p-3 border border-lime-200">
            <p className="text-xs font-semibold text-gray-600 uppercase mb-2">🖼️ Product Images</p>
            <div className="grid grid-cols-3 gap-2">
              {order.designUrls.slice(0, 6).map((url: string, idx: number) => (
                <a
                  key={idx}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative aspect-square bg-gray-100 rounded border border-lime-300 overflow-hidden hover:border-lime-600 transition-colors"
                >
                  <img
                    src={url}
                    alt={`Product ${idx + 1}`}
                    className="w-full h-full object-cover hover:scale-105 transition-transform"
                    onError={(e) => { e.currentTarget.src = ''; }}
                  />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Customer Message (if exists) */}
        {order.message && (
          <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
            <p className="text-xs font-semibold text-blue-700 uppercase mb-2">💬 Customer Note</p>
            <p className="text-sm text-gray-700">{order.message}</p>
          </div>
        )}
      </div>

      {/* Expandable User Details Section */}
      <div className="border-t border-lime-200">
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full px-5 py-3 flex items-center justify-between hover:bg-lime-50 transition-colors"
        >
          <span className="text-sm font-semibold text-gray-700">📍 Delivery Details</span>
          {expanded ? (
            <ChevronUp className="w-5 h-5 text-lime-600" />
          ) : (
            <ChevronDown className="w-5 h-5 text-lime-600" />
          )}
        </button>

        {/* Expanded Details */}
        {expanded && (
          <div className="px-5 pb-4 pt-2 space-y-3 border-t border-lime-200 bg-gradient-to-br from-white to-lime-50">
            {/* Address Row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs font-semibold text-gray-600 uppercase">Address</p>
                <p className="text-sm text-gray-900 font-medium">{address}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-600 uppercase">City</p>
                <p className="text-sm text-gray-900 font-medium">{city}</p>
              </div>
            </div>

            {/* State and Location Row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs font-semibold text-gray-600 uppercase">State</p>
                <p className="text-sm text-gray-900 font-medium">{state}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-600 uppercase">Location</p>
                <p className="text-sm text-gray-900 font-medium">{location}</p>
              </div>
            </div>

            {/* Contact Row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs font-semibold text-gray-600 uppercase">Phone</p>
                <p className="text-sm text-gray-900 font-medium">{phone}</p>
              </div>
              {userDetails.postalCode && (
                <div>
                  <p className="text-xs font-semibold text-gray-600 uppercase">Postal Code</p>
                  <p className="text-sm text-gray-900 font-medium">{userDetails.postalCode}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="px-5 py-4 flex gap-2 bg-lime-50 border-t border-lime-200">
        <button
          onClick={onMarkShipped}
          disabled={isShipped}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 font-semibold rounded-lg transition-colors text-sm ${
            isShipped
              ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
              : 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700'
          }`}
        >
          <Truck className="w-4 h-4" />
          {isShipped ? 'Completed' : 'Mark Shipped'}
        </button>
        <button
          onClick={onDelete}
          className="px-4 py-2 bg-red-50 text-red-600 font-semibold rounded-lg hover:bg-red-100 transition-colors"
          title="Delete order"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
