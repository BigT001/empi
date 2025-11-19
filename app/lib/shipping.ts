// Shipping zones and costs based on warehouse location (Lagos)
// Both warehouses: Suru-lere and Ojo, Lagos

export const SHIPPING_ZONES = {
  LAGOS_LOCAL: {
    id: "lagos_local",
    name: "Lagos (Local Delivery)",
    states: ["Lagos"],
    cost: 3500,
    estimatedDays: "1-2 days",
    description: "Same-day or next-day delivery within Lagos",
  },
  SW_REGION: {
    id: "sw_region",
    name: "South West Region",
    states: ["Ogun", "Osun", "Ondo", "Ekiti", "Kwara"],
    cost: 7500,
    estimatedDays: "2-3 days",
    description: "Delivery to neighboring states",
  },
  SS_REGION: {
    id: "ss_region",
    name: "South South Region",
    states: ["Delta", "Rivers", "Cross River", "Akwa Ibom", "Bayelsa", "Edo"],
    cost: 9500,
    estimatedDays: "2-4 days",
    description: "Delivery to south-south states",
  },
  SE_REGION: {
    id: "se_region",
    name: "South East Region",
    states: ["Anambra", "Enugu", "Imo", "Abia", "Ebonyi"],
    cost: 9500,
    estimatedDays: "3-4 days",
    description: "Delivery to south-east states",
  },
  NC_REGION: {
    id: "nc_region",
    name: "North Central Region",
    states: ["Abuja", "Nasarawa", "Plateau", "Niger", "Benue", "Kogi"],
    cost: 12000,
    estimatedDays: "3-5 days",
    description: "Delivery to north-central states",
  },
  NW_REGION: {
    id: "nw_region",
    name: "North West Region",
    states: ["Kaduna", "Katsina", "Kano", "Jigawa", "Kebbi", "Sokoto", "Zamfara"],
    cost: 15000,
    estimatedDays: "4-6 days",
    description: "Delivery to north-west states",
  },
  NE_REGION: {
    id: "ne_region",
    name: "North East Region",
    states: ["Gombe", "Yobe", "Borno", "Adamawa", "Taraba"],
    cost: 15000,
    estimatedDays: "4-6 days",
    description: "Delivery to north-east states",
  },
  INTERNATIONAL: {
    id: "international",
    name: "International Shipping",
    states: ["International"],
    cost: 25000,
    estimatedDays: "7-14 days",
    description: "International shipping available",
  },
};

export type ShippingZoneKey = keyof typeof SHIPPING_ZONES;

export interface ShippingOption {
  type: "mp_handled" | "self_shipped";
  zone?: ShippingZoneKey;
  state?: string;
  cost: number;
  estimatedDays: string;
  description: string;
}

export function getShippingCost(state: string, shippingType: "mp_handled" | "self_shipped"): ShippingOption {
  if (shippingType === "self_shipped") {
    return {
      type: "self_shipped",
      cost: 0,
      estimatedDays: "Varies",
      description: "You arrange your own shipping - no additional cost",
    };
  }

  // Normalize state name
  const normalizedState = state.trim().toUpperCase();

  // Find matching zone
  for (const [key, zone] of Object.entries(SHIPPING_ZONES)) {
    if (zone.states.some(s => s.toUpperCase() === normalizedState)) {
      return {
        type: "mp_handled",
        zone: key as ShippingZoneKey,
        state,
        cost: zone.cost,
        estimatedDays: zone.estimatedDays,
        description: zone.description,
      };
    }
  }

  // Default to international if not found
  return {
    type: "mp_handled",
    zone: "INTERNATIONAL",
    state,
    cost: 25000,
    estimatedDays: "7-14 days",
    description: "International shipping available",
  };
}

export function getAllStates(): string[] {
  const states = new Set<string>();
  Object.values(SHIPPING_ZONES).forEach(zone => {
    zone.states.forEach(state => states.add(state));
  });
  return Array.from(states).sort();
}

export function formatPrice(price: number): string {
  return `₦${price.toLocaleString("en-NG")}`;
}
