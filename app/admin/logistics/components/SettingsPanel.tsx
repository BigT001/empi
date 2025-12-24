"use client";

import { useState } from "react";
import { Plus, Banknote, CheckCircle, Trash2 } from "lucide-react";
import { AddBankDetailsModal } from "./AddBankDetailsModal";

interface PaymentCard {
  _id: string;
  bankName: string;
  accountNumber: string;
  accountHolderName: string;
  active: boolean;
  createdAt: string;
}

interface SettingsPanelProps {
  paymentCards: PaymentCard[];
  onAddCard: (cardData: { bankName: string; accountNumber: string; accountHolderName: string }) => Promise<void>;
  onDeleteCard: (cardId: string) => Promise<void>;
  onSetActive: (cardId: string) => Promise<void>;
}

const bankEmojis: Record<string, string> = {
  "gtBank": "🏦",
  "access": "🏦",
  "zenith": "🏦",
  "fcmb": "🏦",
  "standard": "🏦",
  "guaranty": "🏦",
  "unite": "🏦",
  "wema": "🏦",
  "stanbic": "🏦",
  "fidelity": "🏦",
};

export function SettingsPanel({
  paymentCards,
  onAddCard,
  onDeleteCard,
  onSetActive,
}: SettingsPanelProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAddCard = async (cardData: { bankName: string; accountNumber: string; accountHolderName: string }) => {
    try {
      setIsLoading(true);
      setError("");
      await onAddCard(cardData);
      setShowAddModal(false);
    } catch (err: any) {
      setError(err.message || "Failed to add bank details");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCard = async (cardId: string) => {
    if (!confirm("Are you sure you want to delete this payment card?")) return;
    try {
      await onDeleteCard(cardId);
    } catch (err: any) {
      alert("Failed to delete card");
    }
  };

  const handleSetActive = async (cardId: string) => {
    try {
      await onSetActive(cardId);
    } catch (err: any) {
      alert("Failed to update card status");
    }
  };

  return (
    <>
      {/* Settings Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">⚙️ Settings</h2>
          <p className="text-gray-600 text-sm mt-1">Manage payment methods for sending quotes</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600 text-white font-semibold rounded-lg transition shadow-md"
        >
          <Plus className="h-5 w-5" />
          Add Bank Details
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Payment Cards Grid */}
      {paymentCards.length > 0 ? (
        <div className="grid grid-cols-2 gap-4">
          {paymentCards.map(card => (
            <div key={card._id} className={`rounded-lg border-2 p-4 transition ${card.active ? 'border-green-300 bg-green-50' : 'border-gray-200 bg-white'}`}>
              {/* Card Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-3xl">
                    {bankEmojis[card.bankName.toLowerCase().replace(/\s+/g, '')] || '🏦'}
                  </span>
                  <div>
                    <h3 className="font-bold text-gray-800">{card.bankName}</h3>
                    {card.active && (
                      <span className="inline-block px-2 py-1 bg-green-500 text-white text-xs font-bold rounded-full">
                        Active
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Account Details */}
              <div className="space-y-2 mb-4 bg-gray-50 rounded p-3">
                <div>
                  <p className="text-xs text-gray-600 font-semibold">Account Number</p>
                  <p className="font-mono text-sm text-gray-800 font-bold">{card.accountNumber}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 font-semibold">Account Holder</p>
                  <p className="text-sm text-gray-800 font-semibold">{card.accountHolderName}</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                {!card.active && (
                  <button
                    onClick={() => handleSetActive(card._id)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-500 hover:bg-green-600 text-white font-semibold text-sm rounded-lg transition"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Set Active
                  </button>
                )}
                <button
                  onClick={() => handleDeleteCard(card._id)}
                  className="flex items-center justify-center gap-2 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 font-semibold text-sm rounded-lg transition border border-red-200"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border-2 border-gray-200 p-8 text-center">
          <Banknote className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 font-medium mb-4">No payment cards added yet</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg transition"
          >
            <Plus className="h-4 w-4" />
            Add Bank Details
          </button>
        </div>
      )}

      {/* Add Bank Details Modal */}
      <AddBankDetailsModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddCard}
        isLoading={isLoading}
        maxCardsReached={paymentCards.length >= 2}
      />
    </>
  );
}
