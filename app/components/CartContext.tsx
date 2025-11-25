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
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string, mode: "buy" | "rent") => void;
  updateQuantity: (id: string, mode: "buy" | "rent", quantity: number) => void;
  clearCart: () => void;
  total: number;
  // Delivery state
  deliveryState: string | null;
  setDeliveryState: (state: string | null) => void;
  deliveryDistance: number;
  setDeliveryDistance: (distance: number) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);
const STORAGE_KEY = "empi_cart_context";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);
  const [deliveryState, setDeliveryState] = useState<string | null>(null);
  const [deliveryDistance, setDeliveryDistance] = useState(50);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setItems(JSON.parse(stored));
      }
      const savedState = localStorage.getItem("empi_delivery_state");
      if (savedState) {
        setDeliveryState(savedState);
      }
      const savedDistance = localStorage.getItem("empi_delivery_distance");
      if (savedDistance) {
        setDeliveryDistance(parseInt(savedDistance, 10));
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
      localStorage.setItem("empi_delivery_state", deliveryState);
    } else {
      localStorage.removeItem("empi_delivery_state");
    }
  }, [deliveryState]);

  // Save delivery distance
  useEffect(() => {
    localStorage.setItem("empi_delivery_distance", deliveryDistance.toString());
  }, [deliveryDistance]);

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
    setItems([]);
  };

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart, total, deliveryState, setDeliveryState, deliveryDistance, setDeliveryDistance }}>
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
