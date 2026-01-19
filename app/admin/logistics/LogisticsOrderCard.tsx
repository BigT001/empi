import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Package, Trash2, Truck } from 'lucide-react';

interface LogisticsCardProps {
  order: any;
  onMarkShipped: () => void;
  onDelete: () => void;
  formatCurrency: (amount: number) => string;
}

export function LogisticsOrderCard({ order, onMarkShipped, onDelete, formatCurrency }: LogisticsCardProps) {
  const [expanded, setExpanded] = useState(false);
  
  const userDetails = order.userDetails || {};
  const deliveryDetails = order.deliveryDetails || {};

  // Prioritize deliveryDetails from order, fallback to buyer profile
  const address = deliveryDetails.address || userDetails.address || 'Not provided';
  const city = order.city || userDetails.city || 'Not provided';
  const state = deliveryDetails.state || userDetails.state || 'Not provided';
  const phone = deliveryDetails.phone || userDetails.phone || order.phone || 'Not provided';
  const location = deliveryDetails.location || 'Not specified';

  return (
    <div className="bg-gradient-to-br from-lime-50 to-green-50 rounded-2xl border-2 border-lime-300 overflow-hidden shadow-md hover:shadow-xl hover:border-lime-400 transition-all flex flex-col">
      {/* Card Header */}
      <div className="bg-gradient-to-r from-lime-100 to-green-100 border-b border-lime-300 px-5 py-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900">{order.orderNumber}</h3>
            <p className="text-sm text-gray-600 mt-1">{order.fullName || 'Unknown'}</p>
          </div>
          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
            {order.status || 'ready'}
          </span>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-5 space-y-4 flex-1 flex flex-col">
        {/* Order Details */}
        <div className="bg-white rounded-lg p-3 border border-lime-200 space-y-2">
          <p className="text-xs font-semibold text-gray-600 uppercase">Order Details</p>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-gray-500 text-xs">Email</p>
              <p className="font-medium text-gray-900">{order.email}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs">Phone</p>
              <p className="font-medium text-gray-900">{order.phone}</p>
            </div>
          </div>
        </div>

        {/* Custom Order Details */}
        {order.description && (
          <div className="bg-white rounded-lg p-3 border border-lime-200 space-y-2">
            <p className="text-xs font-semibold text-gray-600 uppercase">Design</p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-gray-500 text-xs">Description</p>
                <p className="font-medium text-gray-900 text-sm line-clamp-2">{order.description}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">Quantity</p>
                <p className="font-medium text-gray-900">{order.quantity || 1}</p>
              </div>
            </div>
          </div>
        )}

        {/* Design Images */}
        {order.designUrls && order.designUrls.length > 0 && (
          <div className="bg-white rounded-lg p-3 border border-lime-200">
            <p className="text-xs font-semibold text-gray-600 uppercase mb-2">Design Images</p>
            <div className="grid grid-cols-3 gap-2">
              {order.designUrls.slice(0, 3).map((url: string, idx: number) => (
                <a
                  key={idx}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative aspect-square bg-gray-100 rounded border border-lime-300 overflow-hidden hover:border-lime-600 transition-colors"
                >
                  <img
                    src={url}
                    alt={`Design ${idx + 1}`}
                    className="w-full h-full object-cover hover:scale-105 transition-transform"
                  />
                </a>
              ))}
            </div>
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
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-lg hover:from-green-700 hover:to-emerald-700 transition-colors text-sm"
        >
          <Truck className="w-4 h-4" />
          Mark Shipped
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
