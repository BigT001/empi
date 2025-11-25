'use client';

import { useState, useEffect } from 'react';
import {
  GoogleMap,
  LoadScript,
  Marker,
  DirectionsRenderer,
} from '@react-google-maps/api';
import {
  X,
  MapPin,
  Truck,
  Clock,
  DollarSign,
  Loader,
  AlertCircle,
  Navigation,
} from 'lucide-react';

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
  // Pickup Locations Configuration - Updated
  const pickupLocations = {
    location1: {
      name: 'Iba New Site',
      address: 'Iba New Site, Ojo, Lagos',
      coordinates: { latitude: 6.4856, longitude: 3.2337 },
      priceAdjustment: 0,
    },
    location2: {
      name: '22 Ejire Street',
      address: '22 Ejire Street, Surulere, Lagos 101281',
      coordinates: { latitude: 6.5089, longitude: 3.3626 },
      priceAdjustment: 0,
    },
  };

  const [selectedPickupLocation, setSelectedPickupLocation] = useState<'location1' | 'location2'>('location1');

  const [states, setStates] = useState<NigerianState[]>([]);
  const [selectedState, setSelectedState] = useState<NigerianState | null>(null);
  const [vehicleType, setVehicleType] = useState<'bike' | 'car' | 'van'>('car');
  const [manualAddress, setManualAddress] = useState<string>('');
  const [useGPS, setUseGPS] = useState(true);
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [mapLoading, setMapLoading] = useState(false);
  const [quote, setQuote] = useState<DeliveryQuote | null>(null);
  const [directions, setDirections] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [rushDelivery, setRushDelivery] = useState(false);
  const [weekendDelivery, setWeekendDelivery] = useState(false);

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

    const fetchStates = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/delivery/states');
        if (!response.ok) throw new Error('Failed to fetch states');

        const data = await response.json();
        setStates(data.data);

        // Set default state to Lagos
        const lagosState = data.data.find((s: NigerianState) => s.name === 'Lagos');
        if (lagosState) {
          setSelectedState(lagosState);
        }
      } catch (err) {
        setError('Failed to load states. Please try again.');
        console.error('Error fetching states:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStates();
  }, [isOpen]);

  // Get user's GPS location
  useEffect(() => {
    if (!useGPS || !isOpen) return;

    const getLocation = async () => {
      try {
        if (!navigator.geolocation) {
          setError('Geolocation is not supported by your browser');
          return;
        }

        setMapLoading(true);
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setUserLocation({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            });
            setError(null);
            setMapLoading(false);
          },
          (error) => {
            setError('Unable to get your location. Please enable location access.');
            setUseGPS(false);
            setMapLoading(false);
          }
        );
      } catch (err) {
        setError('Error getting location');
        setMapLoading(false);
      }
    };

    getLocation();
  }, [useGPS, isOpen]);

  // Calculate delivery quote
  useEffect(() => {
    if (!userLocation || !selectedState) return;

    const calculateQuote = async () => {
      try {
        setMapLoading(true);

        const pickupLocation = pickupLocations[selectedPickupLocation];

        // Get distance from Google Maps
        const response = await fetch('/api/delivery/calculate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pickupCoordinates: pickupLocation.coordinates,
            deliveryCoordinates: useGPS
              ? userLocation
              : { latitude: 0, longitude: 0 }, // Will be calculated from address
            vehicleType,
            address: !useGPS ? manualAddress : null,
            rushDelivery,
            weekendDelivery,
            pickupLocation: selectedPickupLocation,
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
        setMapLoading(false);
      }
    };

    calculateQuote();
  }, [userLocation, selectedState, vehicleType, manualAddress, useGPS, rushDelivery, weekendDelivery, selectedPickupLocation]);

  const handleConfirm = () => {
    if (!selectedState || !quote) {
      setError('Please complete all required fields');
      return;
    }

    const pickupLocation = pickupLocations[selectedPickupLocation];
    onConfirm({
      selectedState: selectedState.name,
      vehicleType,
      deliveryAddress: useGPS ? 'GPS Location' : manualAddress,
      pickupLocation: {
        id: selectedPickupLocation,
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
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-lime-600 to-green-600 p-6 flex items-center justify-between text-white">
          <div>
            <h2 className="text-2xl font-bold">Real-Time Delivery</h2>
            <p className="text-lime-100 text-sm mt-1">Select your delivery details</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 space-y-8">
          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Form */}
            <div className="space-y-6">
              {/* State Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-lime-600" />
                  Select State
                </label>
                {loading ? (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Loader className="h-4 w-4 animate-spin" />
                    Loading states...
                  </div>
                ) : (
                  <select
                    value={selectedState?.name || ''}
                    onChange={(e) => {
                      const state = states.find((s) => s.name === e.target.value);
                      setSelectedState(state || null);
                    }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500 bg-white"
                  >
                    <option value="">Select a state...</option>
                    {states.map((state) => (
                      <option key={state.name} value={state.name}>
                        {state.name} - {state.capital}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Pickup Location Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-lime-600" />
                  Pickup Location
                </label>
                <div className="space-y-2">
                  {(['location1', 'location2'] as const).map((location) => (
                    <label
                      key={location}
                      className="flex items-start gap-3 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition"
                    >
                      <input
                        type="radio"
                        name="pickup-location"
                        checked={selectedPickupLocation === location}
                        onChange={() => setSelectedPickupLocation(location)}
                        className="w-4 h-4 mt-0.5 accent-lime-600"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">
                          {pickupLocations[location].name}
                        </div>
                        <div className="text-xs text-gray-600">
                          {pickupLocations[location].address}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Vehicle Type Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Truck className="h-4 w-4 text-lime-600" />
                  Vehicle Type
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {(['bike', 'car', 'van'] as const).map((type) => {
                    // Bike only available in Lagos
                    const isBikeDisabled = type === 'bike' && selectedState?.name !== 'Lagos';
                    
                    return (
                      <button
                        key={type}
                        onClick={() => {
                          if (!isBikeDisabled) {
                            setVehicleType(type);
                          }
                        }}
                        disabled={isBikeDisabled}
                        className={`py-3 px-4 rounded-lg font-medium transition capitalize ${
                          isBikeDisabled
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-50'
                            : vehicleType === type
                            ? 'bg-lime-600 text-white ring-2 ring-lime-600'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                        title={isBikeDisabled ? 'Bikes only available in Lagos' : ''}
                      >
                        {type}
                      </button>
                    );
                  })}
                </div>
                {selectedState?.name !== 'Lagos' && (
                  <p className="text-xs text-orange-600 mt-2">
                    💡 Bikes only available in Lagos. Car or Van required for {selectedState?.name}.
                  </p>
                )}
              </div>

              {/* Delivery Options */}
              <div className="space-y-3 border-t border-gray-200 pt-4">
                <h4 className="font-semibold text-gray-900 text-sm">Delivery Options</h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Rush Delivery - Only for Lagos and nearby */}
                  {selectedState && ['Lagos', 'Ogun', 'Oyo'].includes(selectedState.name) && (
                    <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg hover:bg-gray-50 transition border border-gray-200">
                      <input
                        type="checkbox"
                        checked={rushDelivery}
                        onChange={(e) => setRushDelivery(e.target.checked)}
                        className="w-4 h-4 mt-0.5 text-lime-600 border-gray-300 rounded"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">Rush Delivery</div>
                        <div className="text-xs text-gray-600">Same-day delivery (before 6 PM)</div>
                        <div className="text-sm font-semibold text-orange-600 mt-1">+50%</div>
                      </div>
                    </label>
                  )}

                  {/* Weekend Delivery */}
                  <label className={`flex items-start gap-3 cursor-pointer p-3 rounded-lg hover:bg-gray-50 transition border border-gray-200 ${selectedState && !['Lagos', 'Ogun', 'Oyo'].includes(selectedState.name) && rushDelivery ? 'md:col-span-2' : ''}`}>
                    <input
                      type="checkbox"
                      checked={weekendDelivery}
                      onChange={(e) => setWeekendDelivery(e.target.checked)}
                      className="w-4 h-4 mt-0.5 text-lime-600 border-gray-300 rounded"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">Weekend Delivery</div>
                      <div className="text-xs text-gray-600">Saturday or Sunday delivery</div>
                      <div className="text-sm font-semibold text-orange-600 mt-1">+30%</div>
                    </div>
                  </label>
                </div>
              </div>

              {/* GPS vs Manual Address */}
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <Navigation className="h-4 w-4 text-lime-600" />
                  Delivery Location
                </label>

                <div className="space-y-2">
                  <label className="flex items-center gap-3 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      checked={useGPS}
                      onChange={() => setUseGPS(true)}
                      className="w-4 h-4 accent-lime-600"
                    />
                    <span className="text-gray-700 font-medium">Use GPS Location</span>
                  </label>

                  <label className="flex items-center gap-3 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      checked={!useGPS}
                      onChange={() => setUseGPS(false)}
                      className="w-4 h-4 accent-lime-600"
                    />
                    <span className="text-gray-700 font-medium">Enter Address Manually</span>
                  </label>
                </div>

                {!useGPS && (
                  <textarea
                    value={manualAddress}
                    onChange={(e) => setManualAddress(e.target.value)}
                    placeholder="Enter your full delivery address..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-transparent"
                    rows={3}
                  />
                )}
              </div>
            </div>

            {/* Right Column - Map */}
            <div className="space-y-4">
              <div className="bg-gray-100 rounded-lg overflow-hidden">
                {mapLoading ? (
                  <div className="h-96 flex items-center justify-center bg-gray-200">
                    <div className="flex flex-col items-center gap-2">
                      <Loader className="h-8 w-8 animate-spin text-gray-600" />
                      <p className="text-gray-600">Loading map...</p>
                    </div>
                  </div>
                ) : GOOGLE_MAPS_API_KEY ? (
                  <LoadScript googleMapsApiKey={GOOGLE_MAPS_API_KEY}>
                    <GoogleMap
                      mapContainerStyle={mapContainerStyle}
                      center={userLocation || defaultCenter}
                      zoom={13}
                    >
                      {/* Pickup Marker */}
                      {selectedState && (
                        <Marker
                          position={{
                            lat: selectedState.coordinates.latitude,
                            lng: selectedState.coordinates.longitude,
                          }}
                          title={`Pickup: ${selectedState.name}`}
                          icon={{
                            path: 'M12 0C7.58 0 4 3.58 4 8c0 5.25 8 16 8 16s8-10.75 8-16c0-4.42-3.58-8-8-8zm0 11c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z',
                            fillColor: '#22c55e',
                            fillOpacity: 1,
                            scale: 2,
                            strokeColor: '#16a34a',
                            strokeWeight: 1,
                          }}
                        />
                      )}

                      {/* Delivery Marker */}
                      {userLocation && (
                        <Marker
                          position={userLocation}
                          title="Your Location"
                          icon={{
                            path: 'M12 0C7.58 0 4 3.58 4 8c0 5.25 8 16 8 16s8-10.75 8-16c0-4.42-3.58-8-8-8zm0 11c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z',
                            fillColor: '#3b82f6',
                            fillOpacity: 1,
                            scale: 2,
                            strokeColor: '#1e40af',
                            strokeWeight: 1,
                          }}
                        />
                      )}
                    </GoogleMap>
                  </LoadScript>
                ) : (
                  <div className="h-96 flex items-center justify-center bg-gray-200">
                    <p className="text-gray-600">Google Maps API key not configured</p>
                  </div>
                )}
              </div>

              {/* Quote Details */}
              {quote && (
                <div className="space-y-3 bg-gradient-to-br from-lime-50 to-green-50 rounded-lg p-4 border border-lime-200">
                  <h3 className="font-semibold text-gray-900 text-lg">Delivery Quote</h3>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-lime-600" />
                        Distance
                      </span>
                      <span className="font-bold text-gray-900">
                        {quote.distance.toFixed(1)} km
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 flex items-center gap-2">
                        <Clock className="h-4 w-4 text-lime-600" />
                        Estimated Time
                      </span>
                      <span className="font-bold text-gray-900">{quote.duration}</span>
                    </div>

                    {/* Fee Breakdown */}
                    {quote.breakdown && (
                      <div className="space-y-2 border-t border-lime-200 pt-3">
                        <h4 className="text-xs font-semibold text-gray-700 uppercase">Fee Breakdown</h4>
                        
                        {quote.breakdown.zone > 0 && (
                          <div className="flex justify-between text-sm text-gray-700">
                            <span>Zone Base Fee</span>
                            <span>₦{quote.breakdown.zone.toLocaleString()}</span>
                          </div>
                        )}

                        {quote.breakdown.vehicle > 0 && (
                          <div className="flex justify-between text-sm text-gray-700">
                            <span>{vehicleType.charAt(0).toUpperCase() + vehicleType.slice(1)} Fee</span>
                            <span>₦{quote.breakdown.vehicle.toLocaleString()}</span>
                          </div>
                        )}

                        {quote.breakdown.distance > 0 && (
                          <div className="flex justify-between text-sm text-gray-700">
                            <span>Distance Fee</span>
                            <span>₦{quote.breakdown.distance.toLocaleString()}</span>
                          </div>
                        )}

                        {/* Pickup Location Fee */}
                        {pickupLocations[selectedPickupLocation].priceAdjustment > 0 && (
                          <div className="flex justify-between text-sm text-gray-700">
                            <span>Pickup Location Fee</span>
                            <span>₦{pickupLocations[selectedPickupLocation].priceAdjustment.toLocaleString()}</span>
                          </div>
                        )}

                        {/* Modifiers */}
                        {quote.modifiers && quote.modifiers.length > 0 && (
                          <>
                            {quote.modifiers.map((mod, i) => (
                              <div key={i} className="flex justify-between text-sm text-orange-600 font-medium">
                                <span>{mod.name}</span>
                                <span>+₦{mod.amount.toLocaleString()}</span>
                              </div>
                            ))}
                          </>
                        )}
                      </div>
                    )}

                    <div className="border-t border-lime-300 pt-2 flex items-center justify-between bg-white rounded p-2">
                      <span className="text-gray-900 font-semibold">Total Delivery Fee</span>
                      <span className="text-2xl font-bold text-lime-600">
                        ₦{quote.fee.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Warnings Section */}
          {quote && quote.warnings && quote.warnings.length > 0 && (
            <div className="bg-yellow-50 rounded-lg border border-yellow-200 p-4 space-y-2">
              <h4 className="font-semibold text-yellow-900 text-sm flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Important Information
              </h4>
              {quote.warnings.map((warning, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-yellow-600 font-bold text-lg">⚠</span>
                  <p className="text-sm text-yellow-800">{warning}</p>
                </div>
              ))}
            </div>
          )}

          {/* Recommendations Section */}
          {quote && quote.recommendations && quote.recommendations.length > 0 && (
            <div className="bg-green-50 rounded-lg border border-green-200 p-4 space-y-2">
              <h4 className="font-semibold text-green-900 text-sm">💡 Tips to Save Money</h4>
              {quote.recommendations.map((rec, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">✓</span>
                  <p className="text-sm text-green-800">{rec}</p>
                </div>
              ))}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4 pt-6 border-t border-gray-200">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={!selectedState || !quote || mapLoading}
              className="flex-1 px-6 py-3 bg-lime-600 text-white rounded-lg font-medium hover:bg-lime-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
            >
              {mapLoading ? 'Loading...' : 'Confirm Delivery'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
