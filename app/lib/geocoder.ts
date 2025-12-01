/**
 * Address Geocoding Service
 * Uses OpenStreetMap Nominatim API (free, no key required)
 * Converts addresses to coordinates for distance calculation
 */

export interface GeocoderResult {
  latitude: number;
  longitude: number;
  displayName: string;
  confidence: number; // 0-1
}

export interface ReverseGeocoderResult {
  address: string;
  state?: string;
  lga?: string;
  latitude: number;
  longitude: number;
  rawData?: any;
}

export interface AddressValidationResult {
  isValid: boolean;
  latitude: number;
  longitude: number;
  displayName: string;
  detectedState?: string;
  detectedLGA?: string;
  matchesSelectedState: boolean;
  matchesSelectedLGA: boolean;
  warning?: string;
}

/**
 * Convert address string to coordinates using OpenStreetMap Nominatim
 * Returns null if address cannot be found
 */
export async function geocodeAddress(address: string): Promise<GeocoderResult | null> {
  try {
    // Add "Nigeria" context if not already present
    const searchAddress = address.toLowerCase().includes('nigeria')
      ? address
      : `${address}, Nigeria`;

    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        searchAddress
      )}&countrycodes=NG&limit=1`,
      {
        headers: {
          'User-Agent': 'EMPI-Delivery-App/1.0', // Required by Nominatim
        },
      }
    );

    if (!response.ok) {
      console.error('Nominatim API error:', response.status);
      return null;
    }

    const results = await response.json();

    if (!results || results.length === 0) {
      console.log('No results found for address:', address);
      return null;
    }

    const firstResult = results[0];

    return {
      latitude: parseFloat(firstResult.lat),
      longitude: parseFloat(firstResult.lon),
      displayName: firstResult.display_name,
      confidence: parseFloat(firstResult.importance) || 0.5,
    };
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}

/**
 * Reverse geocode coordinates to get address and extract state/LGA
 */
export async function reverseGeocodeAddress(
  latitude: number,
  longitude: number
): Promise<ReverseGeocoderResult | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
      {
        headers: {
          'User-Agent': 'EMPI-Delivery-App/1.0',
        },
      }
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const address = data.address || {};
    const displayName = data.display_name || '';

    // Extract state from address data
    const state = address.state || extractStateFromAddress(displayName);
    
    // Extract LGA/district from address data
    const lga = address.county || 
                address.district || 
                address.municipality ||
                extractLGAFromAddress(displayName);

    return {
      address: displayName,
      state,
      lga,
      latitude,
      longitude,
      rawData: data,
    };
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return null;
  }
}

/**
 * Extract state name from full address string
 */
function extractStateFromAddress(displayName: string): string {
  const parts = displayName.split(',').map(p => p.trim());
  // State is usually one of the last parts
  if (parts.length >= 2) {
    const potentialState = parts[parts.length - 2];
    if (potentialState.length > 2 && !potentialState.match(/^\d+$/)) {
      return potentialState;
    }
  }
  return '';
}

/**
 * Extract LGA/Local Government from address string
 */
function extractLGAFromAddress(displayName: string): string {
  const parts = displayName.split(',').map(p => p.trim());
  // LGA is usually among the first parts but not the first
  if (parts.length >= 2) {
    const potentialLGA = parts[0];
    if (potentialLGA.length > 2 && !potentialLGA.match(/^[\d\s.]+$/)) {
      return potentialLGA;
    }
  }
  return '';
}

/**
 * Validate that a typed address matches the selected state and LGA
 * Returns detailed validation results including any mismatches
 */
export async function validateAddressMatchesLocation(
  address: string,
  selectedState: string,
  selectedLGA: string
): Promise<AddressValidationResult | null> {
  try {
    // First geocode the address to get coordinates
    const geocoded = await geocodeAddress(address);
    if (!geocoded) {
      return null;
    }

    // Then reverse geocode to get state/LGA info
    const reversed = await reverseGeocodeAddress(geocoded.latitude, geocoded.longitude);
    if (!reversed) {
      return null;
    }

    // Compare detected state/LGA with selected values
    const detectedStateNormalized = (reversed.state || '').toLowerCase().trim();
    const detectedLGANormalized = (reversed.lga || '').toLowerCase().trim();
    const selectedStateNormalized = selectedState.toLowerCase().trim();
    const selectedLGANormalized = selectedLGA.toLowerCase().trim();

    const matchesState = detectedStateNormalized.includes(selectedStateNormalized) ||
                       selectedStateNormalized.includes(detectedStateNormalized);
    
    const matchesLGA = detectedLGANormalized.includes(selectedLGANormalized) ||
                      selectedLGANormalized.includes(detectedLGANormalized);

    let warning = '';
    if (!matchesState) {
      warning = `⚠️ Address detected in "${reversed.state}" but you selected "${selectedState}"`;
    } else if (!matchesLGA) {
      warning = `⚠️ Address detected in "${reversed.lga}" LGA but you selected "${selectedLGA}"`;
    }

    return {
      isValid: matchesState && matchesLGA,
      latitude: geocoded.latitude,
      longitude: geocoded.longitude,
      displayName: geocoded.displayName,
      detectedState: reversed.state,
      detectedLGA: reversed.lga,
      matchesSelectedState: matchesState,
      matchesSelectedLGA: matchesLGA,
      warning: warning || undefined,
    };
  } catch (error) {
    console.error('Address validation error:', error);
    return null;
  }
}

/**
 * Validate if coordinates are within Lagos boundaries
 * Lagos coordinates approximate: 6.4° to 6.7° N, 3.0° to 3.5° E
 */
export function isWithinLagos(latitude: number, longitude: number): boolean {
  return (
    latitude >= 6.35 &&
    latitude <= 6.75 &&
    longitude >= 2.95 &&
    longitude <= 3.55
  );
}

/**
 * Calculate distance between two geographic points using Haversine formula
 * Returns distance in kilometers
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * Get address suggestions as user types
 * Returns array of suggested addresses
 */
export async function getAddressSuggestions(
  partialAddress: string
): Promise<GeocoderResult[]> {
  if (partialAddress.length < 3) {
    return []; // Don't search for very short strings
  }

  try {
    const searchAddress = `${partialAddress}, Nigeria`;

    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        searchAddress
      )}&countrycodes=NG&limit=5`,
      {
        headers: {
          'User-Agent': 'EMPI-Delivery-App/1.0',
        },
      }
    );

    if (!response.ok) {
      return [];
    }

    const results = await response.json();

    return results.map((result: any) => ({
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
      displayName: result.display_name,
      confidence: parseFloat(result.importance) || 0.5,
    }));
  } catch (error) {
    console.error('Error getting suggestions:', error);
    return [];
  }
}
