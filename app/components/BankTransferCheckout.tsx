"use client";

import { useState, useEffect, useRef } from "react";
import { AlertCircle, CheckCircle2, Upload, DollarSign, Copy, Check } from "lucide-react";

interface BankSettings {
  id?: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  bankCode: string;
  sortCode?: string;
  instructions?: string;
  isActive?: boolean;
}

interface BankTransferCheckoutProps {
  orderId: string;
  totalAmount: number;
  onPaymentProofUploaded?: (proofUrl: string) => void;
  disabled?: boolean;
}

export function BankTransferCheckout({
  orderId,
  totalAmount,
  onPaymentProofUploaded,
  disabled = false,
}: BankTransferCheckoutProps) {
  const [bankSettings, setBankSettings] = useState<BankSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadingProof, setUploadingProof] = useState(false);
  const [proofUploaded, setProofUploaded] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchBankSettings();
  }, []);

  const fetchBankSettings = async () => {
    try {
      const res = await fetch('/api/admin/bank-settings');
      if (res.ok) {
        const data = await res.json();
        // Get the active bank account from the array
        const activeBankAccount = data.banks?.find((b: any) => b.isActive) || data.banks?.[0];
        if (activeBankAccount) {
          setBankSettings(activeBankAccount);
        } else {
          setError('Bank details not configured. Please contact support.');
        }
      } else {
        setError('Bank details not configured. Please contact support.');
      }
    } catch (error) {
      console.error('Error fetching bank settings:', error);
      setError('Failed to load bank details');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      setError('Only image files are allowed');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    setUploadingProof(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('orderId', orderId);

      const res = await fetch('/api/orders/upload-payment-proof', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setProofUploaded(true);
        onPaymentProofUploaded?.(data.proofUrl);
      } else {
        const errorData = await res.json();
        setError(errorData.error || 'Failed to upload proof');
      }
    } catch (error) {
      console.error('Error uploading proof:', error);
      setError('Failed to upload payment proof');
    } finally {
      setUploadingProof(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin">
            <div className="h-8 w-8 border-4 border-lime-600 border-t-transparent rounded-full"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!bankSettings) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-red-900">Bank Details Not Configured</p>
          <p className="text-red-800 text-sm">{error || 'Please contact support.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Bank Transfer Details */}
      <div className="bg-gradient-to-br from-blue-50 to-blue-50 rounded-2xl shadow-sm border border-blue-200 p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-blue-100 rounded-lg p-3">
            <DollarSign className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">Bank Transfer Details</h3>
            <p className="text-sm text-gray-600">Transfer ₦{totalAmount.toLocaleString()} to the account below</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Account Name */}
          <div className="bg-white rounded-lg p-4 border border-blue-100">
            <p className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Account Name</p>
            <div className="flex items-center justify-between">
              <p className="font-bold text-lg text-gray-900">{bankSettings.accountName}</p>
              <button
                onClick={() => copyToClipboard(bankSettings.accountName, 'name')}
                className="p-2 hover:bg-gray-100 rounded transition"
              >
                {copiedField === 'name' ? (
                  <Check className="h-5 w-5 text-green-600" />
                ) : (
                  <Copy className="h-5 w-5 text-gray-600" />
                )}
              </button>
            </div>
          </div>

          {/* Bank Name */}
          <div className="bg-white rounded-lg p-4 border border-blue-100">
            <p className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Bank</p>
            <div className="flex items-center justify-between">
              <p className="font-bold text-lg text-gray-900">{bankSettings.bankName}</p>
              <button
                onClick={() => copyToClipboard(bankSettings.bankName, 'bank')}
                className="p-2 hover:bg-gray-100 rounded transition"
              >
                {copiedField === 'bank' ? (
                  <Check className="h-5 w-5 text-green-600" />
                ) : (
                  <Copy className="h-5 w-5 text-gray-600" />
                )}
              </button>
            </div>
          </div>

          {/* Account Number */}
          <div className="bg-white rounded-lg p-4 border-2 border-lime-400">
            <p className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Account Number</p>
            <div className="flex items-center justify-between">
              <p className="font-black text-2xl text-lime-600 tracking-wider">{bankSettings.accountNumber}</p>
              <button
                onClick={() => copyToClipboard(bankSettings.accountNumber, 'account')}
                className="p-2 hover:bg-gray-100 rounded transition"
              >
                {copiedField === 'account' ? (
                  <Check className="h-5 w-5 text-green-600" />
                ) : (
                  <Copy className="h-5 w-5 text-gray-600" />
                )}
              </button>
            </div>
          </div>

          {/* Bank Code (if available) */}
          {bankSettings.bankCode && (
            <div className="bg-white rounded-lg p-4 border border-blue-100">
              <p className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Bank Code</p>
              <div className="flex items-center justify-between">
                <p className="font-bold text-gray-900">{bankSettings.bankCode}</p>
                <button
                  onClick={() => copyToClipboard(bankSettings.bankCode!, 'code')}
                  className="p-2 hover:bg-gray-100 rounded transition"
                >
                  {copiedField === 'code' ? (
                    <Check className="h-5 w-5 text-green-600" />
                  ) : (
                    <Copy className="h-5 w-5 text-gray-600" />
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Instructions */}
          {bankSettings.instructions && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 rounded-lg p-4">
              <p className="text-sm font-semibold text-yellow-900 mb-2">📋 Transfer Instructions:</p>
              <p className="text-sm text-yellow-800">{bankSettings.instructions}</p>
            </div>
          )}
        </div>
      </div>

      {/* Upload Payment Proof */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Upload className="h-5 w-5 text-blue-600" />
          Upload Payment Proof (Optional)
        </h3>
        <p className="text-sm text-gray-600 mb-6">
          Upload a screenshot of your bank transfer receipt. This helps us confirm and process your order faster.
        </p>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-red-900 text-sm">{error}</p>
          </div>
        )}

        {proofUploaded ? (
          <div className="bg-green-50 border-l-4 border-green-500 rounded-lg p-4 flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
            <div>
              <p className="font-semibold text-green-900">Payment proof uploaded successfully!</p>
              <p className="text-sm text-green-800">We'll review and confirm your payment soon.</p>
            </div>
          </div>
        ) : (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingProof || disabled}
              className="w-full p-8 border-2 border-dashed border-blue-300 rounded-lg hover:bg-blue-50 transition disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-center justify-center"
            >
              <Upload className="h-8 w-8 text-blue-600 mb-2" />
              <p className="font-semibold text-gray-900">
                {uploadingProof ? 'Uploading...' : 'Click to upload or drag and drop'}
              </p>
              <p className="text-sm text-gray-600">PNG, JPG, GIF up to 5MB</p>
            </button>
          </>
        )}
      </div>

      {/* Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
        <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-900">
          <p className="font-semibold mb-1">ℹ️ What happens next?</p>
          <ul className="list-disc list-inside space-y-1 text-blue-800">
            <li>Once you transfer payment, your order will be marked as "Awaiting Confirmation"</li>
            <li>Our admin will verify your payment and confirm your order</li>
            <li>You'll receive an automated invoice via email once confirmed</li>
            <li>If needed, we may request proof of payment via email</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
