/**
 * SERVER-ONLY: reads the admin-controlled VAT configuration from Settings.
 * Read-only - never writes to the database.
 */
import connectDB from '@/lib/mongodb';
import Settings from '@/lib/models/Settings';
import { DEFAULT_VAT_CONFIG, resolveVatConfig, type VatConfig } from '@/lib/vat';

// Short TTL so an admin change reaches every server instance within seconds
const CACHE_TTL_MS = 30_000;

const globalWithVat = global as typeof globalThis & {
  vatConfigCache?: { config: VatConfig; cachedAt: number } | null;
};

export function setCachedVatConfig(config: VatConfig) {
  globalWithVat.vatConfigCache = { config, cachedAt: Date.now() };
}

export async function getVatConfig(): Promise<VatConfig> {
  const cache = globalWithVat.vatConfigCache;
  if (cache && Date.now() - cache.cachedAt < CACHE_TTL_MS) {
    return cache.config;
  }

  try {
    await connectDB();
    const settings = await Settings.findOne({}).select('isVatDisabled vatPercent').lean();
    const config = resolveVatConfig(settings as { isVatDisabled?: boolean; vatPercent?: number } | null);
    setCachedVatConfig(config);
    return config;
  } catch (error) {
    console.error('[vatSettings] Failed to read VAT settings, using default:', error);
    return cache?.config ?? DEFAULT_VAT_CONFIG;
  }
}
