"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { useBuyer } from "./BuyerContext";

interface HomeModeContextType {
  mode: "buy" | "rent";
  setMode: (newMode: "buy" | "rent") => void;
  isHydrated: boolean;
}

const HomeModeContext = createContext<HomeModeContextType | undefined>(undefined);

// Generate a unique key based on buyer ID or device
const getStorageKey = (buyerId?: string) => {
  if (buyerId) {
    return `empi_home_mode_${buyerId}`;
  }
  // For guests, use a device-specific key
  return "empi_home_mode_guest";
};

export function HomeModeProvider({ children }: { children: ReactNode }) {
  const { buyer } = useBuyer();
  const [mode, setModeState] = useState<"buy" | "rent">("buy");
  const [isHydrated, setIsHydrated] = useState(false);

  // Load mode from localStorage on mount or when buyer changes
  useEffect(() => {
    try {
      const storageKey = getStorageKey(buyer?.id);
      const stored = localStorage.getItem(storageKey);
      
      if (stored === "buy" || stored === "rent") {
        setModeState(stored);
      } else {
        // Default to "buy" if nothing is stored
        setModeState("buy");
      }
    } catch (error) {
      console.error("Failed to load home mode from localStorage", error);
      setModeState("buy");
    }
    setIsHydrated(true);
  }, [buyer?.id]);

  const setMode = (newMode: "buy" | "rent") => {
    setModeState(newMode);
    try {
      const storageKey = getStorageKey(buyer?.id);
      localStorage.setItem(storageKey, newMode);
    } catch (error) {
      console.error("Failed to save home mode to localStorage", error);
    }
  };

  return (
    <HomeModeContext.Provider value={{ mode, setMode, isHydrated }}>
      {children}
    </HomeModeContext.Provider>
  );
}

export function useHomeMode() {
  const context = useContext(HomeModeContext);
  if (!context) {
    throw new Error("useHomeMode must be used within a HomeModeProvider");
  }
  return context;
}
