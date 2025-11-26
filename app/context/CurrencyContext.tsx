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

  // Load currency from localStorage and buyer profile on mount/login
  useEffect(() => {
    if (buyer?.id) {
      // If user is logged in, use their saved preference (or localStorage as fallback)
      const savedCurrency = localStorage.getItem("empi_currency");
      // Buyer's preference will be synced via session, but localStorage works as immediate fallback
      if (savedCurrency) {
        setCurrency(savedCurrency);
      }
    } else {
      // If not logged in, use localStorage
      const savedCurrency = localStorage.getItem("empi_currency");
      if (savedCurrency) {
        setCurrency(savedCurrency);
      }
    }
    setIsHydrated(true);
  }, [buyer?.id]);

  // Save currency to localStorage and buyer profile whenever it changes
  const handleSetCurrency = async (newCurrency: string) => {
    setCurrency(newCurrency);
    
    // Always save to localStorage
    localStorage.setItem("empi_currency", newCurrency);

    // If user is logged in, also save to their profile
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
        // Still keep localStorage update even if API fails
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
