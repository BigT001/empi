'use client';

import { useEffect, useState } from 'react';
import { DEFAULT_VAT_CONFIG, resolveVatConfig, type VatConfig } from '@/lib/vat';

/**
 * Current store VAT configuration (rate + on/off), as set by admins.
 * VAT computed with this rate must only be applied to products, never to logistics or caution fees.
 */
export function useVatSettings(): VatConfig & { loaded: boolean } {
  const [config, setConfig] = useState<VatConfig>(DEFAULT_VAT_CONFIG);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/vat-settings', { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setConfig(resolveVatConfig(data));
      })
      .catch((err) => console.error('Failed to fetch VAT settings:', err))
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { ...config, loaded };
}
