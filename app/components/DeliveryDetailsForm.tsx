"use client";

import { useState } from "react";
import { MapPin, Phone, Loader2 } from "lucide-react";

interface DeliveryDetailsFormProps {
  onSubmit: (details: DeliveryDetails) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
  buyerPhone?: string;
  title?: string;
}

export interface DeliveryDetails {
  address: string;
  location: string; // Chrome, Zest, or nearest bus stop
  state: string;
  localGovernment: string;
  phone?: string;
}

const NIGERIAN_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue",
  "Borno", "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu",
  "Gombe", "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi",
  "Kwara", "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo",
  "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara", "FCT"
];

const LOCATIONS = ["Chrome", "Zest", "Nearest Bus Stop"];

export default function DeliveryDetailsForm({
  onSubmit,
  onCancel,
  isLoading = false,
  buyerPhone = "",
  title = "Delivery Details"
}: DeliveryDetailsFormProps) {
  const [address, setAddress] = useState("");
  const [location, setLocation] = useState("");
  const [state, setState] = useState("");
  const [localGovernment, setLocalGovernment] = useState("");
  const [phone, setPhone] = useState(buyerPhone);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate required fields
    if (!address.trim()) {
      setError("Delivery address is required");
      return;
    }
    if (!location) {
      setError("Location is required");
      return;
    }
    if (!state) {
      setError("State is required");
      return;
    }
    if (!localGovernment.trim()) {
      setError("Local Government Area is required");
      return;
    }

    try {
      await onSubmit({
        address: address.trim(),
        location,
        state,
        localGovernment: localGovernment.trim(),
        phone: phone.trim() || undefined,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save delivery details");
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-blue-100 rounded-lg p-3">
          <MapPin className="h-6 w-6 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Address */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Delivery Address *
          </label>
          <textarea
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Enter your delivery address (street, house number, etc.)"
            disabled={isLoading}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
          />
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Location (Bus Stop) *
          </label>
          <select
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            disabled={isLoading}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
          >
            <option value="">Select a location</option>
            {LOCATIONS.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>
        </div>

        {/* State */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            State *
          </label>
          <select
            value={state}
            onChange={(e) => setState(e.target.value)}
            disabled={isLoading}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
          >
            <option value="">Select a state</option>
            {NIGERIAN_STATES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {/* Local Government Area */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Local Government Area *
          </label>
          <input
            type="text"
            value={localGovernment}
            onChange={(e) => setLocalGovernment(e.target.value)}
            placeholder="Enter your local government area"
            disabled={isLoading}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
          />
        </div>

        {/* Phone Number */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <Phone className="h-4 w-4" />
            Alternative Phone Number (Optional)
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Enter alternative phone number (if different from signup)"
            disabled={isLoading}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
          />
          {buyerPhone && (
            <p className="text-xs text-gray-500 mt-1">
              Primary phone: {buyerPhone}
            </p>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-700 font-medium">{error}</p>
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400 flex items-center justify-center gap-2"
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            {isLoading ? "Saving..." : "Save Delivery Details"}
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              className="flex-1 bg-gray-200 text-gray-700 font-semibold py-3 rounded-lg hover:bg-gray-300 transition disabled:bg-gray-100"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
