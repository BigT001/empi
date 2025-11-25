'use client';

import { useState, useEffect, useCallback } from 'react';
import { MapPin, Truck, Clock, DollarSign, AlertCircle, Loader } from 'lucide-react';
import {
  PICKUP_POINTS,
  formatDistance,
  formatDeliveryTime,
} from '@/app/lib/distanceCalculator';

interface DeliveryQuoteRequest {
  userLatitude: number;
  userLongitude: number;
  vehicleType: 'bike' | 'car' | 'van';
  itemSize: 'SMALL' | 'MEDIUM' | 'LARGE';
  isFragile: boolean;
  isRushDelivery: boolean;
  pickupPointId?: string;
}

interface DeliveryQuote {
  pickupPoint: {
    id: string;
    name: string;
    address: string;
    coordinates: { latitude: number; longitude: number };
  };
  distance: { km: number; formatted: string };
  deliveryTime: { min: number; max: number; formatted: string };
  pricing: {
    baseFee: number;
    distanceFee: number;
    sizeMultiplier: number;
    fragileMultiplier: number;
    rushMultiplier: number;
    totalFee: number;
    breakdown: string;
  };
  isMainlandLagos: boolean;
}

interface LocationMapProps {
  onQuoteUpdate: (quote: DeliveryQuote) => void;
  vehicleType: 'bike' | 'car' | 'van';
  itemSize: 'SMALL' | 'MEDIUM' | 'LARGE';
  isFragile: boolean;
  isRushDelivery: boolean;
  selectedPickupPoint?: string;
}

export function LocationMap({
  onQuoteUpdate,
  vehicleType,
  itemSize,
  isFragile,
  isRushDelivery,
  selectedPickupPoint,
}: LocationMapProps) {
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [quote, setQuote] = useState<DeliveryQuote | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [address, setAddress] = useState<string>('');

  // Get user's geolocation
  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        });
        setMapReady(true);
        setLoading(false);
      },
      (err) => {
        setError(`Error getting location: ${err.message}`);
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
      }
    );
  }, []);

  // Calculate quote when location or parameters change
  useEffect(() => {
    if (!userLocation) return;

    const calculateQuote = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/delivery/calculate-distance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userLatitude: userLocation.lat,
            userLongitude: userLocation.lon,
            vehicleType,
            itemSize,
            isFragile,
            isRushDelivery,
            pickupPointId: selectedPickupPoint,
          } as DeliveryQuoteRequest),
        });

        if (!response.ok) {
          throw new Error('Failed to calculate delivery');
        }

        const data = await response.json();
        setQuote(data.data);
        onQuoteUpdate(data.data);

        // Reverse geocode to get address (simplified - you'd use Google Maps API for this)
        setAddress(`${userLocation.lat.toFixed(4)}, ${userLocation.lon.toFixed(4)}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    calculateQuote();
  }, [
    userLocation,
    vehicleType,
    itemSize,
    isFragile,
    isRushDelivery,
    selectedPickupPoint,
    onQuoteUpdate,
  ]);

  if (!mapReady) {
    return (
      <div className="bg-gray-100 rounded-lg p-8 flex items-center justify-center min-h-[300px]">
        <div className="text-center">
          <Loader className="h-8 w-8 animate-spin text-lime-600 mx-auto mb-3" />
          <p className="text-gray-600">Getting your location...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Interactive Map Container */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-lg p-6 border-2 border-slate-700 relative overflow-hidden">
        {/* Map Background Grid */}
        <div className="absolute inset-0 opacity-10">
          <div
            className="w-full h-full"
            style={{
              backgroundImage:
                'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)',
              backgroundSize: '40px 40px',
            }}
          ></div>
        </div>

        {/* Map Content */}
        <div className="relative z-10 space-y-6">
          {/* Header */}
          <div className="flex items-center gap-2">
            <div className="h-1 w-8 bg-gradient-to-r from-lime-500 to-blue-500 rounded"></div>
            <p className="text-sm font-semibold text-slate-300 uppercase tracking-wide">
              📍 Live Delivery Route
            </p>
          </div>

          {/* Pickup Point Card */}
          <div className="flex items-start gap-4 bg-gradient-to-r from-lime-50 to-green-50 rounded-lg p-4 shadow-md border border-lime-200">
            <div className="bg-lime-100 rounded-full p-3 flex-shrink-0">
              <MapPin className="h-6 w-6 text-lime-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-lime-700 font-bold uppercase tracking-wide">Pickup Point</p>
              <p className="font-semibold text-gray-900 truncate text-lg">
                {quote?.pickupPoint.name || 'Determining nearest pickup...'}
              </p>
              <p className="text-xs text-gray-700 mt-1">
                {quote?.pickupPoint.address}
              </p>
              {quote && (
                <div className="mt-2 flex items-center gap-2">
                  <span className="inline-block px-2 py-1 bg-lime-200 text-lime-900 text-xs font-semibold rounded">
                    📍 Latitude: {quote.pickupPoint.coordinates.latitude.toFixed(4)}
                  </span>
                  <span className="inline-block px-2 py-1 bg-lime-200 text-lime-900 text-xs font-semibold rounded">
                    Longitude: {quote.pickupPoint.coordinates.longitude.toFixed(4)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Route Visualization */}
          <div className="flex items-center justify-between gap-4 px-4 py-3 bg-blue-900 rounded-lg">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <div className="h-2 flex-1 bg-gradient-to-r from-lime-500 via-blue-500 to-blue-500 rounded-full"></div>
              </div>
              <p className="text-xs text-blue-200 mt-2 text-center font-semibold">
                🚗 Distance: {quote?.distance.formatted || 'Calculating...'} | ⏱️ Time:{' '}
                {quote?.deliveryTime.formatted || 'Calculating...'}
              </p>
            </div>
          </div>

          {/* Delivery Location Card */}
          <div className="flex items-start gap-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 shadow-md border border-blue-200">
            <div className="bg-blue-100 rounded-full p-3 flex-shrink-0">
              <MapPin className="h-6 w-6 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-blue-700 font-bold uppercase tracking-wide">Your Delivery Location</p>
              <p className="font-semibold text-gray-900 truncate text-lg">Your Location</p>
              <p className="text-xs text-gray-700 mt-1 line-clamp-2">{address || 'Getting your location...'}</p>
              {userLocation && (
                <div className="mt-2 flex items-center gap-2">
                  <span className="inline-block px-2 py-1 bg-blue-200 text-blue-900 text-xs font-semibold rounded">
                    📍 Lat: {userLocation.lat.toFixed(4)}
                  </span>
                  <span className="inline-block px-2 py-1 bg-blue-200 text-blue-900 text-xs font-semibold rounded">
                    Lon: {userLocation.lon.toFixed(4)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Quote Details */}
      {quote && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Distance Card */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600 font-medium">Distance</p>
              <MapPin className="h-4 w-4 text-gray-400" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {quote.distance.formatted}
            </p>
          </div>

          {/* Delivery Time Card */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600 font-medium">Est. Time</p>
              <Clock className="h-4 w-4 text-gray-400" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {quote.deliveryTime.formatted}
            </p>
          </div>

          {/* Vehicle Type Card */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600 font-medium">Vehicle</p>
              <Truck className="h-4 w-4 text-gray-400" />
            </div>
            <p className="text-lg font-bold text-gray-900 capitalize">{vehicleType}</p>
            <p className="text-xs text-gray-600 mt-1">Optimal for {itemSize}</p>
          </div>

          {/* Price Card (Highlighted) */}
          <div className="bg-gradient-to-br from-lime-500 to-lime-600 rounded-lg border border-lime-600 p-4 shadow-md hover:shadow-lg transition text-white">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium opacity-90">Total Price</p>
              <DollarSign className="h-4 w-4 opacity-90" />
            </div>
            <p className="text-3xl font-bold">₦{quote.pricing.totalFee.toLocaleString()}</p>
            <p className="text-xs opacity-75 mt-1">Incl. all charges</p>
          </div>
        </div>
      )}

      {/* Price Breakdown */}
      {quote && (
        <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-4">Price Breakdown</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Base Fee</span>
              <span className="font-medium">₦{quote.pricing.baseFee.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">
                Distance ({quote.distance.km}km)
              </span>
              <span className="font-medium">₦{quote.pricing.distanceFee.toLocaleString()}</span>
            </div>
            {quote.pricing.sizeMultiplier > 1 && (
              <div className="flex justify-between items-center">
                <span className="text-gray-600">
                  Size Multiplier ({itemSize})
                </span>
                <span className="font-medium">×{quote.pricing.sizeMultiplier}</span>
              </div>
            )}
            {quote.pricing.fragileMultiplier > 1 && (
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Fragile Item Charge</span>
                <span className="font-medium">×{quote.pricing.fragileMultiplier}</span>
              </div>
            )}
            {quote.pricing.rushMultiplier > 1 && (
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Rush Delivery</span>
                <span className="font-medium">×{quote.pricing.rushMultiplier}</span>
              </div>
            )}
            <div className="border-t border-gray-300 pt-3 flex justify-between items-center font-semibold">
              <span className="text-gray-900">Total</span>
              <span className="text-lg text-lime-600">
                ₦{quote.pricing.totalFee.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Full breakdown text */}
          <div className="mt-4 p-3 bg-white rounded border border-gray-200">
            <p className="text-xs text-gray-600 font-mono">
              {quote.pricing.breakdown}
            </p>
          </div>
        </div>
      )}

      {/* Pickup Point Selection */}
      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
        <h3 className="font-semibold text-gray-900 mb-3">Available Pickup Points</h3>
        <div className="space-y-2">
          {Object.values(PICKUP_POINTS).map((point) => (
            <div
              key={point.id}
              className={`p-3 rounded-lg border-2 cursor-pointer transition ${
                quote?.pickupPoint.id === point.id
                  ? 'border-lime-500 bg-lime-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <p className="font-medium text-gray-900">{point.name}</p>
              <p className="text-xs text-gray-600">{point.address}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <p className="text-sm text-amber-900">
          💡 <span className="font-semibold">Tip:</span> Prices are calculated
          dynamically based on real distance, item size, and vehicle type. Select
          your preferred pickup point to get the best delivery rate.
        </p>
      </div>
    </div>
  );
}
