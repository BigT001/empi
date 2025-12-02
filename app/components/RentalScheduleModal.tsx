'use client';

import { useState, useEffect } from 'react';
import { X, Calendar, Clock, MapPin, AlertCircle, CheckCircle } from 'lucide-react';
import Link from 'next/link';

interface RentalScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (schedule: {
    pickupDate: string;
    pickupTime: string;
    returnDate: string;
    pickupLocation: "iba" | "surulere";
    rentalDays: number;
  }) => void;
  rentalDays?: number; // Optional - for backwards compatibility
  productName: string;
}

const PICKUP_LOCATION = {
  name: "22 Ejire Street",
  address: "22 Ejire Street, Surulere, Lagos 101281",
  hours: "9:00 AM - 6:00 PM",
};

export function RentalScheduleModal({
  isOpen,
  onClose,
  onConfirm,
  rentalDays: initialRentalDays,
  productName,
}: RentalScheduleModalProps) {
  const [pickupDate, setPickupDate] = useState("");
  const [pickupTime, setPickupTime] = useState("10:00");
  const [rentalDays, setRentalDays] = useState(initialRentalDays || 1);
  const [agreedToPolicy, setAgreedToPolicy] = useState(false);
  const [error, setError] = useState("");

  // Calculate return date based on rental days
  useEffect(() => {
    if (pickupDate) {
      const pickup = new Date(pickupDate);
      const returnDate = new Date(pickup.getTime() + rentalDays * 24 * 60 * 60 * 1000);
      // Don't need to set state, we'll compute it when needed
    }
  }, [pickupDate, rentalDays]);

  // Get minimum date (today)
  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Get return date
  const getReturnDate = () => {
    if (!pickupDate) return "";
    const pickup = new Date(pickupDate);
    const returnDate = new Date(pickup.getTime() + rentalDays * 24 * 60 * 60 * 1000);
    return returnDate.toISOString().split('T')[0];
  };

  // Format date for display
  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr + "T00:00:00");
    return date.toLocaleDateString("en-NG", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleConfirm = () => {
    setError("");

    if (!pickupDate) {
      setError("Please select a pickup date");
      return;
    }

    if (!agreedToPolicy) {
      setError("You must agree to the rental policies to continue");
      return;
    }

    const returnDate = getReturnDate();
    
    onConfirm({
      pickupDate,
      pickupTime,
      returnDate,
      pickupLocation: "surulere",
      rentalDays,
    });
  };

  if (!isOpen) return null;

  const returnDate = getReturnDate();
  const minDate = getMinDate();

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-md z-50 flex items-center justify-center p-2 md:p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[95vh] md:max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 px-4 md:p-6 py-4 md:py-6 flex items-center justify-between text-white">
          <div>
            <h2 className="text-xl md:text-2xl font-bold">🎭 Rental Schedule</h2>
            <p className="text-blue-100 text-xs md:text-sm mt-1 truncate">{productName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition flex-shrink-0"
          >
            <X className="h-5 w-5 md:h-6 md:w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="px-4 md:p-6 py-4 md:py-6 space-y-4 md:space-y-6">
          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 md:p-4 flex items-start gap-2 md:gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-red-800 text-xs md:text-sm">{error}</p>
            </div>
          )}

          {/* Rental Duration Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 md:p-4">
            <p className="text-xs md:text-sm text-blue-700">
              <span className="font-semibold">Rental Duration:</span> {rentalDays} day{rentalDays !== 1 ? "s" : ""}
            </p>
          </div>

          {/* Pickup Date */}
          <div>
            <label className="block text-xs md:text-sm font-semibold text-gray-900 mb-2 md:mb-3 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-600" />
              When do you want to pick up?
            </label>
            <input
              type="date"
              min={minDate}
              value={pickupDate}
              onChange={(e) => setPickupDate(e.target.value)}
              className="w-full px-3 md:px-4 py-2 md:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-medium text-sm"
            />
            {pickupDate && (
              <p className="text-xs text-gray-600 mt-1 md:mt-2">
                Pickup: <span className="font-semibold">{formatDate(pickupDate)}</span>
              </p>
            )}
          </div>

          {/* Pickup Time */}
          <div>
            <label className="block text-xs md:text-sm font-semibold text-gray-900 mb-2 md:mb-3 flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-600" />
              What time?
            </label>
            <input
              type="time"
              value={pickupTime}
              onChange={(e) => setPickupTime(e.target.value)}
              className="w-full px-3 md:px-4 py-2 md:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-medium text-sm"
            />
            <p className="text-xs text-gray-600 mt-1 md:mt-2">Store hours: 9:00 AM - 6:00 PM</p>
          </div>

          {/* Rental Duration */}
          <div>
            <label className="block text-xs md:text-sm font-semibold text-gray-900 mb-2 md:mb-3 flex items-center gap-2">
              <span className="text-lg">📅</span>
              How many days do you need?
            </label>
            <div className="flex items-center gap-2 md:gap-4">
              <button
                onClick={() => setRentalDays(Math.max(1, rentalDays - 1))}
                className="px-3 md:px-4 py-2 md:py-3 bg-gray-200 hover:bg-gray-300 rounded-lg font-bold text-gray-900 transition text-sm md:text-base"
              >
                −
              </button>
              <div className="flex-1">
                <input
                  type="number"
                  min="1"
                  value={rentalDays}
                  onChange={(e) => setRentalDays(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-3 md:px-4 py-2 md:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-bold text-center text-base md:text-lg"
                />
              </div>
              <button
                onClick={() => setRentalDays(rentalDays + 1)}
                className="px-3 md:px-4 py-2 md:py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition text-sm md:text-base"
              >
                +
              </button>
            </div>
            <p className="text-xs text-gray-600 mt-1 md:mt-2">
              {rentalDays === 1 ? "1 day rental" : `${rentalDays} days rental`}
            </p>
          </div>

          {/* Return Date Display */}
          {returnDate && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 md:p-4">
              <p className="text-xs md:text-sm text-green-700">
                <span className="font-semibold">Return by:</span> {formatDate(returnDate)} (by 6:00 PM)
              </p>
              <p className="text-xs text-green-600 mt-1">Next day after your last use</p>
            </div>
          )}

          {/* Pickup Location - Fixed to 22 Ejire Street */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 md:p-4">
            <div className="flex items-start gap-2 md:gap-3">
              <MapPin className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="min-w-0">
                <h4 className="font-semibold text-gray-900 text-sm md:text-base">{PICKUP_LOCATION.name}</h4>
                <p className="text-xs md:text-sm text-gray-600 mt-1">{PICKUP_LOCATION.address}</p>
                <p className="text-xs md:text-sm text-gray-600 mt-1">⏰ {PICKUP_LOCATION.hours}</p>
              </div>
            </div>
          </div>

          {/* Policy Agreement */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 md:p-4">
            <label className="flex items-start gap-2 md:gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={agreedToPolicy}
                onChange={(e) => setAgreedToPolicy(e.target.checked)}
                className="w-5 h-5 mt-0.5 accent-blue-600 rounded flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs md:text-sm text-gray-900">
                  I agree to the{" "}
                  <Link
                    href="/rental-policy"
                    target="_blank"
                    className="font-semibold text-blue-600 hover:text-blue-700 underline"
                  >
                    rental policies
                  </Link>
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  By confirming, you agree to our rental terms including damage policies and return guidelines.
                </p>
              </div>
            </label>
          </div>

          {/* Summary */}
          {pickupDate && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-3 md:p-4 border border-blue-200">
              <h4 className="font-semibold text-gray-900 text-xs md:text-sm mb-2 md:mb-3">📋 Your Rental Schedule</h4>
              <div className="space-y-1 md:space-y-2 text-xs md:text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Pickup:</span>
                  <span className="font-semibold text-gray-900 text-right">
                    {formatDate(pickupDate)} @ {pickupTime}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Return:</span>
                  <span className="font-semibold text-gray-900 text-right">
                    {formatDate(returnDate)} by 6:00 PM
                  </span>
                </div>
                <div className="flex justify-between pt-1 md:pt-2 border-t border-blue-200">
                  <span className="text-gray-600">Location:</span>
                  <span className="font-semibold text-gray-900 text-right">
                    {PICKUP_LOCATION.name}
                  </span>
                </div>
                <div className="flex justify-between text-blue-600 pt-1">
                  <span>Duration:</span>
                  <span className="font-semibold">{rentalDays} day{rentalDays !== 1 ? "s" : ""}</span>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 md:gap-3 pt-3 md:pt-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="flex-1 px-4 md:px-6 py-2 md:py-3 border border-gray-300 rounded-lg font-medium text-xs md:text-base text-gray-700 hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={!pickupDate || !agreedToPolicy}
              className="flex-1 px-4 md:px-6 py-2 md:py-3 bg-blue-600 text-white rounded-lg font-medium text-xs md:text-base hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
            >
              <CheckCircle className="h-4 w-4 md:h-5 md:w-5" />
              <span>Confirm</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
