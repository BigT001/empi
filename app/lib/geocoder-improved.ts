/**
 * GPS & Address Validation Service
 * IMPROVED: Combines GPS coordinates + address validation for better accuracy
 * Fallback chain: GPS → Manual Address → Validation
 */

export interface GPSCoordinates {
  latitude: number;
  longitude: number;
  accuracy: number; // in meters
  timestamp: number;
}

export interface GeocoderResult {
  latitude: number;
  longitude: number;
  displayName: string;
  confidence: number; // 0-1
  source: 'gps' | 'address' | 'hybrid';
}

export interface ReverseGeocoderResult {
  address: string;
  state?: string;
  lga?: string;
  latitude: number;
  longitude: number;
  rawData?: any;
}

export interface ImprovedValidationResult {
  isValid: boolean;
  latitude: number;
  longitude: number;
  displayName: string;
  detectedState?: string;
  detectedLGA?: string;
  source: 'gps' | 'address' | 'hybrid';
  accuracy?: number; // GPS accuracy in meters
  matchesSelectedState: boolean;
  matchesSelectedLGA: boolean;
  warning?: string;
  confidence: 'high' | 'medium' | 'low';
}

/**
 * Get GPS coordinates from browser Geolocation API
 * Returns current user location with accuracy
 */
export async function getGPSLocation(): Promise<GPSCoordinates | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      console.warn('Geolocation API not supported');
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: Date.now(),
        });
      },
      (error) => {
        console.warn('GPS error:', error);
        resolve(null);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000, // 10 seconds
        maximumAge: 0, // Don't use cached location
      }
    );
  });
}

/**
 * Convert address string to coordinates using OpenStreetMap Nominatim
 * Returns null if address cannot be found
 */
export async function geocodeAddress(address: string): Promise<GeocoderResult | null> {
  try {
    // Add state context if possible
    const searchAddress = address.toLowerCase().includes('nigeria')
      ? address
      : `${address}, Nigeria`;

    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        searchAddress
      )}&countrycodes=NG&limit=1`,
      {
        headers: {
          'User-Agent': 'EMPI-Delivery-App/1.0',
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
      source: 'address',
    };
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}

/**
 * IMPROVED: Validate address with GPS fallback
 * If GPS available and accurate, use it (most reliable)
 * Otherwise fall back to address geocoding
 * Then verify state/LGA match
 */
export async function improvedValidateAddress(
  addressInput: string,
  selectedState: string,
  selectedLGA: string,
  gpsCoordinates?: GPSCoordinates | null
): Promise<ImprovedValidationResult | null> {
  try {
    let finalCoordinates: GeocoderResult | null = null;
    let source: 'gps' | 'address' | 'hybrid' = 'address';
    let accuracy: number | undefined;

    // STEP 1: Try GPS if available and accurate enough (< 50 meters)
    if (gpsCoordinates && gpsCoordinates.accuracy < 50) {
      console.log('✅ Using GPS coordinates (accuracy: ' + gpsCoordinates.accuracy + 'm)');
      finalCoordinates = {
        latitude: gpsCoordinates.latitude,
        longitude: gpsCoordinates.longitude,
        displayName: `GPS Location (${gpsCoordinates.accuracy.toFixed(0)}m accuracy)`,
        confidence: 0.95,
        source: 'gps',
      };
      source = 'gps';
      accuracy = gpsCoordinates.accuracy;
    }
    // STEP 2: If GPS not available, use address geocoding
    else if (addressInput) {
      console.log('⚠️ GPS not available, using address geocoding');
      finalCoordinates = await geocodeAddress(addressInput);
      if (!finalCoordinates) {
        console.error('Address geocoding failed');
        return null;
      }
      source = 'address';
    } else {
      console.error('No GPS and no address provided');
      return null;
    }

    // STEP 3: Reverse geocode to get state/LGA info
    const reversed = await reverseGeocodeAddress(
      finalCoordinates.latitude,
      finalCoordinates.longitude
    );

    if (!reversed) {
      console.warn('Reverse geocoding failed');
      return null;
    }

    // STEP 4: Compare detected state/LGA with selected values
    const detectedStateNormalized = (reversed.state || '').toLowerCase().trim();
    const detectedLGANormalized = (reversed.lga || '').toLowerCase().trim();
    const selectedStateNormalized = selectedState.toLowerCase().trim();
    const selectedLGANormalized = selectedLGA.toLowerCase().trim();

    // More lenient matching for address-based geocoding
    const matchesState =
      source === 'gps'
        ? detectedStateNormalized.includes(selectedStateNormalized) ||
          selectedStateNormalized.includes(detectedStateNormalized)
        : detectedStateNormalized.includes(selectedStateNormalized) ||
          selectedStateNormalized.includes(detectedStateNormalized);

    const matchesLGA =
      source === 'gps'
        ? detectedLGANormalized.includes(selectedLGANormalized) ||
          selectedLGANormalized.includes(detectedLGANormalized)
        : detectedLGANormalized.includes(selectedLGANormalized) ||
          selectedLGANormalized.includes(detectedLGANormalized);

    // Determine confidence level
    let confidence: 'high' | 'medium' | 'low' = 'low';
    if (source === 'gps' && accuracy && accuracy < 30) {
      confidence = 'high'; // GPS with <30m accuracy = very reliable
    } else if (source === 'address' && finalCoordinates.confidence > 0.8) {
      confidence = 'high'; // High-confidence address match
    } else if (source === 'address' && finalCoordinates.confidence > 0.5) {
      confidence = 'medium'; // Medium confidence
    } else {
      confidence = 'low'; // Low confidence
    }

    // Generate warning if there's a mismatch
    let warning = '';
    if (!matchesState) {
      warning = `⚠️ Address/GPS location detected in "${reversed.state}" but you selected "${selectedState}"`;
    } else if (!matchesLGA) {
      warning = `⚠️ Address/GPS location detected in "${reversed.lga}" LGA but you selected "${selectedLGA}"`;
    }

    return {
      isValid: matchesState && matchesLGA,
      latitude: finalCoordinates.latitude,
      longitude: finalCoordinates.longitude,
      displayName: reversed.address || finalCoordinates.displayName,
      detectedState: reversed.state,
      detectedLGA: reversed.lga,
      source,
      accuracy,
      matchesSelectedState: matchesState,
      matchesSelectedLGA: matchesLGA,
      warning: warning || undefined,
      confidence,
    };
  } catch (error) {
    console.error('Validation error:', error);
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

    const state = address.state || extractStateFromAddress(displayName);
    const lga =
      address.county ||
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
  const parts = displayName
    .split(',')
    .map((p) => p.trim());
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
  const parts = displayName
    .split(',')
    .map((p) => p.trim());
  if (parts.length >= 2) {
    const potentialLGA = parts[0];
    if (potentialLGA.length > 2 && !potentialLGA.match(/^[\d\s.]+$/)) {
      return potentialLGA;
    }
  }
  return '';
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
    return [];
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
      source: 'address' as const,
    }));
  } catch (error) {
    console.error('Error getting suggestions:', error);
    return [];
  }
}

/**
 * Check if coordinates are within Lagos boundaries
 */
export function isWithinLagos(latitude: number, longitude: number): boolean {
  return (
    latitude >= 6.35 &&
    latitude <= 6.75 &&
    longitude >= 2.95 &&
    longitude <= 3.55
  );
}
