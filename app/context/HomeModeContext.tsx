"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import { useBuyer } from "./BuyerContext";

interface HomeModeContextType {
  mode: "buy" | "rent";
  setMode: (newMode: "buy" | "rent") => void;
  isHydrated: boolean;
}

const HomeModeContext = createContext<HomeModeContextType | undefined>(undefined);

// ✅ Removed localStorage - home mode selection is session-only
export function HomeModeProvider({ children }: { children: ReactNode }) {
  const { buyer } = useBuyer();
  const [mode, setModeState] = useState<"buy" | "rent">("buy");
  const [isHydrated, setIsHydrated] = useState(true);

  // Home mode starts as "buy" every session
  // No localStorage persistence to prevent stale preferences

  const setMode = (newMode: "buy" | "rent") => {
    setModeState(newMode);
    // No localStorage - mode is session-only state
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
