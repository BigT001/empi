"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { ItemSize } from "@/app/lib/deliverySystem";

export interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  mode: "buy" | "rent";
  quantity: number;
  // New delivery metadata
  size?: ItemSize;
  weight?: number; // kg per unit
  fragile?: boolean;
  // Rental metadata - store rental days for reference only
  rentalDays?: number;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string, mode: "buy" | "rent") => void;
  updateQuantity: (id: string, mode: "buy" | "rent", quantity: number) => void;
  clearCart: () => void;
  total: number;
  // Caution fee for rentals (50% of rental total)
  cautionFee: number;
  // Delivery state
  deliveryState: string | null;
  setDeliveryState: (state: string | null) => void;
  deliveryDistance: number;
  setDeliveryDistance: (distance: number) => void;
  // Delivery quote - persisted for display on cart
  deliveryQuote: any | null;
  setDeliveryQuote: (quote: any | null) => void;
  // Rental schedule - shared for ALL rental items
  rentalSchedule: {
    pickupDate: string; // ISO date string (YYYY-MM-DD)
    pickupTime: string; // HH:MM format
    returnDate: string; // ISO date string (YYYY-MM-DD)
    pickupLocation: "iba" | "surulere"; // Which branch
    rentalDays: number; // Number of days for ALL rentals
  } | undefined;
  setRentalSchedule: (schedule: {
    pickupDate: string;
    pickupTime: string;
    returnDate: string;
    pickupLocation: "iba" | "surulere";
    rentalDays: number;
  } | undefined) => void;
  // Validation functions
  validateRentalSchedule: () => { valid: boolean; message: string };
  validateDeliveryInfo: (shippingOption: string) => { valid: boolean; message: string };
  validateCheckoutRequirements: (shippingOption: string, buyer?: any) => { 
    valid: boolean; 
    message: string;
    type: "rental_schedule" | "delivery_info" | "buyer_info" | "success";
  };
  // Cart mode validation - check if we can add an item
  canAddItem: (itemMode: "buy" | "rent") => { 
    canAdd: boolean; 
    message: string;
    conflictingMode?: "buy" | "rent";
  };
  // Get current cart mode (buy or rent or null if empty)
  getCartMode: () => "buy" | "rent" | null;
}

const CartContext = createContext<CartContextType | undefined>(undefined);
const STORAGE_KEY = "empi_cart_context";
const RENTAL_SCHEDULE_KEY = "empi_rental_schedule";
const DELIVERY_QUOTE_KEY = "empi_delivery_quote";
const DELIVERY_STATE_KEY = "empi_delivery_state";
const DELIVERY_DISTANCE_KEY = "empi_delivery_distance";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);
  const [deliveryState, setDeliveryState] = useState<string | null>(null);
  const [deliveryDistance, setDeliveryDistance] = useState(50);
  const [deliveryQuote, setDeliveryQuoteState] = useState<any | null>(null);
  const [rentalSchedule, setRentalScheduleState] = useState<{
    pickupDate: string;
    pickupTime: string;
    returnDate: string;
    pickupLocation: "iba" | "surulere";
    rentalDays: number;
  } | undefined>();

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setItems(JSON.parse(stored));
      }
      const savedState = localStorage.getItem(DELIVERY_STATE_KEY);
      if (savedState) {
        setDeliveryState(savedState);
      }
      const savedDistance = localStorage.getItem(DELIVERY_DISTANCE_KEY);
      if (savedDistance) {
        setDeliveryDistance(parseInt(savedDistance, 10));
      }
      // Load delivery quote
      const savedQuote = localStorage.getItem(DELIVERY_QUOTE_KEY);
      if (savedQuote) {
        try {
          setDeliveryQuoteState(JSON.parse(savedQuote));
        } catch (e) {
          console.error("Failed to parse delivery quote from localStorage", e);
        }
      }
      // Load rental schedule
      const savedSchedule = localStorage.getItem(RENTAL_SCHEDULE_KEY);
      if (savedSchedule) {
        setRentalScheduleState(JSON.parse(savedSchedule));
      }
    } catch (error) {
      console.error("Failed to load cart from localStorage", error);
    }
    setIsHydrated(true);
  }, []);

  // Save to localStorage whenever items change
  useEffect(() => {
    if (isHydrated) {
      try {
        if (!items || items.length === 0) {
          localStorage.removeItem(STORAGE_KEY);
        } else {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
        }
      } catch (error) {
        console.error("Failed to save cart to localStorage", error);
      }
    }
  }, [items, isHydrated]);

  // Save delivery state
  useEffect(() => {
    if (deliveryState) {
      localStorage.setItem(DELIVERY_STATE_KEY, deliveryState);
    } else {
      localStorage.removeItem(DELIVERY_STATE_KEY);
    }
  }, [deliveryState]);

  // Save delivery distance
  useEffect(() => {
    localStorage.setItem(DELIVERY_DISTANCE_KEY, deliveryDistance.toString());
  }, [deliveryDistance]);

  // Save delivery quote to localStorage
  useEffect(() => {
    if (deliveryQuote) {
      localStorage.setItem(DELIVERY_QUOTE_KEY, JSON.stringify(deliveryQuote));
    } else {
      localStorage.removeItem(DELIVERY_QUOTE_KEY);
    }
  }, [deliveryQuote]);

  // Save rental schedule to localStorage
  useEffect(() => {
    if (rentalSchedule) {
      localStorage.setItem(RENTAL_SCHEDULE_KEY, JSON.stringify(rentalSchedule));
    } else {
      localStorage.removeItem(RENTAL_SCHEDULE_KEY);
    }
  }, [rentalSchedule]);

  const addItem = (newItem: CartItem) => {
    setItems((prev) => {
      const existing = prev.find((item) => item.id === newItem.id && item.mode === newItem.mode);
      if (existing) {
        return prev.map((item) =>
          item.id === newItem.id && item.mode === newItem.mode
            ? { ...item, quantity: item.quantity + newItem.quantity }
            : item
        );
      }
      return [...prev, newItem];
    });
  };

  const removeItem = (id: string, mode: "buy" | "rent") => {
    setItems((prev) => prev.filter((item) => !(item.id === id && item.mode === mode)));
  };

  const updateQuantity = (id: string, mode: "buy" | "rent", quantity: number) => {
    if (quantity <= 0) {
      removeItem(id, mode);
      return;
    }
    setItems((prev) =>
      prev.map((item) =>
        item.id === id && item.mode === mode ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    // Clear all cart state variables
    setItems([]);
    setDeliveryState(null);
    setDeliveryDistance(50); // Reset to default
    setDeliveryQuoteState(null);
    setRentalScheduleState(undefined);
    
    // Clear all localStorage data
    localStorage.removeItem("empi_cart_context");
    localStorage.removeItem("empi_rental_schedule");
    localStorage.removeItem("empi_delivery_quote");
    localStorage.removeItem("empi_shipping_option");
    localStorage.removeItem("empi_delivery_state");
    localStorage.removeItem("empi_delivery_distance");
    localStorage.removeItem("empi_pending_payment");
  };

  const setRentalSchedule = (schedule: {
    pickupDate: string;
    pickupTime: string;
    returnDate: string;
    pickupLocation: "iba" | "surulere";
    rentalDays: number;
  } | undefined) => {
    setRentalScheduleState(schedule);
  };

  const setDeliveryQuote = (quote: any | null) => {
    setDeliveryQuoteState(quote);
  };

  // Calculate total: sum of all item costs (buy items as-is, rental items base cost)
  // Compute totals considering rental days
  const buyTotal = items.reduce((sum, item) => {
    return item.mode === 'buy' ? sum + item.price * item.quantity : sum;
  }, 0);

  const rentalTotal = items.reduce((sum, item) => {
    if (item.mode !== 'rent') return sum;
    const days = rentalSchedule?.rentalDays || item.rentalDays || 1;
    return sum + (item.price * item.quantity * days);
  }, 0);

  // subtotal used for VAT (goods/services only, NOT caution fee)
  const total = buyTotal + rentalTotal;

  // Caution fee: 50% per costume (quantity), NOT multiplied by rental days
  const rentalBaseForCaution = items.reduce((sum, item) => {
    if (item.mode !== 'rent') return sum;
    return sum + (item.price * item.quantity);
  }, 0);

  const cautionFee = rentalBaseForCaution * 0.5;

  // ===== VALIDATION FUNCTIONS =====
  
  /**
   * Validates if rental schedule is complete when rental items exist
   * @returns { valid: boolean, message: string } validation result
   */
  const validateRentalSchedule = () => {
    const hasRentalItems = items.some(item => item.mode === 'rent');
    console.log("🔍 validateRentalSchedule called - hasRentalItems:", hasRentalItems);
    console.log("🔍 items:", items);
    
    if (!hasRentalItems) {
      console.log("✅ No rental items, validation passes");
      return { valid: true, message: "" };
    }

    // Check if schedule exists and has all required fields
    if (!rentalSchedule) {
      console.log("❌ rentalSchedule is undefined/null");
      return { 
        valid: false, 
        message: "⏰ Pickup schedule not filled. Please fill the Rental Schedule form to proceed." 
      };
    }

    // Check each required field
    if (!rentalSchedule.pickupDate) {
      console.log("❌ pickupDate missing");
      return { 
        valid: false, 
        message: "⏰ Pickup date is required. Please fill the Rental Schedule form." 
      };
    }

    if (!rentalSchedule.pickupTime) {
      console.log("❌ pickupTime missing");
      return { 
        valid: false, 
        message: "⏰ Pickup time is required. Please fill the Rental Schedule form." 
      };
    }

    if (!rentalSchedule.returnDate) {
      console.log("❌ returnDate missing");
      return { 
        valid: false, 
        message: "⏰ Return date is required. Please fill the Rental Schedule form." 
      };
    }

    if (!rentalSchedule.pickupLocation) {
      console.log("❌ pickupLocation missing");
      return { 
        valid: false, 
        message: "⏰ Pickup location not selected. Please fill the Rental Schedule form." 
      };
    }

    console.log("✅ All rental schedule fields are valid");
    return { valid: true, message: "" };
  };

  /**
   * Validates if delivery information is complete when EMPI delivery is selected
   * @param shippingOption - Current shipping option selected
   * @returns { valid: boolean, message: string } validation result
   */
  const validateDeliveryInfo = (shippingOption: string) => {
    if (shippingOption !== "empi") {
      return { valid: true, message: "" };
    }

    if (!deliveryQuote) {
      return { 
        valid: false, 
        message: "🚚 Delivery address not filled. Please fill the EMPI Delivery form to proceed." 
      };
    }

    if (!deliveryState) {
      return { 
        valid: false, 
        message: "🚚 Delivery state not selected. Please fill the EMPI Delivery form." 
      };
    }

    return { valid: true, message: "" };
  };

  /**
   * Comprehensive checkout validation
   * @param shippingOption - Current shipping option selected
   * @param buyer - Buyer information (optional)
   * @returns { valid: boolean, message: string, type: string } detailed validation result
   */
  const validateCheckoutRequirements = (shippingOption: string, buyer?: any): { valid: boolean; message: string; type: "rental_schedule" | "delivery_info" | "buyer_info" | "success" } => {
    // Validate rental schedule first
    const rentalValidation = validateRentalSchedule();
    console.log("🔍 Rental validation result:", rentalValidation);
    console.log("🔍 rentalSchedule state:", rentalSchedule);
    console.log("🔍 hasRentalItems:", items.some(item => item.mode === 'rent'));
    
    if (!rentalValidation.valid) {
      return { 
        valid: false, 
        message: rentalValidation.message,
        type: "rental_schedule" as const
      };
    }

    // Validate delivery info
    const deliveryValidation = validateDeliveryInfo(shippingOption);
    if (!deliveryValidation.valid) {
      return { 
        valid: false, 
        message: deliveryValidation.message,
        type: "delivery_info" as const
      };
    }

    // Validate buyer information if provided
    if (buyer) {
      if (!buyer.fullName || buyer.fullName.trim() === "") {
        return { 
          valid: false, 
          message: "👤 Full name is required in your profile.",
          type: "buyer_info" as const
        };
      }

      if (!buyer.email || buyer.email.trim() === "") {
        return { 
          valid: false, 
          message: "📧 Email address is required in your profile.",
          type: "buyer_info" as const
        };
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(buyer.email)) {
        return { 
          valid: false, 
          message: "📧 Please provide a valid email address.",
          type: "buyer_info" as const
        };
      }

      if (!buyer.phone || buyer.phone.trim() === "") {
        return { 
          valid: false, 
          message: "📱 Phone number is required in your profile.",
          type: "buyer_info" as const
        };
      }
    }

    return { 
      valid: true, 
      message: "",
      type: "success" as const
    };
  };

  /**
   * Get the current mode of the cart (buy, rent, or null if empty)
   * @returns "buy" | "rent" | null
   */
  const getCartMode = (): "buy" | "rent" | null => {
    if (items.length === 0) return null;
    
    // All items should have the same mode, so just check the first one
    return items[0].mode;
  };

  /**
   * Validate if a new item can be added to the cart
   * Prevents mixing rental and purchase items in the same cart
   * @param itemMode - Mode of the item being added ("buy" or "rent")
   * @returns { canAdd: boolean, message: string, conflictingMode?: "buy" | "rent" }
   */
  const canAddItem = (itemMode: "buy" | "rent"): { 
    canAdd: boolean; 
    message: string;
    conflictingMode?: "buy" | "rent";
  } => {
    // If cart is empty, we can always add
    if (items.length === 0) {
      return { canAdd: true, message: "" };
    }

    const currentCartMode = getCartMode();

    // If the new item mode doesn't match the current cart mode, prevent it
    if (currentCartMode && currentCartMode !== itemMode) {
      return {
        canAdd: false,
        message: 
          currentCartMode === "rent"
            ? "🎪 Your cart contains rental items. You can only add rental items to this order. Please clear your cart to purchase items instead."
            : "🛒 Your cart contains purchase items. You can only add purchase items to this order. Please clear your cart to rent items instead.",
        conflictingMode: currentCartMode,
      };
    }

    return { canAdd: true, message: "" };
  };

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart, total, cautionFee, deliveryState, setDeliveryState, deliveryDistance, setDeliveryDistance, deliveryQuote, setDeliveryQuote, rentalSchedule, setRentalSchedule, validateRentalSchedule, validateDeliveryInfo, validateCheckoutRequirements, canAddItem, getCartMode }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
