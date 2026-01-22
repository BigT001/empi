"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

interface ModeContextType {
  getMode: (productId: string) => "buy" | "rent";
  setMode: (productId: string, mode: "buy" | "rent") => void;
  isHydrated: boolean;
}

const ModeContext = createContext<ModeContextType | undefined>(undefined);

// ✅ Removed localStorage - product mode is selected per session, not persisted
export function ModeProvider({ children }: { children: ReactNode }) {
  const [modes, setModes] = useState<Record<string, "buy" | "rent">>({});
  const [isHydrated, setIsHydrated] = useState(true);

  // Product modes are session-only (not persisted)
  // This prevents stale mode preferences from old shopping sessions

  const getMode = (productId: string): "buy" | "rent" => {
    return modes[productId] || "buy";
  };

  const setMode = (productId: string, newMode: "buy" | "rent") => {
    setModes((prev) => ({
      ...prev,
      [productId]: newMode,
    }));
    // No localStorage - modes are session-only
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
