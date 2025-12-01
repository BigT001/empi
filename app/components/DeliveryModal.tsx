'use client';

import { useState, useEffect } from 'react';
import {
  X,
  MapPin,
  Truck,
  Clock,
  DollarSign,
  Loader,
  AlertCircle,
  Navigation,
  CheckCircle,
} from 'lucide-react';
import { geocodeAddress, isWithinLagos } from '@/app/lib/geocoder';
import { getLGAsByState } from '@/app/lib/lga-utils';
import lgaData from '@/app/data/nigerian-lgas.json';

interface DeliveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: any) => void;
  items: any[];
}

interface NigerianState {
  name: string;
  code: string;
  coordinates: { latitude: number; longitude: number };
  capital: string;
  region?: string;
}

interface DeliveryQuote {
  distance: number;
  duration: string;
  fee: number;
  pickupPoint: {
    name: string;
    address: string;
    coordinates: { latitude: number; longitude: number };
  };
  deliveryPoint: {
    address: string;
    coordinates: { latitude: number; longitude: number };
  };
  breakdown?: {
    zone: number;
    vehicle: number;
    distance: number;
  };
  modifiers?: Array<{
    name: string;
    amount: number;
  }>;
  warnings?: string[];
  recommendations?: string[];
}

export function DeliveryModal({
  isOpen,
  onClose,
  onConfirm,
  items,
}: DeliveryModalProps) {
  // Pickup Location - Fixed
  const pickupLocation = {
    name: '22 Ejire Street',
    address: '22 Ejire Street, Surulere, Lagos 101281',
    coordinates: { latitude: 6.5089, longitude: 3.3626 },
    priceAdjustment: 0,
  };

  const [states, setStates] = useState<NigerianState[]>([]);
  const [selectedState, setSelectedState] = useState<NigerianState | null>(null);
  const [availableLGAs, setAvailableLGAs] = useState<string[]>([]);
  const [selectedLGA, setSelectedLGA] = useState<string>('');
  const [vehicleType, setVehicleType] = useState<'bike' | 'car' | 'van'>('car');
  const [manualAddress, setManualAddress] = useState<string>('');
  const [deliveryCoordinates, setDeliveryCoordinates] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [geocodingLoading, setGeocodingLoading] = useState(false);
  const [quote, setQuote] = useState<DeliveryQuote | null>(null);
  const [error, setError] = useState<string | null>(null);

  const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  const mapContainerStyle = {
    width: '100%',
    height: '400px',
    borderRadius: '12px',
  };

  const defaultCenter = {
    lat: 6.5244,
    lng: 3.3662,
  };

  // Fetch Nigerian states on component mount
  useEffect(() => {
    if (!isOpen) return;

    // Use hardcoded states from JSON
    try {
      setLoading(true);
      // Convert LGA data states to NigerianState format
      const hardcodedStates: NigerianState[] = lgaData.states.map((state: any) => ({
        name: state.name,
        code: state.code,
        coordinates: { latitude: 6.5244, longitude: 3.3662 }, // Default to Lagos
        capital: '', // Not needed - removed
        region: 'Nigeria',
      }));

      setStates(hardcodedStates);

      // Set default state to Lagos
      const lagosState = hardcodedStates.find((s) => s.name === 'Lagos State');
      if (lagosState) {
        setSelectedState(lagosState);
      }
      setLoading(false);
    } catch (err) {
      setError('Failed to load states. Please try again.');
      console.error('Error loading states:', err);
      setLoading(false);
    }
  }, [isOpen]);

  // Update available LGAs when selected state changes
  useEffect(() => {
    if (selectedState) {
      const lgas = getLGAsByState(selectedState.name);
      setAvailableLGAs(lgas);
      setSelectedLGA(''); // Reset LGA selection when state changes
    } else {
      setAvailableLGAs([]);
      setSelectedLGA('');
    }
  }, [selectedState]);

  // Auto-geocode address when it changes
  useEffect(() => {
    if (!manualAddress || manualAddress.length < 5) {
      setDeliveryCoordinates(null);
      return;
    }

    const geocodeAddressDebounced = async () => {
      try {
        setGeocodingLoading(true);
        const result = await geocodeAddress(manualAddress);
        
        if (result) {
          setDeliveryCoordinates({
            latitude: result.latitude,
            longitude: result.longitude,
          });
          setError(null);
        } else {
          setDeliveryCoordinates(null);
          setError('Could not find this address. Please check and try again.');
        }
      } catch (err) {
        console.error('Geocoding error:', err);
        setError('Error processing address');
      } finally {
        setGeocodingLoading(false);
      }
    };

    // Debounce the geocoding call - wait 500ms after user stops typing
    const timer = setTimeout(geocodeAddressDebounced, 500);
    return () => clearTimeout(timer);
  }, [manualAddress]);

  // Calculate delivery quote when address is geocoded
  useEffect(() => {
    if (!deliveryCoordinates || !selectedState) return;

    const calculateQuote = async () => {
      try {
        setLoading(true);

        // Call the delivery calculation API with geocoded coordinates
        const response = await fetch('/api/delivery/calculate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pickupCoordinates: pickupLocation.coordinates,
            deliveryCoordinates,
            vehicleType,
            address: manualAddress,
            pickupLocationFee: pickupLocation.priceAdjustment,
            state: selectedState.name,
          }),
        });

        if (!response.ok) throw new Error('Failed to calculate delivery');

        const quoteData = await response.json();
        setQuote(quoteData);
        setError(null);
      } catch (err) {
        setError('Failed to calculate delivery fee');
        console.error('Error calculating quote:', err);
      } finally {
        setLoading(false);
      }
    };

    calculateQuote();
  }, [deliveryCoordinates, selectedState, vehicleType]);

  const handleConfirm = () => {
    if (!selectedState || !quote) {
      setError('Please complete all required fields');
      return;
    }

    onConfirm({
      selectedState: selectedState.name,
      selectedLGA: selectedLGA || 'Not specified',
      vehicleType,
      deliveryAddress: manualAddress,
      deliveryCoordinates,
      pickupLocation: {
        name: pickupLocation.name,
        address: pickupLocation.address,
        coordinates: pickupLocation.coordinates,
        priceAdjustment: pickupLocation.priceAdjustment,
      },
      quote,
    });
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/20 backdrop-blur-md z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[95vh] overflow-y-auto relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button - Positioned in top-right */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 z-10 p-2 hover:bg-gray-100 rounded-full transition"
        >
          <X className="h-6 w-6 text-gray-500 hover:text-gray-700" />
        </button>

        {/* Content */}
        <div className="p-8 space-y-6">
          {/* Header */}
          <div className="space-y-2">
            <h2 className="text-3xl font-bold text-gray-900">Delivery Details</h2>
            <p className="text-sm text-gray-600">Fill in your delivery information to get a real-time quote</p>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-red-800 text-sm font-medium">Error</p>
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            </div>
            )}

          <div className="space-y-6">
            {/* Form Content */}
            <div className="space-y-6">
              {/* Location Selection Section */}
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-6 border border-blue-100 space-y-5">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-blue-600" />
                  📍 Location Information
                </h3>

                {/* State Selection */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">
                    State
                  </label>
                  {loading ? (
                    <div className="flex items-center gap-2 text-gray-600 py-3">
                      <Loader className="h-4 w-4 animate-spin" />
                      <span className="text-sm">Loading states...</span>
                    </div>
                  ) : (
                    <select
                      value={selectedState?.name || ''}
                      onChange={(e) => {
                        const state = states.find((s) => s.name === e.target.value);
                        setSelectedState(state || null);
                      }}
                      className="w-full px-4 py-3 border-2 border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 font-medium transition"
                    >
                      <option value="">Select a state...</option>
                      {states.map((state) => (
                        <option key={state.name} value={state.name}>
                          {state.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Local Government Area (LGA) Selection */}
                {selectedState && (
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">
                      Local Government Area (LGA)
                    </label>
                    <select
                      value={selectedLGA}
                      onChange={(e) => setSelectedLGA(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 font-medium transition"
                    >
                      <option value="">Select an LGA...</option>
                      {availableLGAs.map((lga) => (
                        <option key={lga} value={lga}>
                          {lga}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Pickup Location - Fixed */}
                <div className="bg-white rounded-lg p-4 border-2 border-lime-200">
                  <div className="text-xs font-bold text-gray-600 mb-2 uppercase tracking-wide">Pickup Location</div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-lime-600" />
                      <div className="font-bold text-gray-900">{pickupLocation.name}</div>
                    </div>
                    <div className="text-sm text-gray-600 ml-6">{pickupLocation.address}</div>
                  </div>
                </div>

                {/* Nearest Bus Stop (under pickup) */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">
                    🚌 Nearest Bus Stop (Optional)
                  </label>
                  <textarea
                    placeholder="e.g., Lekki Phase 1 Bus Stop, near Chevron roundabout..."
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent bg-white text-gray-900 transition resize-none"
                    rows={2}
                  />
                  <p className="text-xs text-gray-600 mt-1">Helps our driver find you more easily</p>
                </div>

                {/* Delivery Address Section */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100 space-y-3">
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide flex items-center gap-2">
                    <Navigation className="h-4 w-4 text-green-600" />
                    📍 Delivery Address
                  </h3>

                  <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide flex items-center gap-2">
                    Full Address
                    {geocodingLoading && (
                      <Loader className="h-4 w-4 text-yellow-600 animate-spin" />
                    )}
                    {deliveryCoordinates && !geocodingLoading && (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    )}
                  </label>

                  <textarea
                    value={manualAddress}
                    onChange={(e) => setManualAddress(e.target.value)}
                    placeholder="Enter your full delivery address e.g. 123 Ikeja Road, Lagos..."
                    className={`w-full px-4 py-3 border-2 rounded-lg focus:border-transparent transition resize-none font-medium ${
                      geocodingLoading
                        ? 'border-yellow-300 focus:ring-2 focus:ring-yellow-500 bg-yellow-50'
                        : deliveryCoordinates
                        ? 'border-green-300 focus:ring-2 focus:ring-green-500 bg-white'
                        : 'border-gray-200 focus:ring-2 focus:ring-green-500 bg-white'
                    }`}
                    rows={3}
                  />
                  
                  {geocodingLoading && (
                    <p className="text-xs text-yellow-700 flex items-center gap-2 bg-yellow-50 px-3 py-2 rounded">
                      <Loader className="h-3 w-3 animate-spin" />
                      <span>Locating your address...</span>
                    </p>
                  )}
                  
                  {deliveryCoordinates && !geocodingLoading && (
                    <p className="text-xs text-green-700 flex items-center gap-2 bg-green-50 px-3 py-2 rounded">
                      <CheckCircle className="h-3 w-3" />
                      <span>Address located successfully!</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Delivery Settings Section */}
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-6 border border-amber-100 space-y-5">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide flex items-center gap-2">
                  <Truck className="h-4 w-4 text-amber-600" />
                  🚗 Delivery Settings
                </h3>

                {/* Vehicle Type Selection */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-3 uppercase tracking-wide">
                    Vehicle Type
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {(['bike', 'car', 'van'] as const).map((type) => {
                      const isBikeDisabled = type === 'bike' && selectedState?.name !== 'Lagos State';
                      const icons = { bike: '🏍️', car: '🚗', van: '🚐' };
                      
                      return (
                        <button
                          key={type}
                          onClick={() => {
                            if (!isBikeDisabled) {
                              setVehicleType(type);
                            }
                          }}
                          disabled={isBikeDisabled}
                          className={`py-3 px-4 rounded-lg font-bold transition capitalize flex items-center justify-center gap-2 ${
                            isBikeDisabled
                              ? 'bg-gray-200 text-gray-400 cursor-not-allowed opacity-50 border border-gray-200'
                              : vehicleType === type
                              ? 'bg-lime-600 text-white ring-2 ring-lime-400 shadow-lg'
                              : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-lime-400 hover:bg-lime-50'
                          }`}
                          title={isBikeDisabled ? 'Bikes only available in Lagos' : ''}
                        >
                          <span className="text-xl">{icons[type]}</span>
                          {type}
                        </button>
                      );
                    })}
                  </div>
                  {selectedState?.name !== 'Lagos State' && (
                    <p className="text-xs text-orange-600 mt-3 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      Bikes only available in Lagos. Select Car or Van for {selectedState?.name}.
                    </p>
                  )}
                </div>
              </div>

              {/* Quote Details */}
              {quote && (
                <div className="space-y-3 bg-gradient-to-br from-lime-50 via-green-50 to-emerald-50 rounded-xl p-6 border-2 border-lime-300 shadow-md">
                  <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-lime-600" />
                    Delivery Quote
                  </h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white rounded-lg p-3 border border-lime-200">
                      <span className="text-xs text-gray-600 font-semibold uppercase">Distance</span>
                      <div className="text-2xl font-bold text-lime-600">{quote.distance.toFixed(1)} km</div>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-lime-200">
                      <span className="text-xs text-gray-600 font-semibold uppercase">Est. Time</span>
                      <div className="text-2xl font-bold text-lime-600">{quote.duration}</div>
                    </div>
                  </div>

                  {/* Fee Breakdown */}
                  {quote.breakdown && (
                    <div className="space-y-2 border-t-2 border-lime-200 pt-4">
                      <h4 className="text-xs font-bold text-gray-700 uppercase">Fee Breakdown</h4>
                      
                      <div className="space-y-2 bg-white rounded-lg p-3 border border-lime-100">
                        {quote.breakdown.zone > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Zone Base Fee</span>
                            <span className="font-bold text-gray-900">₦{quote.breakdown.zone.toLocaleString()}</span>
                          </div>
                        )}

                        {quote.breakdown.vehicle > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">{vehicleType.charAt(0).toUpperCase() + vehicleType.slice(1)} Fee</span>
                            <span className="font-bold text-gray-900">₦{quote.breakdown.vehicle.toLocaleString()}</span>
                          </div>
                        )}

                        {quote.breakdown.distance > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Distance Fee</span>
                            <span className="font-bold text-gray-900">₦{quote.breakdown.distance.toLocaleString()}</span>
                          </div>
                        )}

                        {pickupLocation.priceAdjustment > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Pickup Location Fee</span>
                            <span className="font-bold text-gray-900">₦{pickupLocation.priceAdjustment.toLocaleString()}</span>
                          </div>
                        )}

                        {quote.modifiers && quote.modifiers.length > 0 && (
                          <>
                            {quote.modifiers.map((mod, i) => (
                              <div key={i} className="flex justify-between text-sm border-t border-gray-200 pt-2">
                                <span className="text-orange-600 font-semibold">{mod.name}</span>
                                <span className="font-bold text-orange-600">+₦{mod.amount.toLocaleString()}</span>
                              </div>
                            ))}
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="bg-white rounded-lg p-4 border-2 border-lime-300 flex items-center justify-between">
                    <span className="text-gray-700 font-semibold">Total Delivery Fee</span>
                    <span className="text-3xl font-bold text-lime-600">
                      ₦{quote.fee.toLocaleString()}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Warnings Section */}
          {quote && quote.warnings && quote.warnings.length > 0 && (
            <div className="bg-yellow-50 rounded-lg border-l-4 border-yellow-500 p-4 space-y-3">
              <h4 className="font-bold text-yellow-900 text-sm flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                ⚠️ Important Information
              </h4>
              {quote.warnings.map((warning, i) => (
                <p key={i} className="text-sm text-yellow-800 leading-relaxed">{warning}</p>
              ))}
            </div>
          )}

          {/* Recommendations Section */}
          {quote && quote.recommendations && quote.recommendations.length > 0 && (
            <div className="bg-green-50 rounded-lg border-l-4 border-green-500 p-4 space-y-3">
              <h4 className="font-bold text-green-900 text-sm">💡 Money-Saving Tips</h4>
              {quote.recommendations.map((rec, i) => (
                <p key={i} className="text-sm text-green-800 leading-relaxed">✓ {rec}</p>
              ))}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-6 border-t-2 border-gray-200">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-lg font-bold text-gray-700 hover:bg-gray-100 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={!selectedState || !quote || loading || geocodingLoading}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-lime-600 to-green-600 hover:from-lime-700 hover:to-green-700 text-white rounded-lg font-bold disabled:bg-gray-400 disabled:cursor-not-allowed transition shadow-lg hover:shadow-xl"
            >
              {loading || geocodingLoading ? 'Processing...' : 'Confirm & Continue'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
