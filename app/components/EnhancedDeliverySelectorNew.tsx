'use client';

import { useState } from 'react';
import { Truck, ChevronDown } from 'lucide-react';
import { DeliveryModal } from './DeliveryModal';
import { DeliveryQuote } from '@/app/lib/deliveryCalculator';

interface CartItemDelivery {
  id: string;
  name: string;
  quantity: number;
  size: 'SMALL' | 'MEDIUM' | 'LARGE';
  weight: number;
  totalWeight: number;
  fragile: boolean;
}

interface EnhancedDeliverySelectorProps {
  items: CartItemDelivery[];
  state?: string;
  onDeliveryChange?: (quote: DeliveryQuote | null) => void;
  isCheckout?: boolean;
}

export function EnhancedDeliverySelector({
  items,
  onDeliveryChange,
  isCheckout = false,
}: EnhancedDeliverySelectorProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState<{
    state: string;
    vehicle: string;
    address: string;
    fee: number;
    distance: number;
    duration: string;
  } | null>(null);

  const handleDeliveryConfirm = (data: any) => {
    setSelectedDelivery({
      state: data.selectedState,
      vehicle: data.vehicleType,
      address: data.deliveryAddress,
      fee: data.quote.fee,
      distance: data.quote.distance,
      duration: data.quote.duration,
    });

    // Call parent handler with quote data - pass the complete quote object
    if (onDeliveryChange) {
      onDeliveryChange(data.quote);
    }

    setModalOpen(false);
  };

  return (
    <>
      {/* Delivery Selector Button */}
      <button
        onClick={() => setModalOpen(true)}
        className="w-full bg-white border-2 border-gray-200 rounded-xl p-4 hover:border-lime-500 hover:shadow-lg transition-all"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Truck className="h-5 w-5 text-blue-600" />
            <div className="text-left">
              <h3 className="font-semibold text-gray-900">Real-Time Delivery</h3>
              {selectedDelivery && (
                <p className="text-sm text-gray-600">
                  {selectedDelivery.state} • {selectedDelivery.distance.toFixed(1)} km • ₦{selectedDelivery.fee.toLocaleString()}
                </p>
              )}
            </div>
          </div>
          <ChevronDown className="h-5 w-5 text-gray-600" />
        </div>
      </button>

      {/* Display Selected Delivery Info */}
      {selectedDelivery && (
        <div className="mt-4 p-4 bg-gradient-to-r from-lime-50 to-green-50 border border-lime-200 rounded-lg space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">State:</span>
            <span className="font-semibold text-gray-900">{selectedDelivery.state}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Vehicle:</span>
            <span className="font-semibold text-gray-900 capitalize">{selectedDelivery.vehicle}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Distance:</span>
            <span className="font-semibold text-gray-900">{selectedDelivery.distance.toFixed(1)} km</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Est. Time:</span>
            <span className="font-semibold text-gray-900">{selectedDelivery.duration}</span>
          </div>
          <div className="border-t border-lime-200 pt-2 flex items-center justify-between">
            <span className="text-gray-900 font-semibold">Delivery Fee:</span>
            <span className="text-xl font-bold text-lime-600">₦{selectedDelivery.fee.toLocaleString()}</span>
          </div>
        </div>
      )}

      {/* Delivery Modal */}
      <DeliveryModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onConfirm={handleDeliveryConfirm}
        items={items}
      />
    </>
  );
}
