"use client";

import { useState } from "react";
import { Clock, X, Check } from "lucide-react";

interface SetTimerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSet: (durationDays: number, durationHours: number) => Promise<void>;
  orderNumber: string;
  isLoading?: boolean;
}

export function SetTimerModal({
  isOpen,
  onClose,
  onSet,
  orderNumber,
  isLoading = false,
}: SetTimerModalProps) {
  const [durationDays, setDurationDays] = useState(7);
  const [durationHours, setDurationHours] = useState(0);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSetTimer = async () => {
    setError("");
    setSuccess(false);

    // Validate
    if (durationDays === 0 && durationHours === 0) {
      setError("Please set at least 1 hour");
      return;
    }

    if (durationDays > 30) {
      setError("Maximum duration is 30 days");
      return;
    }

    try {
      await onSet(durationDays, durationHours);
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to set timer");
    }
  };

  const totalHours = durationDays * 24 + durationHours;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Clock className="h-6 w-6 text-white" />
            <h2 className="text-xl font-bold text-white">Set Delivery Timer</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/20 rounded-lg transition"
          >
            <X className="h-5 w-5 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <div>
            <p className="text-sm text-gray-600 mb-4">
              Order: <span className="font-bold text-gray-900">{orderNumber}</span>
            </p>
            <p className="text-xs text-gray-500">
              Set the agreed duration for costume delivery. The countdown will start immediately.
            </p>
          </div>

          {/* Duration Input */}
          <div className="space-y-4">
            {/* Days */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Days
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="0"
                  max="30"
                  value={durationDays}
                  onChange={(e) => setDurationDays(Math.max(0, parseInt(e.target.value) || 0))}
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                />
                <span className="text-sm text-gray-600 w-16">days</span>
              </div>
            </div>

            {/* Hours */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Hours
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="0"
                  max="23"
                  value={durationHours}
                  onChange={(e) => setDurationHours(Math.max(0, Math.min(23, parseInt(e.target.value) || 0)))}
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                />
                <span className="text-sm text-gray-600 w-16">hours</span>
              </div>
            </div>
          </div>

          {/* Total Duration Summary */}
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <p className="text-xs text-blue-600 font-semibold mb-2">TOTAL DURATION</p>
            <p className="text-2xl font-bold text-blue-700">
              {durationDays > 0 && `${durationDays}d `}
              {durationHours > 0 && `${durationHours}h`}
              {durationDays === 0 && durationHours === 0 && "Not set"}
            </p>
            <p className="text-xs text-blue-600 mt-2">
              ≈ {totalHours} hours total
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
              <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
              <p className="text-sm text-green-700">Timer set successfully!</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-100 disabled:opacity-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSetTimer}
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-semibold hover:shadow-lg disabled:opacity-50 transition flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                Setting...
              </>
            ) : (
              <>
                <Clock className="h-4 w-4" />
                Set Timer
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
