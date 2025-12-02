"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";

interface ModeContextType {
  getMode: (productId: string) => "buy" | "rent";
  setMode: (productId: string, mode: "buy" | "rent") => void;
  isHydrated: boolean;
}

const ModeContext = createContext<ModeContextType | undefined>(undefined);
const STORAGE_KEY_PREFIX = "empi_product_mode_";

export function ModeProvider({ children }: { children: ReactNode }) {
  const [modes, setModes] = useState<Record<string, "buy" | "rent">>({});
  const [isHydrated, setIsHydrated] = useState(false);

  // Load all modes from localStorage on mount
  useEffect(() => {
    try {
      const loadedModes: Record<string, "buy" | "rent"> = {};
      const keys = Object.keys(localStorage);
      
      for (const key of keys) {
        if (key.startsWith(STORAGE_KEY_PREFIX)) {
          const productId = key.replace(STORAGE_KEY_PREFIX, "");
          const mode = localStorage.getItem(key);
          if (mode === "buy" || mode === "rent") {
            loadedModes[productId] = mode as "buy" | "rent";
          }
        }
      }
      
      setModes(loadedModes);
    } catch (error) {
      console.error("Failed to load product modes from localStorage", error);
    }
    setIsHydrated(true);
  }, []);

  const getMode = (productId: string): "buy" | "rent" => {
    return modes[productId] || "buy";
  };

  const setMode = (productId: string, newMode: "buy" | "rent") => {
    setModes((prev) => ({
      ...prev,
      [productId]: newMode,
    }));
    try {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}${productId}`, newMode);
    } catch (error) {
      console.error("Failed to save product mode to localStorage", error);
    }
  };

  return (
    <ModeContext.Provider value={{ getMode, setMode, isHydrated }}>
      {children}
    </ModeContext.Provider>
  );
}

export function useMode(productId: string, initialMode?: "buy" | "rent") {
  const context = useContext(ModeContext);
  if (!context) {
    throw new Error("useMode must be used within a ModeProvider");
  }
  
  const storedMode = context.getMode(productId);
  const mode = storedMode || initialMode || "buy";
  const setMode = (newMode: "buy" | "rent") => context.setMode(productId, newMode);
  
  return { mode, setMode, isHydrated: context.isHydrated };
}
