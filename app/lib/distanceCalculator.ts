/**
 * Distance Calculation Service
 * Uses Haversine formula for accurate GPS-based distance calculation
 * Perfect for Uber-like delivery tracking
 */

// Pickup point coordinates
export const PICKUP_POINTS = {
  SURU_LERE: {
    name: "22 Ejire Street, Suru Lere, Lagos",
    latitude: 6.5244,
    longitude: 3.3662,
    id: "suru_lere",
    address: "22 Ejire Street, Suru Lere, Lagos State, Nigeria",
  },
  OJO: {
    name: "22 Chi-Ben Street, Ojo, Lagos",
    latitude: 6.4756,
    longitude: 3.1265,
    id: "ojo",
    address: "22 Chi-Ben Street, Ojo, Lagos State 102112, Nigeria",
  },
};

// Delivery pricing configuration
export const DELIVERY_CONFIG = {
  MINIMUM_CHARGE_MAINLAND_LAGOS: 3000, // ₦3,000 minimum for mainland Lagos
  BASE_RATE_BIKE: 25,                  // ₦25 per km for bike
  BASE_RATE_CAR: 50,                   // ₦50 per km for car
  BASE_RATE_VAN: 100,                  // ₦100 per km for van
  SIZE_MULTIPLIER: {
    SMALL: 1.0,                        // Base rate
    MEDIUM: 1.2,                       // 20% increase
    LARGE: 1.5,                        // 50% increase
  },
  RUSH_DELIVERY_MULTIPLIER: 1.5,       // 50% extra for rush
  FRAGILE_MULTIPLIER: 1.3,             // 30% extra for fragile items
};

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in kilometers
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance * 100) / 100; // Round to 2 decimal places
}

/**
 * Estimate delivery time based on distance and traffic
 * Returns {min, max} in minutes
 */
export function estimateDeliveryTime(
  distanceKm: number,
  vehicleType: "bike" | "car" | "van"
): { min: number; max: number } {
  // Average speeds (km/h)
  const speeds = {
    bike: 20, // Lagos traffic - bikes are slower in congestion but faster on average
    car: 25,  // Lagos traffic - cars average 25 km/h
    van: 20,  // Vans are slower
  };

  const speed = speeds[vehicleType];
  const timeInMinutes = (distanceKm / speed) * 60;

  // Add buffer for traffic variations
  return {
    min: Math.max(10, Math.round(timeInMinutes * 0.8)), // 20% buffer below
    max: Math.ceil(timeInMinutes * 1.3), // 30% buffer above
  };
}

/**
 * Calculate delivery fee based on distance and item characteristics
 * Uber-like dynamic pricing
 */
export function calculateDeliveryFee(options: {
  distanceKm: number;
  vehicleType: "bike" | "car" | "van";
  itemSize: "SMALL" | "MEDIUM" | "LARGE";
  isFragile: boolean;
  isRushDelivery: boolean;
  isMainlandLagos: boolean;
}): {
  baseFee: number;
  distanceFee: number;
  sizeMultiplier: number;
  fragileMultiplier: number;
  rushMultiplier: number;
  totalFee: number;
  breakdown: string;
} {
  const {
    distanceKm,
    vehicleType,
    itemSize,
    isFragile,
    isRushDelivery,
    isMainlandLagos,
  } = options;

  // 1. Base fee (minimum charge)
  const baseFee = isMainlandLagos
    ? DELIVERY_CONFIG.MINIMUM_CHARGE_MAINLAND_LAGOS
    : 2000; // Default minimum

  // 2. Distance fee
  const ratePerKm =
    vehicleType === "bike"
      ? DELIVERY_CONFIG.BASE_RATE_BIKE
      : vehicleType === "car"
        ? DELIVERY_CONFIG.BASE_RATE_CAR
        : DELIVERY_CONFIG.BASE_RATE_VAN;

  const distanceFee = Math.round(distanceKm * ratePerKm);

  // 3. Size multiplier
  const sizeMultiplier =
    DELIVERY_CONFIG.SIZE_MULTIPLIER[itemSize] ||
    DELIVERY_CONFIG.SIZE_MULTIPLIER.MEDIUM;

  // 4. Fragile multiplier
  const fragileMultiplier = isFragile
    ? DELIVERY_CONFIG.FRAGILE_MULTIPLIER
    : 1.0;

  // 5. Rush delivery multiplier
  const rushMultiplier = isRushDelivery
    ? DELIVERY_CONFIG.RUSH_DELIVERY_MULTIPLIER
    : 1.0;

  // Calculate total
  const subtotal = baseFee + distanceFee;
  const withSizeMultiplier = subtotal * sizeMultiplier;
  const withFragile = withSizeMultiplier * fragileMultiplier;
  const totalFee = Math.round(withFragile * rushMultiplier);

  // Ensure it doesn't go below minimum
  const finalFee = Math.max(baseFee, totalFee);

  return {
    baseFee,
    distanceFee,
    sizeMultiplier,
    fragileMultiplier,
    rushMultiplier,
    totalFee: finalFee,
    breakdown: `₦${baseFee} (base) + ₦${distanceFee} (${distanceKm}km @ ₦${ratePerKm}/km) × ${sizeMultiplier}x (size) × ${fragileMultiplier}x (fragile) × ${rushMultiplier}x (rush) = ₦${finalFee}`,
  };
}

/**
 * Get nearest pickup point
 */
export function getNearestPickupPoint(
  userLat: number,
  userLon: number
): (typeof PICKUP_POINTS)[keyof typeof PICKUP_POINTS] {
  const distanceToSuruLere = calculateDistance(
    userLat,
    userLon,
    PICKUP_POINTS.SURU_LERE.latitude,
    PICKUP_POINTS.SURU_LERE.longitude
  );

  const distanceToOjo = calculateDistance(
    userLat,
    userLon,
    PICKUP_POINTS.OJO.latitude,
    PICKUP_POINTS.OJO.longitude
  );

  return distanceToSuruLere <= distanceToOjo
    ? PICKUP_POINTS.SURU_LERE
    : PICKUP_POINTS.OJO;
}

/**
 * Format distance for display
 */
export function formatDistance(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)}m`;
  }
  return `${km.toFixed(1)}km`;
}

/**
 * Format time for display
 */
export function formatDeliveryTime(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
}
