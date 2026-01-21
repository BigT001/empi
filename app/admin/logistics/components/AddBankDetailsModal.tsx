"use client";

import { useState, useEffect } from "react";
import { X, Banknote, AlertCircle } from "lucide-react";

interface AddBankDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (cardData: { bankName: string; accountNumber: string; accountHolderName: string }) => Promise<void>;
  isLoading?: boolean;
  maxCardsReached?: boolean;
}

export function AddBankDetailsModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
  maxCardsReached = false,
}: AddBankDetailsModalProps) {
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountHolderName, setAccountHolderName] = useState("");
  const [error, setError] = useState("");
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const popularBanks = [
    "GTBank",
    "Access Bank",
    "Zenith Bank",
    "FCMB",
    "Standard Chartered",
    "Guaranty Trust Bank",
    "Unite Bank",
    "Wema Bank",
    "Stanbic IBTC",
    "Fidelity Bank",
  ];

  const validateForm = () => {
    if (!bankName.trim()) return "Please enter bank name";
    if (!accountNumber.trim()) return "Please enter account number";
    if (accountNumber.trim().length < 10) return "Account number must be at least 10 digits";
    if (!accountHolderName.trim()) return "Please enter account holder name";
    return "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setError("");
      await onSubmit({
        bankName: bankName.trim(),
        accountNumber: accountNumber.trim(),
        accountHolderName: accountHolderName.trim(),
      });
      
      // Reset form
      setBankName("");
      setAccountNumber("");
      setAccountHolderName("");
      setTouched({});
    } catch (err: any) {
      setError(err.message || "Failed to add bank details");
    }
  };

  const handleBlur = (field: string) => {
    setTouched({ ...touched, [field]: true });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Banknote className="h-5 w-5" />
            <h2 className="text-lg font-bold">Add Bank Details</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-blue-700 rounded transition"
            disabled={isLoading}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {maxCardsReached && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-yellow-700">
                You already have 2 payment cards. Please delete one before adding a new card.
              </p>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex gap-2">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Bank Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Bank Name *
            </label>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                onBlur={() => handleBlur("bankName")}
                placeholder="e.g., GTBank"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                disabled={isLoading || maxCardsReached}
              />
            </div>

            {/* Bank Presets */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              {popularBanks.slice(0, 6).map(bank => (
                <button
                  key={bank}
                  type="button"
                  onClick={() => setBankName(bank)}
                  className={`px-2 py-1 text-xs font-semibold rounded border transition ${
                    bankName === bank
                      ? "bg-blue-500 text-white border-blue-600"
                      : "bg-gray-50 text-gray-700 border-gray-200 hover:border-blue-300"
                  }`}
                  disabled={isLoading || maxCardsReached}
                >
                  {bank}
                </button>
              ))}
            </div>
          </div>

          {/* Account Number */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Account Number *
            </label>
            <input
              type="text"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))}
              onBlur={() => handleBlur("accountNumber")}
              placeholder="10-digit account number"
              maxLength={10}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono"
              disabled={isLoading || maxCardsReached}
            />
            {accountNumber && (
              <p className="text-xs text-gray-500 mt-1">
                {10 - accountNumber.length} more digits needed
              </p>
            )}
          </div>

          {/* Account Holder Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Account Holder Name *
            </label>
            <input
              type="text"
              value={accountHolderName}
              onChange={(e) => setAccountHolderName(e.target.value)}
              onBlur={() => handleBlur("accountHolderName")}
              placeholder="Full name on account"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              disabled={isLoading || maxCardsReached}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold rounded-lg transition"
              disabled={isLoading || maxCardsReached}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || maxCardsReached || !bankName || !accountNumber || !accountHolderName}
              className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white font-semibold rounded-lg transition"
            >
              {isLoading ? "Adding..." : "Add Bank Details"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
