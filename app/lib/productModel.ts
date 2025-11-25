/**
 * EMPI Product Model with Delivery Metadata
 * 
 * This file defines the extended product structure including
 * delivery-related properties (size category, weight, fragility, etc.)
 */

import { ItemSize } from "./deliverySystem";

/**
 * Product interface with delivery metadata
 */
export interface Product {
  // Core product info
  id?: string;
  _id?: string;
  name: string;
  description?: string;
  category: string;
  badge?: string | null;

  // Pricing
  sellPrice: number;
  rentPrice: number;

  // Images
  imageUrl: string;
  imageUrls?: string[];

  // Delivery metadata
  size: ItemSize;           // small, medium, large
  weight: number;           // weight in kg
  fragile?: boolean;        // requires special handling
  requiresSignature?: boolean; // signature required on delivery
  perishable?: boolean;     // time-sensitive delivery

  // Additional metadata
  sku?: string;
  stock?: number;
  rating?: number;
  reviews?: number;

  // Timestamps
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Product with calculated delivery info
 */
export interface ProductWithDelivery extends Product {
  deliveryInfo?: {
    estimatedCost: number;   // Estimated delivery cost
    recommendedVehicle: string;
    zone?: string;
  };
}

/**
 * Default product for frontend when data is loading
 */
export const DEFAULT_PRODUCT: Product = {
  name: "Unknown Product",
  category: "Unknown",
  sellPrice: 0,
  rentPrice: 0,
  imageUrl: "",
  size: "medium" as ItemSize,
  weight: 1,
};

/**
 * Product size presets for common item types
 */
export const PRODUCT_PRESETS: Record<string, Partial<Product>> = {
  // Clothing
  shirt: {
    size: "small" as ItemSize,
    weight: 0.3,
    fragile: false,
  },
  dress: {
    size: "small" as ItemSize,
    weight: 0.5,
    fragile: false,
  },
  shoes: {
    size: "small" as ItemSize,
    weight: 0.4,
    fragile: false,
  },

  // Accessories
  jewelry: {
    size: "small" as ItemSize,
    weight: 0.05,
    fragile: true,
    requiresSignature: true,
  },
  handbag: {
    size: "small" as ItemSize,
    weight: 0.6,
    fragile: false,
  },

  // Electronics
  phone: {
    size: "small" as ItemSize,
    weight: 0.2,
    fragile: true,
    requiresSignature: true,
  },
  laptop: {
    size: "medium" as ItemSize,
    weight: 2,
    fragile: true,
    requiresSignature: true,
  },
  headphones: {
    size: "small" as ItemSize,
    weight: 0.3,
    fragile: true,
  },

  // Furniture
  chair: {
    size: "large" as ItemSize,
    weight: 15,
    fragile: false,
  },
  table: {
    size: "large" as ItemSize,
    weight: 25,
    fragile: false,
  },
  sofa: {
    size: "large" as ItemSize,
    weight: 40,
    fragile: false,
  },
  bed_frame: {
    size: "large" as ItemSize,
    weight: 35,
    fragile: false,
  },

  // Appliances
  microwave: {
    size: "medium" as ItemSize,
    weight: 12,
    fragile: true,
  },
  kettle: {
    size: "small" as ItemSize,
    weight: 2,
    fragile: false,
  },
  blender: {
    size: "small" as ItemSize,
    weight: 3,
    fragile: false,
  },
  fan: {
    size: "medium" as ItemSize,
    weight: 5,
    fragile: false,
  },

  // Textiles
  bedsheet_set: {
    size: "small" as ItemSize,
    weight: 1.5,
    fragile: false,
  },
  duvet: {
    size: "medium" as ItemSize,
    weight: 3,
    fragile: false,
  },
  towel_set: {
    size: "small" as ItemSize,
    weight: 2,
    fragile: false,
  },

  // Default
  default: {
    size: "medium" as ItemSize,
    weight: 1,
    fragile: false,
  },
};

/**
 * Get product preset by category
 */
export function getProductPreset(category: string): Partial<Product> {
  const categoryLower = category.toLowerCase().replace(/\s+/g, "_");
  return PRODUCT_PRESETS[categoryLower] || PRODUCT_PRESETS.default;
}
