"use client";

import { useState } from "react";
import { X, Plus, Loader } from "lucide-react";

interface OfflineOrderFormProps {
  onClose: () => void;
  onSuccess?: () => void;
}

export default function OfflineOrderForm({ onClose, onSuccess }: OfflineOrderFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    city: "",
    state: "",
    subtotal: "",
    itemDescription: "",
    paymentMethod: "cash",
    status: "completed",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Validate required fields
      if (!formData.firstName.trim()) throw new Error("First name is required");
      if (!formData.lastName.trim()) throw new Error("Last name is required");
      if (!formData.email.trim()) throw new Error("Email is required");
      if (!formData.subtotal || parseFloat(formData.subtotal) <= 0) throw new Error("Amount must be greater than 0");

      const response = await fetch("/api/admin/offline-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          email: formData.email.trim().toLowerCase(),
          phone: formData.phone || undefined,
          city: formData.city || undefined,
          state: formData.state || undefined,
          subtotal: parseFloat(formData.subtotal),
          itemDescription: formData.itemDescription || "Offline Sale",
          paymentMethod: formData.paymentMethod,
          status: formData.status,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save offline order");
      }

      const result = await response.json();
      setSuccess(true);

      // Reset form
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        city: "",
        state: "",
        subtotal: "",
        itemDescription: "",
        paymentMethod: "cash",
        status: "completed",
      });

      console.log("✅ Offline order created:", result.data.orderNumber);

      // Call success callback
      if (onSuccess) {
        setTimeout(onSuccess, 1500);
      }

      // Auto-close after success
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      console.error("Error creating offline order:", err);
    } finally {
      setLoading(false);
    }
  };

  // Calculate VAT for preview
  const subtotalNum = parseFloat(formData.subtotal) || 0;
  const vat = Math.round(subtotalNum * 0.075 * 100) / 100;
  const total = subtotalNum + vat;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Record Offline Order</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <X className="h-6 w-6 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Success Message */}
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-700 font-semibold">✅ Offline order recorded successfully!</p>
              <p className="text-green-600 text-sm mt-1">The order will be included in your VAT calculations automatically.</p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-700 font-semibold">❌ Error</p>
              <p className="text-red-600 text-sm mt-1">{error}</p>
            </div>
          )}

          {/* Customer Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name *
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="John"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-lime-600"
                  required
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name *
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Doe"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-lime-600"
                  required
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="john@example.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-lime-600"
                  required
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+234 xxx xxxx xxx"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-lime-600"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="Lagos"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-lime-600"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  State
                </label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  placeholder="Lagos State"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-lime-600"
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          {/* Order Details */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Details</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Item Description
                </label>
                <textarea
                  name="itemDescription"
                  value={formData.itemDescription}
                  onChange={handleChange}
                  placeholder="E.g., Fashion items, Electronics, etc."
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-lime-600"
                  disabled={loading}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount (Ex VAT) *
                  </label>
                  <input
                    type="number"
                    name="subtotal"
                    value={formData.subtotal}
                    onChange={handleChange}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-lime-600"
                    required
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Method *
                  </label>
                  <select
                    name="paymentMethod"
                    value={formData.paymentMethod}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-lime-600"
                    disabled={loading}
                  >
                    <option value="cash">Cash</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="check">Check</option>
                    <option value="card">Card</option>
                    <option value="mobile_money">Mobile Money</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* VAT Preview */}
          <div className="bg-gradient-to-r from-lime-50 to-green-50 rounded-lg p-4 border border-lime-200">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Amount Breakdown</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Amount (Ex VAT):</span>
                <span className="font-semibold text-gray-900">₦{subtotalNum.toLocaleString("en-NG", { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">VAT (7.5%):</span>
                <span className="font-semibold text-orange-600">₦{vat.toLocaleString("en-NG", { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="border-t border-lime-200 pt-2 flex justify-between">
                <span className="font-semibold text-gray-900">Total Amount (Inc VAT):</span>
                <span className="font-bold text-lg text-green-600">₦{total.toLocaleString("en-NG", { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-2 bg-lime-600 text-white rounded-lg hover:bg-lime-700 font-medium transition flex items-center justify-center gap-2"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Record Order
                </>
              )}
            </button>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>ℹ️ Note:</strong> This offline order will be automatically included in your VAT calculations and will appear in your Transaction History.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
