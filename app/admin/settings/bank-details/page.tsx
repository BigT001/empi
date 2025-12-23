"use client";

import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Check, X, Copy, Eye, EyeOff } from "lucide-react";

interface BankDetails {
  id?: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  bankCode: string;
  sortCode?: string;
  instructions?: string;
  isActive: boolean;
}

export default function BankDetailsPage() {
  const [banks, setBanks] = useState<BankDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [visibleAccounts, setVisibleAccounts] = useState<Set<string>>(new Set());

  const [formData, setFormData] = useState<BankDetails>({
    bankName: "",
    accountName: "",
    accountNumber: "",
    bankCode: "",
    sortCode: "",
    instructions: "",
    isActive: false,
  });

  // Fetch bank details on load
  useEffect(() => {
    fetchBankDetails();
  }, []);

  const fetchBankDetails = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/bank-settings");
      if (res.ok) {
        const data = await res.json();
        // Handle both single settings document and array of banks
        if (data.banks && Array.isArray(data.banks)) {
          setBanks(data.banks);
        } else if (data.bankAccounts && Array.isArray(data.bankAccounts)) {
          setBanks(data.bankAccounts);
        } else {
          setBanks([]);
        }
      } else {
        setBanks([]);
      }
    } catch (error) {
      console.error("Error fetching bank details:", error);
      setMessage({ type: "error", text: "Failed to load bank details" });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      bankName: "",
      accountName: "",
      accountNumber: "",
      bankCode: "",
      sortCode: "",
      instructions: "",
      isActive: false,
    });
    setEditingId(null);
    setShowNewForm(false);
  };

  const handleEdit = (bank: BankDetails) => {
    setFormData(bank);
    setEditingId(bank.id || null);
    setShowNewForm(true);
  };

  const handleSave = async () => {
    // Validate required fields
    if (!formData.bankName || !formData.accountName || !formData.accountNumber || !formData.bankCode) {
      setMessage({ type: "error", text: "Please fill in all required fields" });
      return;
    }

    // Check if adding new bank would exceed limit
    if (!editingId && banks.length >= 3) {
      setMessage({ type: "error", text: "Maximum of 3 banks allowed" });
      return;
    }

    try {
      setSaving(true);

      if (editingId) {
        // Update existing bank
        const res = await fetch("/api/admin/bank-settings", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bankId: editingId,
            ...formData,
          }),
        });

        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.error || "Failed to update bank");
        }

        setBanks(banks.map(b => (b.id === editingId ? { ...formData, id: editingId } : b)));
        setMessage({ type: "success", text: "Bank details updated successfully" });
      } else {
        // Add new bank
        const res = await fetch("/api/admin/bank-settings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });

        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.error || "Failed to add bank");
        }

        const newBank = await res.json();
        setBanks([...banks, newBank]);
        setMessage({ type: "success", text: "Bank details added successfully" });
      }

      resetForm();
    } catch (error) {
      console.error("Error saving bank:", error);
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to save bank details",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (bankId: string | undefined) => {
    if (!bankId || !confirm("Are you sure you want to delete this bank account?")) return;

    try {
      setSaving(true);
      const res = await fetch("/api/admin/bank-settings", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bankId }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to delete bank");
      }

      setBanks(banks.filter(b => b.id !== bankId));
      setMessage({ type: "success", text: "Bank deleted successfully" });
    } catch (error) {
      console.error("Error deleting bank:", error);
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to delete bank",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSetActive = async (bankId: string | undefined) => {
    if (!bankId) return;

    try {
      setSaving(true);
      const res = await fetch("/api/admin/bank-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bankId,
          isActive: true,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to set active bank");
      }

      setBanks(
        banks.map(b => ({
          ...b,
          isActive: b.id === bankId ? true : false,
        }))
      );
      setMessage({ type: "success", text: "Active bank updated" });
    } catch (error) {
      console.error("Error setting active bank:", error);
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to set active bank",
      });
    } finally {
      setSaving(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setMessage({ type: "success", text: `${label} copied to clipboard` });
    setTimeout(() => setMessage(null), 2000);
  };

  const toggleVisibility = (bankId: string | undefined) => {
    if (!bankId) return;
    const newVisible = new Set(visibleAccounts);
    if (newVisible.has(bankId)) {
      newVisible.delete(bankId);
    } else {
      newVisible.add(bankId);
    }
    setVisibleAccounts(newVisible);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Bank Accounts</h1>
          <p className="text-gray-600">Manage bank accounts for customer payments</p>
        </div>

        {/* Message */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-lg flex items-center gap-2 ${
              message.type === "success"
                ? "bg-green-50 text-green-800 border border-green-200"
                : "bg-red-50 text-red-800 border border-red-200"
            }`}
          >
            {message.type === "success" ? (
              <Check className="h-5 w-5" />
            ) : (
              <X className="h-5 w-5" />
            )}
            {message.text}
          </div>
        )}

        {/* Add New Bank Button */}
        {!showNewForm && banks.length < 3 && (
          <button
            onClick={() => setShowNewForm(true)}
            className="mb-8 flex items-center gap-2 bg-gradient-to-r from-green-600 to-lime-600 hover:from-green-700 hover:to-lime-700 text-white px-6 py-3 rounded-lg font-semibold transition shadow-md hover:shadow-lg"
          >
            <Plus className="h-5 w-5" />
            Add Bank Account
          </button>
        )}

        {/* New/Edit Form */}
        {showNewForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8 border border-gray-200">
            <h2 className="text-xl font-bold mb-6 text-gray-900">
              {editingId ? "Edit Bank Account" : "Add New Bank Account"}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Bank Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bank Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.bankName}
                  onChange={e => setFormData({ ...formData, bankName: e.target.value })}
                  placeholder="e.g., GTBank, Access Bank, First Bank"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              {/* Account Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Account Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.accountName}
                  onChange={e => setFormData({ ...formData, accountName: e.target.value })}
                  placeholder="e.g., EMPI Fashion Ltd"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              {/* Account Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Account Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.accountNumber}
                  onChange={e => setFormData({ ...formData, accountNumber: e.target.value })}
                  placeholder="10-digit account number"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              {/* Bank Code */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bank Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.bankCode}
                  onChange={e => setFormData({ ...formData, bankCode: e.target.value })}
                  placeholder="3-digit bank code"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              {/* Sort Code */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sort Code (Optional)
                </label>
                <input
                  type="text"
                  value={formData.sortCode || ""}
                  onChange={e => setFormData({ ...formData, sortCode: e.target.value })}
                  placeholder="6-digit sort code"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              {/* Instructions */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Transfer Instructions (Optional)
                </label>
                <input
                  type="text"
                  value={formData.instructions || ""}
                  onChange={e => setFormData({ ...formData, instructions: e.target.value })}
                  placeholder="e.g., Use your order number as reference"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            {/* Form Buttons */}
            <div className="flex gap-4 mt-8">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 bg-gradient-to-r from-green-600 to-lime-600 hover:from-green-700 hover:to-lime-700 disabled:from-gray-400 disabled:to-gray-400 text-white font-semibold px-6 py-3 rounded-lg transition"
              >
                {saving ? "Saving..." : editingId ? "Update Bank" : "Add Bank"}
              </button>
              <button
                onClick={resetForm}
                disabled={saving}
                className="flex-1 bg-gray-300 hover:bg-gray-400 disabled:bg-gray-400 text-gray-900 font-semibold px-6 py-3 rounded-lg transition"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Bank Cards Grid */}
        {banks.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center border border-gray-200">
            <p className="text-gray-600 text-lg mb-4">No bank accounts configured yet</p>
            <button
              onClick={() => setShowNewForm(true)}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-green-600 to-lime-600 hover:from-green-700 hover:to-lime-700 text-white px-6 py-3 rounded-lg font-semibold transition"
            >
              <Plus className="h-5 w-5" />
              Add First Bank Account
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {banks.map((bank, index) => (
              <div
                key={bank.id || `bank-${index}`}
                className={`relative rounded-lg shadow-md border-2 overflow-hidden transition ${
                  bank.isActive
                    ? "border-green-500 bg-gradient-to-br from-green-50 to-lime-50"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                {/* Active Badge */}
                {bank.isActive && (
                  <div className="absolute top-0 right-0 bg-gradient-to-r from-green-600 to-lime-600 text-white px-4 py-2 rounded-bl-lg flex items-center gap-2 font-semibold">
                    <Check className="h-4 w-4" />
                    Active
                  </div>
                )}

                <div className="p-6 pt-12">
                  {/* Bank Name */}
                  <h3 className="text-lg font-bold text-gray-900 mb-4">{bank.bankName}</h3>

                  {/* Account Details */}
                  <div className="space-y-3 mb-6">
                    {/* Account Name */}
                    <div>
                      <p className="text-xs text-gray-600 font-medium">Account Name</p>
                      <p className="text-sm font-semibold text-gray-900">{bank.accountName}</p>
                    </div>

                    {/* Account Number */}
                    <div>
                      <p className="text-xs text-gray-600 font-medium mb-1">Account Number</p>
                      <div className="flex items-center gap-2">
                        <input
                          type={visibleAccounts.has(bank.id || "") ? "text" : "password"}
                          value={bank.accountNumber}
                          readOnly
                          className="flex-1 px-3 py-1 bg-gray-100 rounded text-sm font-mono font-semibold text-gray-900 border border-gray-300"
                        />
                        <button
                          onClick={() => toggleVisibility(bank.id)}
                          className="p-1 text-gray-600 hover:text-gray-900 transition"
                          title={visibleAccounts.has(bank.id || "") ? "Hide" : "Show"}
                        >
                          {visibleAccounts.has(bank.id || "") ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                        <button
                          onClick={() => copyToClipboard(bank.accountNumber, "Account Number")}
                          className="p-1 text-gray-600 hover:text-gray-900 transition"
                          title="Copy"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Bank Code */}
                    <div>
                      <p className="text-xs text-gray-600 font-medium">Bank Code</p>
                      <div className="flex items-center gap-2">
                        <p className="flex-1 px-3 py-1 bg-gray-100 rounded text-sm font-mono font-semibold text-gray-900">
                          {bank.bankCode}
                        </p>
                        <button
                          onClick={() => copyToClipboard(bank.bankCode, "Bank Code")}
                          className="p-1 text-gray-600 hover:text-gray-900 transition"
                          title="Copy"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Sort Code */}
                    {bank.sortCode && (
                      <div>
                        <p className="text-xs text-gray-600 font-medium">Sort Code</p>
                        <p className="text-sm font-mono text-gray-900">{bank.sortCode}</p>
                      </div>
                    )}

                    {/* Instructions */}
                    {bank.instructions && (
                      <div>
                        <p className="text-xs text-gray-600 font-medium">Instructions</p>
                        <p className="text-sm text-gray-700">{bank.instructions}</p>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    {!bank.isActive && (
                      <button
                        onClick={() => handleSetActive(bank.id)}
                        disabled={saving}
                        className="flex-1 bg-gradient-to-r from-green-600 to-lime-600 hover:from-green-700 hover:to-lime-700 disabled:from-gray-400 disabled:to-gray-400 text-white font-semibold px-4 py-2 rounded-lg text-sm transition flex items-center justify-center gap-2"
                      >
                        <Check className="h-4 w-4" />
                        Set Active
                      </button>
                    )}
                    <button
                      onClick={() => handleEdit(bank)}
                      disabled={saving}
                      className="flex-1 bg-blue-100 hover:bg-blue-200 disabled:bg-gray-200 text-blue-700 font-semibold px-4 py-2 rounded-lg text-sm transition flex items-center justify-center gap-2"
                    >
                      <Edit2 className="h-4 w-4" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(bank.id)}
                      disabled={saving}
                      className="flex-1 bg-red-100 hover:bg-red-200 disabled:bg-gray-200 text-red-700 font-semibold px-4 py-2 rounded-lg text-sm transition flex items-center justify-center gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Info Box */}
        {banks.length > 0 && (
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4 text-blue-800">
            <p className="font-semibold mb-2">💡 How it works:</p>
            <ul className="text-sm space-y-1 ml-4">
              <li>✓ You can add up to 3 bank accounts</li>
              <li>✓ Only the "Active" account will be displayed to customers at checkout</li>
              <li>✓ You can switch the active account at any time</li>
              <li>✓ Customer payment proofs are optional - you can manually verify transfers</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
