/**
 * Google Maps Distance Matrix Service (Optional)
 * For more accurate distance/time calculations using Google Maps API
 * 
 * Setup:
 * 1. Get Google Maps API key
 * 2. Add to .env.local: GOOGLE_MAPS_API_KEY=your_key
 * 3. Enable Distance Matrix API in Google Cloud Console
 */

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

export interface DistanceResult {
  distance: {
    text: string;
    value: number; // meters
  };
  duration: {
    text: string;
    value: number; // seconds
  };
}

/**
 * Get distance and duration from Google Maps
 * Falls back to Haversine if API key not available
 */
export async function getDistanceFromGoogleMaps(
  origin: string,
  destination: string
): Promise<DistanceResult | null> {
  if (!GOOGLE_MAPS_API_KEY) {
    console.log('Google Maps API key not configured, using Haversine calculation');
    return null;
  }

  try {
    const url = new URL(
      'https://maps.googleapis.com/maps/api/distancematrix/json'
    );
    url.searchParams.append('origins', origin);
    url.searchParams.append('destinations', destination);
    url.searchParams.append('key', GOOGLE_MAPS_API_KEY);
    url.searchParams.append('units', 'metric');

    const response = await fetch(url.toString());
    const data = await response.json();

    if (data.status === 'OK' && data.rows[0].elements[0].status === 'OK') {
      return {
        distance: data.rows[0].elements[0].distance,
        duration: data.rows[0].elements[0].duration,
      };
    }

    return null;
  } catch (error) {
    console.error('Error fetching from Google Maps:', error);
    return null;
  }
}

/**
 * Get actual traffic-aware time
 */
export function convertSecondsToReadable(seconds: number): {
  min: number;
  max: number;
  text: string;
} {
  const minutes = Math.round(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  let text = '';
  if (hours > 0) {
    text = `${hours}h ${mins}m`;
  } else {
    text = `${minutes}m`;
  }

  return {
    min: Math.floor(minutes * 0.9), // Optimistic estimate
    max: Math.ceil(minutes * 1.2), // Pessimistic estimate
    text,
  };
}
