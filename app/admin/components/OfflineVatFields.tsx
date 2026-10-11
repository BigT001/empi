'use client';

import { useState } from 'react';
import { useVatSettings } from '@/lib/hooks/useVatSettings';
import { calculateVat, normalizeVatPercent } from '@/lib/vat';

/**
 * VAT state for admin offline sale forms.
 * VAT is charged on the product amount only - the delivery/logistics fee is never taxed.
 */
export function useOfflineVat() {
  const vatSettings = useVatSettings();
  // null = follow the store setting until the admin changes it for this order
  const [chargeVatEdit, setChargeVat] = useState<boolean | null>(null);
  const [vatPercentEdit, setVatPercent] = useState<string | null>(null);
  const [deliveryFee, setDeliveryFee] = useState('');

  const chargeVat = chargeVatEdit ?? !vatSettings.isVatDisabled;
  const vatPercent = vatPercentEdit ?? String(vatSettings.vatPercent);
  const effectivePercent = chargeVat ? normalizeVatPercent(vatPercent, 0) : 0;
  const deliveryFeeNum = Math.max(0, parseFloat(deliveryFee) || 0);

  return {
    chargeVat,
    setChargeVat,
    vatPercent,
    setVatPercent,
    deliveryFee,
    setDeliveryFee,
    effectivePercent,
    deliveryFeeNum,
    breakdown: (productAmount: number) => {
      const vat = calculateVat(productAmount, effectivePercent / 100);
      return { vat, total: Math.round((productAmount + vat + deliveryFeeNum) * 100) / 100 };
    },
    payload: { chargeVat, vatPercent: effectivePercent, deliveryFee: deliveryFeeNum },
    reset: () => {
      setDeliveryFee('');
      setChargeVat(null);
      setVatPercent(null);
    },
  };
}

export function OfflineVatFields({
  state,
  disabled,
}: {
  state: ReturnType<typeof useOfflineVat>;
  disabled?: boolean;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Delivery / Logistics Fee (no VAT)
        </label>
        <input
          type="number"
          value={state.deliveryFee}
          onChange={(e) => state.setDeliveryFee(e.target.value)}
          placeholder="0.00"
          step="0.01"
          min="0"
          disabled={disabled}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-lime-600"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">VAT on product amount</label>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              checked={state.chargeVat}
              onChange={(e) => state.setChargeVat(e.target.checked)}
              disabled={disabled}
            />
            Charge VAT
          </label>
          <input
            type="number"
            value={state.vatPercent}
            onChange={(e) => state.setVatPercent(e.target.value)}
            min="0"
            max="100"
            step="0.1"
            disabled={disabled || !state.chargeVat}
            className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-lime-600 disabled:bg-gray-100 disabled:text-gray-400"
          />
          <span className="text-sm text-gray-600">%</span>
        </div>
      </div>
    </div>
  );
}
