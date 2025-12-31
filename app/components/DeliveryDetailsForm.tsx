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
  location: string; // Nearest bus stop or landmark
  state: string;
  localGovernment: string;
  phone: string;
}

const NIGERIAN_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue",
  "Borno", "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu",
  "Gombe", "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi",
  "Kwara", "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo",
  "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara", "FCT"
];

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
    if (!phone.trim()) {
      setError("Phone number is required");
      return;
    }

    try {
      await onSubmit({
        address: address.trim(),
        location,
        state,
        localGovernment: localGovernment.trim(),
        phone: phone.trim(),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save delivery details");
    }
  };

  return (
    <div className="rounded-2xl border border-gray-200 p-4 md:p-6 max-w-xl w-full shadow-lg bg-white">
      <div className="flex items-center gap-2 mb-4">
        <div className="bg-blue-100 rounded-lg p-2">
          <MapPin className="h-5 w-5 text-blue-600" />
        </div>
        <h2 className="text-lg md:text-xl font-bold text-gray-900">{title}</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Address */}
        <div>
          <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5">
            Delivery Address *
          </label>
          <textarea
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="123 Main Street, Apartment 4B, Lekki..."
            disabled={isLoading}
            rows={2}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
          />
        </div>

        {/* Location - Changed to Text Input */}
        <div>
          <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5">
            Nearest Bus Stop / Landmark *
          </label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g., Near Lekki Phase 1 Mall, Chevron Roundabout..."
            disabled={isLoading}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
          />
        </div>

        {/* State & LGA in one row */}
        <div className="grid grid-cols-2 gap-3">
          {/* State */}
          <div>
            <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5">
              State *
            </label>
            <select
              value={state}
              onChange={(e) => setState(e.target.value)}
              disabled={isLoading}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
            >
              <option value="">Select state</option>
              {NIGERIAN_STATES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* LGA */}
          <div>
            <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5">
              LGA *
            </label>
            <input
              type="text"
              value={localGovernment}
              onChange={(e) => setLocalGovernment(e.target.value)}
              placeholder="e.g., Ikoyi"
              disabled={isLoading}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
            />
          </div>
        </div>

        {/* Phone Number */}
        <div>
          <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1">
            <Phone className="h-3.5 w-3.5" />
            Phone Number *
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="0828545562"
            disabled={isLoading}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
          />
          {buyerPhone && (
            <p className="text-xs text-gray-500 mt-1">
              Primary: {buyerPhone}
            </p>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-2.5">
            <p className="text-xs text-red-700 font-medium">{error}</p>
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-2 pt-3">
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 bg-blue-600 text-white font-semibold py-2 text-sm rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400 flex items-center justify-center gap-2"
          >
            {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {isLoading ? "Saving..." : "Save"}
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              className="flex-1 bg-gray-200 text-gray-700 font-semibold py-2 text-sm rounded-lg hover:bg-gray-300 transition disabled:bg-gray-100"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
