"use client";

import { useState } from "react";
import { X, Loader, DollarSign } from "lucide-react";

interface OfflineExpenseFormProps {
  onClose: () => void;
  onSuccess?: () => void;
}

export default function OfflineExpenseForm({ onClose, onSuccess }: OfflineExpenseFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    description: "",
    category: "supplies",
    vendorName: "",
    amount: "",
    vatAmount: "",
    notes: "",
    isVATApplicable: true, // New: Toggle for VAT applicability
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Auto-calculate VAT (7.5%) if applicable
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const amount = e.target.value;
    const vatAmount = formData.isVATApplicable 
      ? (amount ? (parseFloat(amount) * 0.075).toFixed(2) : "")
      : "0";
    setFormData((prev) => ({
      ...prev,
      amount,
      vatAmount,
    }));
  };

  // Handle VAT applicability toggle
  const handleVATToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isApplicable = e.target.checked;
    const vatAmount = isApplicable
      ? (formData.amount ? (parseFloat(formData.amount) * 0.075).toFixed(2) : "")
      : "0";
    setFormData((prev) => ({
      ...prev,
      isVATApplicable: isApplicable,
      vatAmount,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Validate required fields
      if (!formData.description.trim()) throw new Error("Description is required");
      if (!formData.amount || parseFloat(formData.amount) <= 0) throw new Error("Amount must be greater than 0");

      const payloadToSend = {
        description: formData.description.trim(),
        category: formData.category,
        vendorName: formData.vendorName.trim() || "Unknown Vendor",
        amount: parseFloat(formData.amount),
        vat: formData.isVATApplicable ? parseFloat(formData.vatAmount || "0") : 0,
        isVATApplicable: formData.isVATApplicable,
        notes: formData.notes.trim() || undefined,
      };

      console.log("📤 [Form] Sending payload:", JSON.stringify(payloadToSend, null, 2));

      const response = await fetch("/api/admin/offline-expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payloadToSend),
      });

      console.log("📤 API Response Status:", response.status);
      console.log("📤 Content-Type:", response.headers.get("content-type"));

      if (!response.ok) {
        const responseText = await response.text();
        console.error("❌ API Raw Response:", responseText);
        try {
          const data = JSON.parse(responseText);
          console.error("❌ API Error Response:", data);
          throw new Error(data.error || "Failed to save offline expense");
        } catch {
          throw new Error(`API Error (${response.status}): ${responseText || "Empty response"}`);
        }
      }

      const result = await response.json();
      setSuccess(true);

      // Reset form
      setFormData({
        description: "",
        category: "supplies",
        vendorName: "",
        amount: "",
        vatAmount: "",
        notes: "",
        isVATApplicable: true,
      });

      console.log("✅ Offline expense created:", result.data._id);

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
      console.error("Error creating offline expense:", err);
    } finally {
      setLoading(false);
    }
  };

  const amountNum = parseFloat(formData.amount) || 0;
  const vatNum = parseFloat(formData.vatAmount) || 0;
  const totalNum = amountNum + vatNum;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-purple-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Record Offline Expense</h2>
          </div>
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
              <p className="text-green-700 font-semibold">✅ Offline expense recorded successfully!</p>
              <p className="text-green-600 text-sm mt-1">The expense will be included in your Input VAT calculations automatically.</p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-700 font-semibold">❌ Error</p>
              <p className="text-red-600 text-sm mt-1">{error}</p>
              <p className="text-red-500 text-xs mt-2 font-mono bg-red-100 p-2 rounded">
                Check browser console (F12) and server terminal for details
              </p>
            </div>
          )}

          {/* Expense Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Expense Information</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description *
                </label>
                <input
                  type="text"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="e.g., Office supplies, inventory purchase"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-600"
                  required
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category *
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-600"
                  disabled={loading}
                >
                  <option value="supplies">Office Supplies</option>
                  <option value="inventory">Inventory/Stock</option>
                  <option value="utilities">Utilities</option>
                  <option value="rent">Rent/Lease</option>
                  <option value="equipment">Equipment</option>
                  <option value="services">Services</option>
                  <option value="delivery">Delivery/Transport</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* VAT Applicability Toggle */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isVATApplicable}
                    onChange={handleVATToggle}
                    disabled={loading}
                    className="h-5 w-5 rounded border-gray-300 text-purple-600 focus:ring-purple-600"
                  />
                  <div>
                    <p className="font-medium text-gray-900">This expense is subject to VAT</p>
                    <p className="text-xs text-gray-600 mt-1">
                      {formData.isVATApplicable 
                        ? "✅ 7.5% VAT will be added (Input VAT)"
                        : "❌ No VAT - Expense is VAT-exempt"}
                    </p>
                  </div>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vendor/Supplier Name
                </label>
                <input
                  type="text"
                  name="vendorName"
                  value={formData.vendorName}
                  onChange={handleChange}
                  placeholder="e.g., ABC Supplies Ltd"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-600"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount (Excluding VAT) *
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600">₦</span>
                  <input
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={handleAmountChange}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-600"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  VAT (7.5%) {!formData.isVATApplicable && "- N/A (VAT-exempt)"}
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600">₦</span>
                  <input
                    type="number"
                    value={formData.vatAmount}
                    placeholder="0.00"
                    className={`w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 ${
                      formData.isVATApplicable ? "" : "opacity-50"
                    }`}
                    disabled
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Additional notes or invoice reference..."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-600"
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          {/* Cost Preview */}
          <div className={`rounded-lg p-4 border ${
            formData.isVATApplicable
              ? "bg-gradient-to-r from-purple-50 to-purple-50 border-purple-200"
              : "bg-gradient-to-r from-gray-50 to-gray-50 border-gray-300"
          }`}>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">Subtotal (ex VAT):</p>
                <p className="font-medium text-gray-900">₦{amountNum.toLocaleString("en-NG", { minimumFractionDigits: 2 })}</p>
              </div>
              {formData.isVATApplicable && (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600">VAT (7.5%):</p>
                  <p className="font-medium text-purple-600">₦{vatNum.toLocaleString("en-NG", { minimumFractionDigits: 2 })}</p>
                </div>
              )}
              <div className={`${formData.isVATApplicable ? "border-t border-purple-200 pt-2" : ""} flex items-center justify-between`}>
                <p className={`text-sm font-medium ${formData.isVATApplicable ? "text-gray-700" : "text-gray-600"}`}>
                  {formData.isVATApplicable ? "Total (with VAT):" : "Total Amount:"}
                </p>
                <p className="font-bold text-gray-900">₦{totalNum.toLocaleString("en-NG", { minimumFractionDigits: 2 })}</p>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium transition flex items-center justify-center gap-2"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  ✓ Save Expense
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
