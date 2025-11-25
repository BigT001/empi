"use client";

import { useState, useEffect } from "react";
import { Truck, MapPin, AlertCircle, ChevronDown, Info } from "lucide-react";
import {
  VehicleType,
  DeliveryZone,
  VEHICLE_CONFIGS,
  DELIVERY_ZONES,
  STATE_TO_ZONE,
} from "../lib/deliverySystem";
import {
  calculateDeliveryFee,
  getDeliveryZone,
  formatDeliveryFee,
  getEstimatedDeliveryTime,
  CartItemDelivery,
  DeliveryQuote,
} from "../lib/deliveryCalculator";

interface DeliverySelectorProps {
  items: CartItemDelivery[];
  state?: string;
  onDeliveryChange?: (quote: DeliveryQuote | null) => void;
  isCheckout?: boolean;
}

export function DeliverySelector({
  items,
  state: initialState,
  onDeliveryChange,
  isCheckout = false,
}: DeliverySelectorProps) {
  const [state, setState] = useState(initialState || "");
  const [quote, setQuote] = useState<DeliveryQuote | null>(null);
  const [expanded, setExpanded] = useState(!isCheckout); // Expanded by default on cart page
  const [distanceKm, setDistanceKm] = useState(10);
  const [rushDelivery, setRushDelivery] = useState(false);
  const [weekendDelivery, setWeekendDelivery] = useState(false);

  // Calculate delivery fee when state or options change
  useEffect(() => {
    if (state && items.length > 0) {
      const newQuote = calculateDeliveryFee(state, items, {
        distanceKm,
        rushDelivery,
        weekendDelivery,
      });
      setQuote(newQuote);
      onDeliveryChange?.(newQuote);
    }
  }, [state, items, distanceKm, rushDelivery, weekendDelivery, onDeliveryChange]);

  const zone = state ? getDeliveryZone(state) : null;
  const zoneConfig = zone ? DELIVERY_ZONES[zone] : null;
  const vehicleConfig = quote ? VEHICLE_CONFIGS[quote.vehicle] : null;

  const availableStates = Object.keys(STATE_TO_ZONE);

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-6 py-4 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 transition"
      >
        <div className="flex items-center gap-3">
          <Truck className="h-5 w-5 text-blue-600" />
          <div className="text-left">
            <h3 className="font-semibold text-gray-900">Delivery Method</h3>
            {quote && (
              <p className="text-sm text-gray-600">
                {vehicleConfig?.icon} {vehicleConfig?.name} • {formatDeliveryFee(quote.fee)}
              </p>
            )}
          </div>
        </div>
        <ChevronDown
          className={`h-5 w-5 text-gray-600 transition-transform ${
            expanded ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Content */}
      {expanded && (
        <div className="p-6 space-y-6 border-t border-gray-200">
          {/* State Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              <MapPin className="h-4 w-4 inline mr-2" />
              Delivery State
            </label>
            <select
              value={state}
              onChange={(e) => setState(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            >
              <option value="">Select your state...</option>
              {availableStates.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Zone Information */}
          {zone && zoneConfig && (
            <div className="bg-blue-50 rounded-lg border border-blue-200 p-4 space-y-3">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">{zoneConfig.name}</h4>
                  <p className="text-sm text-gray-700 mt-1">{zoneConfig.description}</p>
                  <p className="text-xs text-gray-600 mt-2">
                    Estimated Delivery: {getEstimatedDeliveryTime(zone)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Distance Input (for testing) */}
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="text-sm font-semibold text-gray-900 block mb-2">
                Estimated Distance: {distanceKm} km
              </label>
              <input
                type="range"
                min="1"
                max="200"
                value={distanceKm}
                onChange={(e) => setDistanceKm(Number(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-600 mt-2">
                <span>1 km</span>
                <span>200 km</span>
              </div>
            </div>
          </div>

          {/* Special Options */}
          <div className="space-y-3 border-t border-gray-200 pt-4">
            <h4 className="font-semibold text-gray-900 text-sm">Delivery Options</h4>

            {zone &&
              [DeliveryZone.INTRA_LAGOS, DeliveryZone.LAGOS_METRO].includes(zone) && (
                <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-gray-50 transition">
                  <input
                    type="checkbox"
                    checked={rushDelivery}
                    onChange={(e) => setRushDelivery(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded"
                  />
                  <div>
                    <div className="font-medium text-gray-900">Rush Delivery</div>
                    <div className="text-xs text-gray-600">Same-day delivery (before 6 PM)</div>
                  </div>
                  <span className="ml-auto text-sm font-semibold text-orange-600">+50%</span>
                </label>
              )}

            <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-gray-50 transition">
              <input
                type="checkbox"
                checked={weekendDelivery}
                onChange={(e) => setWeekendDelivery(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded"
              />
              <div>
                <div className="font-medium text-gray-900">Weekend Delivery</div>
                <div className="text-xs text-gray-600">Saturday or Sunday delivery</div>
              </div>
              <span className="ml-auto text-sm font-semibold text-orange-600">+30%</span>
            </label>
          </div>

          {/* Warnings */}
          {quote?.warnings && quote.warnings.length > 0 && (
            <div className="bg-yellow-50 rounded-lg border border-yellow-200 p-4 space-y-2">
              {quote.warnings.map((warning, i) => (
                <div key={i} className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-yellow-800">{warning}</p>
                </div>
              ))}
            </div>
          )}

          {/* Quote Breakdown */}
          {quote && (
            <div className="bg-gray-50 rounded-lg p-4 space-y-3 border-t border-gray-200 pt-4">
              <h4 className="font-semibold text-gray-900 text-sm">Fee Breakdown</h4>

              <div className="space-y-2 text-sm">
                {quote.breakdown.breakdown.zone > 0 && (
                  <div className="flex justify-between text-gray-700">
                    <span>Zone Base Fee</span>
                    <span>{formatDeliveryFee(quote.breakdown.breakdown.zone)}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-700">
                  <span>
                    Vehicle ({vehicleConfig?.icon} {vehicleConfig?.name})
                  </span>
                  <span>{formatDeliveryFee(quote.breakdown.breakdown.vehicle)}</span>
                </div>
                {quote.breakdown.breakdown.size > 0 && (
                  <div className="flex justify-between text-gray-700">
                    <span>Size/Weight Adjustment</span>
                    <span>{formatDeliveryFee(quote.breakdown.breakdown.size)}</span>
                  </div>
                )}

                {quote.breakdown.modifiers.map((mod, i) => (
                  <div key={i} className="flex justify-between text-orange-600">
                    <span>{mod.name}</span>
                    <span>+{formatDeliveryFee(mod.amount)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-300 pt-3 flex justify-between font-bold text-gray-900">
                <span>Total Delivery Fee</span>
                <span className="text-lg text-blue-600">{formatDeliveryFee(quote.fee)}</span>
              </div>

              <p className="text-xs text-gray-600 pt-2">
                Estimated delivery: {quote.estimatedDays.min}-{quote.estimatedDays.max} days
              </p>
            </div>
          )}

          {/* Recommendations */}
          {quote?.recommendations && quote.recommendations.length > 0 && (
            <div className="bg-green-50 rounded-lg border border-green-200 p-4 space-y-2">
              <h4 className="font-semibold text-green-900 text-sm">Tips to Save</h4>
              {quote.recommendations.map((rec, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">💡</span>
                  <p className="text-sm text-green-800">{rec}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
