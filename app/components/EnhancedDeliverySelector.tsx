'use client';

import { useState, useCallback } from 'react';
import { Truck, MapPin, AlertCircle, ChevronDown, MapPinPlus, Home } from 'lucide-react';
import { DeliveryQuote } from '@/app/lib/deliveryCalculator';
import { LocationMap } from './LocationMap';

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

const NIGERIAN_STATES = [
  'Lagos',
  'Ogun',
  'Oyo',
  'Osun',
  'Ondo',
  'Ekiti',
  'Kogi',
  'Kwara',
  'Abuja',
];

export function EnhancedDeliverySelector({
  items,
  state: initialState,
  onDeliveryChange,
  isCheckout = false,
}: EnhancedDeliverySelectorProps) {
  const [expanded, setExpanded] = useState(!isCheckout);
  const [vehicleType, setVehicleType] = useState<'bike' | 'car' | 'van'>('car');
  const [isRushDelivery, setIsRushDelivery] = useState(false);
  const [selectedPickupPoint, setSelectedPickupPoint] = useState<string | undefined>();
  const [mapQuote, setMapQuote] = useState<any>(null);
  const [selectedState, setSelectedState] = useState<string>(initialState || 'Lagos');
  const [manualAddress, setManualAddress] = useState<string>('');
  const [useManualAddress, setUseManualAddress] = useState(false);

  // Determine item size from items
  const itemSize =
    items.length > 0
      ? (items[0].size as 'SMALL' | 'MEDIUM' | 'LARGE')
      : 'MEDIUM';

  const isFragile = items.some((item) => item.fragile);

  const handleMapQuoteUpdate = useCallback(
    (quote: any) => {
      setMapQuote(quote);

      // Convert map quote to DeliveryQuote format
      const deliveryQuote: DeliveryQuote = {
        fee: quote.pricing.totalFee,
        vehicle: vehicleType.toUpperCase() as any,
        zone: 'intra_lagos' as any,
        breakdown: {
          zone: 'intra_lagos' as any,
          zoneName: quote.pickupPoint.name,
          requiredVehicle: vehicleType.toUpperCase() as any,
          baseDeliveryFee: quote.pricing.baseFee,
          vehicleFee: quote.pricing.distanceFee,
          sizeFee: 0,
          subtotal: quote.pricing.baseFee + quote.pricing.distanceFee,
          modifiers: [],
          total: quote.pricing.totalFee,
          estimatedDays: {
            min: Math.ceil(quote.deliveryTime.min / 60 / 24),
            max: Math.ceil(quote.deliveryTime.max / 60 / 24),
          },
          breakdown: {
            zone: quote.pricing.baseFee,
            vehicle: quote.pricing.distanceFee,
            size: 0,
            modifiers: 0,
          },
        },
        estimatedDays: {
          min: Math.ceil(quote.deliveryTime.min / 60 / 24),
          max: Math.ceil(quote.deliveryTime.max / 60 / 24),
        },
        warnings: [],
        recommendations: [],
      };

      onDeliveryChange?.(deliveryQuote);
    },
    [vehicleType, items, onDeliveryChange]
  );

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-6 py-4 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 transition"
      >
        <div className="flex items-center gap-3">
          <Truck className="h-5 w-5 text-blue-600" />
          <div className="text-left">
            <h3 className="font-semibold text-gray-900">Real-Time Delivery</h3>
            {mapQuote && (
              <p className="text-sm text-gray-600">
                {mapQuote.distance.formatted} • ₦{mapQuote.pricing.totalFee.toLocaleString()}
              </p>
            )}
          </div>
        </div>
        <ChevronDown
          className={`h-5 w-5 text-gray-600 transition-transform ${
            expanded ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Content */}
      {expanded && (
        <div className="p-6 space-y-6 border-t border-gray-200">
          {/* State Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Delivery State
            </label>
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500 bg-white"
            >
              {NIGERIAN_STATES.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-600 mt-2">
              Selected: <span className="font-semibold">{selectedState}</span>
            </p>
          </div>

          {/* Manual Address Input */}
          <div>
            <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition mb-3">
              <input
                type="checkbox"
                checked={useManualAddress}
                onChange={(e) => setUseManualAddress(e.target.checked)}
                className="w-4 h-4 accent-lime-600 rounded"
              />
              <div className="flex-1">
                <p className="font-medium text-gray-900">Enter Address Manually</p>
                <p className="text-xs text-gray-600">Instead of using GPS location</p>
              </div>
            </label>

            {useManualAddress && (
              <div className="mt-3">
                <textarea
                  value={manualAddress}
                  onChange={(e) => setManualAddress(e.target.value)}
                  placeholder="Enter your delivery address (e.g., 123 Main Street, Lagos, Nigeria)"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500 resize-none"
                  rows={3}
                />
                <p className="text-xs text-gray-600 mt-2">
                  💡 For automatic calculation, please allow GPS access or enter a specific address with coordinates if available
                </p>
              </div>
            )}
          </div>

          {/* Vehicle Type Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Truck className="h-4 w-4" />
              Choose Delivery Method
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                {
                  id: 'bike',
                  name: '🏍️ Bike',
                  desc: 'Fast & Cheap',
                  icon: '🏍️',
                },
                {
                  id: 'car',
                  name: '🚗 Car',
                  desc: 'Balanced',
                  icon: '🚗',
                },
                {
                  id: 'van',
                  name: '🚚 Van',
                  desc: 'Large Items',
                  icon: '🚚',
                },
              ].map((vehicle) => (
                <button
                  key={vehicle.id}
                  onClick={() => setVehicleType(vehicle.id as any)}
                  className={`p-4 rounded-lg border-2 transition text-center ${
                    vehicleType === vehicle.id
                      ? 'border-lime-500 bg-lime-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="text-2xl mb-2">{vehicle.icon}</div>
                  <p className="font-semibold text-sm text-gray-900">{vehicle.name}</p>
                  <p className="text-xs text-gray-600">{vehicle.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Delivery Options */}
          <div className="space-y-3">
            <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition">
              <input
                type="checkbox"
                checked={isRushDelivery}
                onChange={(e) => setIsRushDelivery(e.target.checked)}
                className="w-4 h-4 accent-lime-600 rounded"
              />
              <div className="flex-1">
                <p className="font-medium text-gray-900">Rush Delivery</p>
                <p className="text-xs text-gray-600">50% extra fee, same-day delivery</p>
              </div>
              <span className="text-sm font-semibold text-gray-900">+50%</span>
            </label>

            {isFragile && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-semibold text-amber-900">Fragile Items</p>
                  <p className="text-amber-800">30% extra charge for careful handling</p>
                </div>
              </div>
            )}
          </div>

          {/* Pickup Point Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              <MapPin className="h-4 w-4 inline mr-2" />
              Pickup Point
            </label>
            <div className="space-y-2">
              {[
                {
                  id: 'suru_lere',
                  name: '22 Ejire Street, Suru Lere, Lagos',
                  desc: 'Mainland Lagos',
                },
                {
                  id: 'ojo',
                  name: '22 Chi-Ben Street, Ojo, Lagos',
                  desc: 'Ojo Area',
                },
              ].map((point) => (
                <label
                  key={point.id}
                  className={`flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition ${
                    selectedPickupPoint === point.id
                      ? 'border-lime-500 bg-lime-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="pickup"
                    value={point.id}
                    checked={selectedPickupPoint === point.id}
                    onChange={(e) => setSelectedPickupPoint(e.target.value)}
                    className="w-4 h-4 accent-lime-600"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900">{point.name}</p>
                    <p className="text-xs text-gray-600">{point.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Location Map Component */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              📍 Real-Time Delivery Calculation
            </label>
            <LocationMap
              onQuoteUpdate={handleMapQuoteUpdate}
              vehicleType={vehicleType}
              itemSize={itemSize}
              isFragile={isFragile}
              isRushDelivery={isRushDelivery}
              selectedPickupPoint={selectedPickupPoint}
            />
          </div>

          {/* Info */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-900">
              ℹ️ <span className="font-semibold">How it works:</span> We calculate your delivery fee based on real GPS distance from our pickup points, item size, vehicle type, and your delivery location. You can use GPS location or enter your address manually.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
