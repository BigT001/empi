/**
 * EMPI Delivery Fee Calculator
 * 
 * Automatically calculates delivery fees based on:
 * - Buyer's location (state/zone)
 * - Item sizes and weights
 * - Vehicle requirements
 * - Distance
 * - Special delivery options
 */

import {
  VehicleType,
  ItemSize,
  DeliveryZone,
  VEHICLE_CONFIGS,
  ITEM_SIZE_CATEGORIES,
  DELIVERY_ZONES,
  STATE_TO_ZONE,
  DELIVERY_FEE_MODIFIERS,
} from "./deliverySystem";

// ============================================
// TYPES
// ============================================

export interface CartItemDelivery {
  id: string;
  name: string;
  quantity: number;
  size: ItemSize;
  weight: number;          // kg per unit
  totalWeight: number;     // quantity * weight
  fragile?: boolean;
}

export interface DeliveryCalculation {
  zone: DeliveryZone;
  zoneName: string;
  requiredVehicle: VehicleType;
  baseDeliveryFee: number;
  vehicleFee: number;
  sizeFee: number;
  subtotal: number;
  modifiers: {
    name: string;
    amount: number;
  }[];
  total: number;
  estimatedDays: {
    min: number;
    max: number;
  };
  breakdown: {
    zone: number;
    vehicle: number;
    size: number;
    modifiers: number;
  };
}

export interface DeliveryQuote {
  fee: number;
  vehicle: VehicleType;
  zone: DeliveryZone;
  estimatedDays: { min: number; max: number };
  breakdown: DeliveryCalculation;
  warnings: string[];
  recommendations: string[];
}

// ============================================
// CALCULATOR FUNCTIONS
// ============================================

/**
 * Get delivery zone from state
 */
export function getDeliveryZone(state: string): DeliveryZone | null {
  return STATE_TO_ZONE[state] || null;
}

/**
 * Determine required vehicle based on items
 */
export function determineRequiredVehicle(items: CartItemDelivery[]): VehicleType {
  let maxVehicleRequired = VehicleType.BIKE;

  for (const item of items) {
    const sizeConfig = ITEM_SIZE_CATEGORIES[item.size];
    const requiredVehicle = sizeConfig.requiredVehicles[sizeConfig.requiredVehicles.length - 1];

    // Upgrade vehicle if needed
    if (requiredVehicle === VehicleType.VAN) {
      maxVehicleRequired = VehicleType.VAN;
    } else if (requiredVehicle === VehicleType.CAR && maxVehicleRequired !== VehicleType.VAN) {
      maxVehicleRequired = VehicleType.CAR;
    }
  }

  return maxVehicleRequired;
}

/**
 * Calculate total weight of all items
 */
export function calculateTotalWeight(items: CartItemDelivery[]): number {
  return items.reduce((total, item) => total + item.totalWeight, 0);
}

/**
 * Get size-based fee multiplier
 */
export function getSizeMultiplier(items: CartItemDelivery[]): number {
  let maxMultiplier = 1.0;

  for (const item of items) {
    const sizeConfig = ITEM_SIZE_CATEGORIES[item.size];
    maxMultiplier = Math.max(maxMultiplier, sizeConfig.sizeMultiplier);
  }

  return maxMultiplier;
}

/**
 * Calculate vehicle-specific fees
 */
export function calculateVehicleFee(
  vehicle: VehicleType,
  distanceKm: number = 10 // Average distance in Lagos
): number {
  const vehicleConfig = VEHICLE_CONFIGS[vehicle];
  const baseFee = vehicleConfig.baseRate * distanceKm;

  // Clamp between min and max
  return Math.max(
    vehicleConfig.minDeliveryFee,
    Math.min(baseFee, vehicleConfig.maxDeliveryFee)
  );
}

/**
 * Main delivery fee calculation
 */
export function calculateDeliveryFee(
  state: string,
  items: CartItemDelivery[],
  options: {
    distanceKm?: number;
    rushDelivery?: boolean;
    weekendDelivery?: boolean;
    holidayDelivery?: boolean;
  } = {}
): DeliveryQuote | null {
  // Get zone
  const zone = getDeliveryZone(state);
  if (!zone) {
    return null;
  }

  const zoneConfig = DELIVERY_ZONES[zone];

  // Determine required vehicle
  const requiredVehicle = determineRequiredVehicle(items);

  // Validate vehicle availability in zone
  if (!zoneConfig.availableVehicles.includes(requiredVehicle)) {
    return null;
  }

  // Calculate components
  const baseDeliveryFee = zoneConfig.baseDeliveryFee;
  const vehicleFee = calculateVehicleFee(
    requiredVehicle,
    options.distanceKm || 10
  );
  const sizeMultiplier = getSizeMultiplier(items);
  const sizeFee = vehicleFee * (sizeMultiplier - 1); // Additional fee for size

  let subtotal = baseDeliveryFee + vehicleFee + sizeFee;

  // Apply modifiers
  const modifiers: Array<{ name: string; amount: number }> = [];
  let modifierTotal = 0;

  if (options.rushDelivery && zoneConfig.availableVehicles.includes(requiredVehicle)) {
    const rushModifier = DELIVERY_FEE_MODIFIERS.rush_delivery;
    const rushFee = Math.floor(subtotal * (rushModifier.multiplier - 1));
    modifiers.push({
      name: rushModifier.name,
      amount: rushFee,
    });
    modifierTotal += rushFee;
  }

  if (options.weekendDelivery) {
    const weekendModifier = DELIVERY_FEE_MODIFIERS.weekend_delivery;
    const weekendFee = Math.floor(subtotal * (weekendModifier.multiplier - 1));
    modifiers.push({
      name: weekendModifier.name,
      amount: weekendFee,
    });
    modifierTotal += weekendFee;
  }

  if (options.holidayDelivery) {
    const holidayModifier = DELIVERY_FEE_MODIFIERS.holiday_delivery;
    const holidayFee = Math.floor(subtotal * (holidayModifier.multiplier - 1));
    modifiers.push({
      name: holidayModifier.name,
      amount: holidayFee,
    });
    modifierTotal += holidayFee;
  }

  // Check for fragile items
  const hasFragile = items.some((item) => item.fragile);
  if (hasFragile) {
    const fragileModifier = DELIVERY_FEE_MODIFIERS.fragile_item;
    const fragileFee = Math.floor(subtotal * (fragileModifier.multiplier - 1));
    modifiers.push({
      name: fragileModifier.name,
      amount: fragileFee,
    });
    modifierTotal += fragileFee;
  }

  // Check for oversized items
  const totalWeight = calculateTotalWeight(items);
  const vehicleMaxWeight = VEHICLE_CONFIGS[requiredVehicle].maxWeight;
  if (totalWeight > vehicleMaxWeight * 0.8) {
    const oversizedModifier = DELIVERY_FEE_MODIFIERS.oversized_item;
    const oversizedFee = Math.floor(subtotal * (oversizedModifier.multiplier - 1));
    modifiers.push({
      name: oversizedModifier.name,
      amount: oversizedFee,
    });
    modifierTotal += oversizedFee;
  }

  const total = subtotal + modifierTotal;

  // Generate warnings and recommendations
  const warnings: string[] = [];
  const recommendations: string[] = [];

  if (totalWeight > vehicleMaxWeight) {
    warnings.push(
      `Total weight (${totalWeight}kg) exceeds vehicle capacity (${vehicleMaxWeight}kg). Multiple trips may be required.`
    );
  }

  if (zoneConfig.serviceStatus === "limited") {
    warnings.push(
      "Limited service availability in this zone. Delivery may take longer than estimated."
    );
  }

  if (items.length > 5) {
    recommendations.push("Consider consolidating items to reduce delivery complexity.");
  }

  if (sizeMultiplier > 1.3) {
    recommendations.push(
      "Consider splitting large items to reduce delivery costs by choosing self-pickup for some items."
    );
  }

  return {
    fee: Math.round(total),
    vehicle: requiredVehicle,
    zone,
    estimatedDays: zoneConfig.estimatedDays,
    breakdown: {
      zone,
      zoneName: zoneConfig.name,
      requiredVehicle,
      baseDeliveryFee,
      vehicleFee,
      sizeFee,
      subtotal: Math.round(subtotal),
      modifiers,
      total: Math.round(total),
      estimatedDays: zoneConfig.estimatedDays,
      breakdown: {
        zone: baseDeliveryFee,
        vehicle: vehicleFee,
        size: sizeFee,
        modifiers: modifierTotal,
      },
    },
    warnings,
    recommendations,
  };
}

/**
 * Get all available states
 */
export function getAvailableStates(): string[] {
  return Object.keys(STATE_TO_ZONE);
}

/**
 * Estimate delivery time based on zone
 */
export function getEstimatedDeliveryTime(zone: DeliveryZone): string {
  const zoneConfig = DELIVERY_ZONES[zone];
  const { min, max } = zoneConfig.estimatedDays;

  if (min === max) {
    return `${min} ${min === 1 ? "day" : "days"}`;
  }

  return `${min}-${max} days`;
}

/**
 * Format delivery fee for display
 */
export function formatDeliveryFee(fee: number): string {
  return `₦${fee.toLocaleString("en-NG")}`;
}

/**
 * Get vehicle info
 */
export function getVehicleInfo(vehicle: VehicleType) {
  return VEHICLE_CONFIGS[vehicle];
}

/**
 * Calculate delivery cost range for a zone
 */
export function getZonePricingRange(zone: DeliveryZone) {
  const zoneConfig = DELIVERY_ZONES[zone];
  const minFee = zoneConfig.baseDeliveryFee;
  const maxFee = zoneConfig.baseDeliveryFee + VEHICLE_CONFIGS[VehicleType.VAN].maxDeliveryFee;

  return {
    min: minFee,
    max: maxFee,
    display: `₦${minFee.toLocaleString("en-NG")} - ₦${maxFee.toLocaleString("en-NG")}`,
  };
}
