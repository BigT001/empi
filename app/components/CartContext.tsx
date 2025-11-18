"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

export interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  mode: "buy" | "rent";
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string, mode: "buy" | "rent") => void;
  updateQuantity: (id: string, mode: "buy" | "rent", quantity: number) => void;
  clearCart: () => void;
  total: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

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
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart, total }}>
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
