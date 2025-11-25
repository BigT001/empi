/**
 * EMPI Delivery System Configuration
 * 
 * This module defines the complete delivery infrastructure including:
 * - Geographic zones and their pricing
 * - Vehicle types and their capacity/requirements
 * - Item size categories and weight classifications
 * - Dynamic fee calculation based on location, item size, and vehicle type
 */

// ============================================
// VEHICLE TYPES
// ============================================
export enum VehicleType {
  BIKE = "bike",           // Motorcycles/Bikes - For small items
  CAR = "car",            // Cars/Vans - For medium to large items
  VAN = "van",            // Large vans - For bulk/oversized items
}

export interface VehicleConfig {
  type: VehicleType;
  name: string;
  maxWeight: number;        // kg
  maxDimensions: {
    length: number;         // cm
    width: number;          // cm
    height: number;         // cm
  };
  baseRate: number;         // ₦ per km
  minDeliveryFee: number;   // ₦ minimum charge
  maxDeliveryFee: number;   // ₦ maximum charge
  capacity: string;         // Human-readable capacity
  icon?: string;
}

export const VEHICLE_CONFIGS: Record<VehicleType, VehicleConfig> = {
  [VehicleType.BIKE]: {
    type: VehicleType.BIKE,
    name: "Bike/Motorcycle",
    maxWeight: 10,
    maxDimensions: { length: 60, width: 40, height: 30 },
    baseRate: 25,           // ₦25 per km
    minDeliveryFee: 500,    // ₦500 minimum
    maxDeliveryFee: 3000,   // ₦3,000 maximum
    capacity: "Up to 10kg",
    icon: "🏍️",
  },
  [VehicleType.CAR]: {
    type: VehicleType.CAR,
    name: "Car/Van",
    maxWeight: 50,
    maxDimensions: { length: 150, width: 100, height: 100 },
    baseRate: 50,           // ₦50 per km
    minDeliveryFee: 1000,   // ₦1,000 minimum
    maxDeliveryFee: 10000,  // ₦10,000 maximum
    capacity: "Up to 50kg",
    icon: "🚗",
  },
  [VehicleType.VAN]: {
    type: VehicleType.VAN,
    name: "Large Van/Truck",
    maxWeight: 500,
    maxDimensions: { length: 300, width: 200, height: 200 },
    baseRate: 100,          // ₦100 per km
    minDeliveryFee: 2000,   // ₦2,000 minimum
    maxDeliveryFee: 25000,  // ₦25,000 maximum
    capacity: "Up to 500kg",
    icon: "🚚",
  },
};

// ============================================
// ITEM SIZE CATEGORIES
// ============================================
export enum ItemSize {
  SMALL = "small",          // Bikes preferred
  MEDIUM = "medium",        // Cars suitable
  LARGE = "large",          // Vans required
}

export interface SizeCategory {
  size: ItemSize;
  name: string;
  description: string;
  maxWeight: number;        // kg
  maxDimensions: {
    length: number;         // cm
    width: number;          // cm
    height: number;         // cm
  };
  preferredVehicles: VehicleType[];
  requiredVehicles: VehicleType[];  // Minimum required
  sizeMultiplier: number;   // Fee multiplier (1.0 = base rate)
}

export const ITEM_SIZE_CATEGORIES: Record<ItemSize, SizeCategory> = {
  [ItemSize.SMALL]: {
    size: ItemSize.SMALL,
    name: "Small",
    description: "Phone accessories, jewelry, small packages (< 5kg)",
    maxWeight: 5,
    maxDimensions: { length: 30, width: 20, height: 15 },
    preferredVehicles: [VehicleType.BIKE],
    requiredVehicles: [VehicleType.BIKE],
    sizeMultiplier: 1.0,
  },
  [ItemSize.MEDIUM]: {
    size: ItemSize.MEDIUM,
    name: "Medium",
    description: "Clothing, electronics, shoes, textiles (5-30kg)",
    maxWeight: 30,
    maxDimensions: { length: 80, width: 60, height: 40 },
    preferredVehicles: [VehicleType.BIKE, VehicleType.CAR],
    requiredVehicles: [VehicleType.CAR],
    sizeMultiplier: 1.2,
  },
  [ItemSize.LARGE]: {
    size: ItemSize.LARGE,
    name: "Large",
    description: "Furniture, large appliances, bulk items (30kg+)",
    maxWeight: 500,
    maxDimensions: { length: 300, width: 200, height: 200 },
    preferredVehicles: [VehicleType.VAN],
    requiredVehicles: [VehicleType.VAN],
    sizeMultiplier: 1.5,
  },
};

// ============================================
// GEOGRAPHIC ZONES
// ============================================
export enum DeliveryZone {
  INTRA_LAGOS = "intra_lagos",           // Within Lagos Island/Mainland
  LAGOS_METRO = "lagos_metro",           // Greater Lagos Area
  SOUTHWEST = "southwest",               // SW states
  SOUTHSOUTH = "southsouth",             // SS states
  SOUTHEAST = "southeast",               // SE states
  NORTHCENTRAL = "northcentral",         // NC states
  NORTHWEST = "northwest",               // NW states
  NORTHEAST = "northeast",               // NE states
}

export interface ZoneConfig {
  zone: DeliveryZone;
  name: string;
  states: string[];
  baseDeliveryFee: number;  // ₦ flat fee
  costPerKm: number;        // ₦ per km
  estimatedDays: {
    min: number;
    max: number;
  };
  availableVehicles: VehicleType[];
  serviceStatus: "active" | "limited" | "pending";
  description: string;
}

export const DELIVERY_ZONES: Record<DeliveryZone, ZoneConfig> = {
  [DeliveryZone.INTRA_LAGOS]: {
    zone: DeliveryZone.INTRA_LAGOS,
    name: "Intra Lagos",
    states: ["Lagos - Island", "Lagos - Mainland"],
    baseDeliveryFee: 0,       // Free base fee
    costPerKm: 30,            // ₦30 per km
    estimatedDays: { min: 1, max: 2 },
    availableVehicles: [VehicleType.BIKE, VehicleType.CAR, VehicleType.VAN],
    serviceStatus: "active",
    description: "Same-day or next-day delivery within Lagos. Fastest service.",
  },
  [DeliveryZone.LAGOS_METRO]: {
    zone: DeliveryZone.LAGOS_METRO,
    name: "Lagos Metropolitan",
    states: ["Ogun - Lekki/Epe Corridor", "Ogun - Ijebu Ode"],
    baseDeliveryFee: 1500,
    costPerKm: 25,
    estimatedDays: { min: 1, max: 3 },
    availableVehicles: [VehicleType.CAR, VehicleType.VAN],
    serviceStatus: "active",
    description: "Greater Lagos area including Ogun state neighbors.",
  },
  [DeliveryZone.SOUTHWEST]: {
    zone: DeliveryZone.SOUTHWEST,
    name: "Southwest Region",
    states: ["Ogun", "Oyo", "Osun", "Ekiti", "Ondo"],
    baseDeliveryFee: 3000,
    costPerKm: 20,
    estimatedDays: { min: 2, max: 4 },
    availableVehicles: [VehicleType.CAR, VehicleType.VAN],
    serviceStatus: "active",
    description: "South West Nigeria delivery service.",
  },
  [DeliveryZone.SOUTHSOUTH]: {
    zone: DeliveryZone.SOUTHSOUTH,
    name: "South-South Region",
    states: ["Rivers", "Bayelsa", "Cross River", "Akwa Ibom", "Delta"],
    baseDeliveryFee: 5000,
    costPerKm: 18,
    estimatedDays: { min: 3, max: 5 },
    availableVehicles: [VehicleType.VAN],
    serviceStatus: "active",
    description: "South-South Nigeria delivery service.",
  },
  [DeliveryZone.SOUTHEAST]: {
    zone: DeliveryZone.SOUTHEAST,
    name: "Southeast Region",
    states: ["Abia", "Ebonyi", "Enugu", "Imo", "Anambra"],
    baseDeliveryFee: 5000,
    costPerKm: 18,
    estimatedDays: { min: 3, max: 5 },
    availableVehicles: [VehicleType.VAN],
    serviceStatus: "active",
    description: "South-East Nigeria delivery service.",
  },
  [DeliveryZone.NORTHCENTRAL]: {
    zone: DeliveryZone.NORTHCENTRAL,
    name: "North-Central Region",
    states: ["Benue", "Kogi", "Kwara", "Nasarawa", "Niger", "Plateau", "FCT"],
    baseDeliveryFee: 5500,
    costPerKm: 17,
    estimatedDays: { min: 3, max: 6 },
    availableVehicles: [VehicleType.VAN],
    serviceStatus: "active",
    description: "North-Central Nigeria delivery service.",
  },
  [DeliveryZone.NORTHWEST]: {
    zone: DeliveryZone.NORTHWEST,
    name: "Northwest Region",
    states: ["Kaduna", "Kano", "Katsina", "Kebbi", "Sokoto", "Zamfara", "Jigawa"],
    baseDeliveryFee: 6000,
    costPerKm: 16,
    estimatedDays: { min: 4, max: 7 },
    availableVehicles: [VehicleType.VAN],
    serviceStatus: "active",
    description: "North-West Nigeria delivery service.",
  },
  [DeliveryZone.NORTHEAST]: {
    zone: DeliveryZone.NORTHEAST,
    name: "Northeast Region",
    states: ["Adamawa", "Bauchi", "Borno", "Gombe", "Taraba", "Yobe"],
    baseDeliveryFee: 6500,
    costPerKm: 15,
    estimatedDays: { min: 4, max: 7 },
    availableVehicles: [VehicleType.VAN],
    serviceStatus: "limited",
    description: "North-East Nigeria delivery service (Limited availability).",
  },
};

// ============================================
// SPECIAL CONDITIONS & FEES
// ============================================
export interface DeliveryFeeModifier {
  name: string;
  description: string;
  multiplier: number;      // Applied to base fee
  applicableZones?: DeliveryZone[];
  condition?: string;
}

export const DELIVERY_FEE_MODIFIERS: Record<string, DeliveryFeeModifier> = {
  rush_delivery: {
    name: "Rush Delivery",
    description: "Same-day delivery (before 6 PM)",
    multiplier: 1.5,
    applicableZones: [DeliveryZone.INTRA_LAGOS, DeliveryZone.LAGOS_METRO],
  },
  weekend_delivery: {
    name: "Weekend Delivery",
    description: "Saturday or Sunday delivery",
    multiplier: 1.3,
  },
  holiday_delivery: {
    name: "Holiday Delivery",
    description: "Delivery on public holidays",
    multiplier: 1.5,
  },
  fragile_item: {
    name: "Fragile Item Handling",
    description: "Special packaging and handling for delicate items",
    multiplier: 1.2,
  },
  oversized_item: {
    name: "Oversized Item",
    description: "Items requiring special handling",
    multiplier: 1.3,
  },
};

// ============================================
// DELIVERY STATUS TRACKING
// ============================================
export enum DeliveryStatus {
  PENDING = "pending",
  CONFIRMED = "confirmed",
  PICKED_UP = "picked_up",
  IN_TRANSIT = "in_transit",
  OUT_FOR_DELIVERY = "out_for_delivery",
  DELIVERED = "delivered",
  FAILED = "failed",
  CANCELLED = "cancelled",
}

export interface DeliveryStatusInfo {
  status: DeliveryStatus;
  label: string;
  color: string;
  icon: string;
  description: string;
}

export const DELIVERY_STATUS_MAP: Record<DeliveryStatus, DeliveryStatusInfo> = {
  [DeliveryStatus.PENDING]: {
    status: DeliveryStatus.PENDING,
    label: "Pending",
    color: "gray",
    icon: "⏳",
    description: "Order is being prepared for pickup",
  },
  [DeliveryStatus.CONFIRMED]: {
    status: DeliveryStatus.CONFIRMED,
    label: "Confirmed",
    color: "blue",
    icon: "✓",
    description: "Order confirmed, ready for pickup",
  },
  [DeliveryStatus.PICKED_UP]: {
    status: DeliveryStatus.PICKED_UP,
    label: "Picked Up",
    color: "purple",
    icon: "📦",
    description: "Delivery partner has picked up your order",
  },
  [DeliveryStatus.IN_TRANSIT]: {
    status: DeliveryStatus.IN_TRANSIT,
    label: "In Transit",
    color: "yellow",
    icon: "🚚",
    description: "Your order is on the way",
  },
  [DeliveryStatus.OUT_FOR_DELIVERY]: {
    status: DeliveryStatus.OUT_FOR_DELIVERY,
    label: "Out for Delivery",
    color: "orange",
    icon: "📍",
    description: "Your order is out for delivery",
  },
  [DeliveryStatus.DELIVERED]: {
    status: DeliveryStatus.DELIVERED,
    label: "Delivered",
    color: "green",
    icon: "✅",
    description: "Order delivered successfully",
  },
  [DeliveryStatus.FAILED]: {
    status: DeliveryStatus.FAILED,
    label: "Delivery Failed",
    color: "red",
    icon: "❌",
    description: "Delivery attempt failed. We'll try again soon.",
  },
  [DeliveryStatus.CANCELLED]: {
    status: DeliveryStatus.CANCELLED,
    label: "Cancelled",
    color: "red",
    icon: "🚫",
    description: "Order has been cancelled",
  },
};

// ============================================
// STATE TO ZONE MAPPING
// ============================================
export const STATE_TO_ZONE: Record<string, DeliveryZone> = {
  // Intra Lagos
  "Lagos - Island": DeliveryZone.INTRA_LAGOS,
  "Lagos - Mainland": DeliveryZone.INTRA_LAGOS,

  // Lagos Metro
  "Ogun - Lekki/Epe Corridor": DeliveryZone.LAGOS_METRO,
  "Ogun - Ijebu Ode": DeliveryZone.LAGOS_METRO,

  // Southwest
  "Ogun": DeliveryZone.SOUTHWEST,
  "Oyo": DeliveryZone.SOUTHWEST,
  "Osun": DeliveryZone.SOUTHWEST,
  "Ekiti": DeliveryZone.SOUTHWEST,
  "Ondo": DeliveryZone.SOUTHWEST,

  // South-South
  "Rivers": DeliveryZone.SOUTHSOUTH,
  "Bayelsa": DeliveryZone.SOUTHSOUTH,
  "Cross River": DeliveryZone.SOUTHSOUTH,
  "Akwa Ibom": DeliveryZone.SOUTHSOUTH,
  "Delta": DeliveryZone.SOUTHSOUTH,

  // South-East
  "Abia": DeliveryZone.SOUTHEAST,
  "Ebonyi": DeliveryZone.SOUTHEAST,
  "Enugu": DeliveryZone.SOUTHEAST,
  "Imo": DeliveryZone.SOUTHEAST,
  "Anambra": DeliveryZone.SOUTHEAST,

  // North-Central
  "Benue": DeliveryZone.NORTHCENTRAL,
  "Kogi": DeliveryZone.NORTHCENTRAL,
  "Kwara": DeliveryZone.NORTHCENTRAL,
  "Nasarawa": DeliveryZone.NORTHCENTRAL,
  "Niger": DeliveryZone.NORTHCENTRAL,
  "Plateau": DeliveryZone.NORTHCENTRAL,
  "FCT": DeliveryZone.NORTHCENTRAL,

  // North-West
  "Kaduna": DeliveryZone.NORTHWEST,
  "Kano": DeliveryZone.NORTHWEST,
  "Katsina": DeliveryZone.NORTHWEST,
  "Kebbi": DeliveryZone.NORTHWEST,
  "Sokoto": DeliveryZone.NORTHWEST,
  "Zamfara": DeliveryZone.NORTHWEST,
  "Jigawa": DeliveryZone.NORTHWEST,

  // North-East
  "Adamawa": DeliveryZone.NORTHEAST,
  "Bauchi": DeliveryZone.NORTHEAST,
  "Borno": DeliveryZone.NORTHEAST,
  "Gombe": DeliveryZone.NORTHEAST,
  "Taraba": DeliveryZone.NORTHEAST,
  "Yobe": DeliveryZone.NORTHEAST,
};

// ============================================
// ALL AVAILABLE STATES
// ============================================
export const ALL_AVAILABLE_STATES = Object.keys(STATE_TO_ZONE);
