"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useBuyer } from "./BuyerContext";

interface CurrencyContextType {
  currency: string;
  setCurrency: (currency: string) => void;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrency] = useState<string>("NGN");
  const [isHydrated, setIsHydrated] = useState(false);
  const { buyer } = useBuyer();

  // Load currency from buyer profile on mount/login
  useEffect(() => {
    if (buyer?.preferredCurrency) {
      // Use buyer's preference from server
      setCurrency(buyer.preferredCurrency);
    } else {
      // Default to NGN
      setCurrency("NGN");
    }
    setIsHydrated(true);
  }, [buyer?.preferredCurrency]);

  // Save currency to buyer profile whenever it changes
  const handleSetCurrency = async (newCurrency: string) => {
    setCurrency(newCurrency);

    // If user is logged in, save to their profile
    if (buyer?.id) {
      try {
        await fetch("/api/buyers/currency", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            buyerId: buyer.id,
            currency: newCurrency,
          }),
        });
      } catch (error) {
        console.error("Failed to save currency preference to profile:", error);
      }
    }
  };

  if (!isHydrated) {
    return null; // Prevent hydration mismatch
  }

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency: handleSetCurrency }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return context;
}
