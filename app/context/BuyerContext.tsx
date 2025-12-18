"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";

export interface BuyerProfile {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  createdAt: string;
  lastLogin?: string;
  isAdmin?: boolean;
  preferredCurrency?: string;
  // Delivery details
  deliveryDetails?: {
    selectedState?: string;
    vehicleType?: "bike" | "car" | "van";
    deliveryAddress?: string;
    pickupLocation?: {
      id: string;
      name: string;
      address: string;
    };
    useGPS?: boolean;
    manualAddress?: string;
    rushDelivery?: boolean;
    weekendDelivery?: boolean;
    lastUpdated?: string;
  };
}

interface BuyerContextType {
  buyer: BuyerProfile | null;
  isLoggedIn: boolean;
  isHydrated: boolean;
  login: (buyer: BuyerProfile) => void;
  logout: () => void;
  updateProfile: (updates: Partial<BuyerProfile>) => void;
  register: (data: Omit<BuyerProfile, 'id' | 'createdAt' | 'lastLogin'>) => Promise<BuyerProfile | null>;
  loginByEmail: (email: string, phone: string) => Promise<BuyerProfile | null>;
}

const BuyerContext = createContext<BuyerContextType | undefined>(undefined);

// 🔒 SECURITY: Store ONLY non-sensitive preferences in localStorage
// Full profile is fetched from server via /api/auth/me which validates session
const MINIMAL_STORAGE_KEY = "empi_buyer_id";
const CURRENCY_STORAGE_KEY = "empi_preferred_currency";

export function BuyerProvider({ children }: { children: ReactNode }) {
  const [buyer, setBuyer] = useState<BuyerProfile | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  // 🔒 Load buyer profile from secure server endpoint on mount
  // Only use localStorage to check if user was logged in
  useEffect(() => {
    const loadBuyerProfile = async () => {
      try {
        // Try to fetch fresh profile from server (validates HTTP-only session cookie)
        const response = await fetch("/api/auth/me", { credentials: "include" });

        if (response.ok) {
          const data = await response.json();
          setBuyer(data.buyer);
          // Store only minimal info for quick checks
          localStorage.setItem(MINIMAL_STORAGE_KEY, data.buyer.id);
        } else {
          // Session invalid or expired - clear any stored data
          localStorage.removeItem(MINIMAL_STORAGE_KEY);
          localStorage.removeItem(CURRENCY_STORAGE_KEY);
        }
      } catch (error) {
        console.error("Failed to load buyer profile from server", error);
        localStorage.removeItem(MINIMAL_STORAGE_KEY);
      }

      setIsHydrated(true);
    };

    loadBuyerProfile();
  }, []);

  // 🔒 Save ONLY preferences to localStorage (NOT full profile with PII)
  // Full profile stays only in memory and server
  useEffect(() => {
    if (isHydrated) {
      if (buyer?.id) {
        try {
          // Store only user ID as indicator they were logged in
          localStorage.setItem(MINIMAL_STORAGE_KEY, buyer.id);
          // Store currency preference (user choice, not sensitive)
          if (buyer.preferredCurrency) {
            localStorage.setItem(CURRENCY_STORAGE_KEY, buyer.preferredCurrency);
          }
        } catch (error) {
          console.error("Failed to save minimal buyer data to localStorage", error);
        }
      } else {
        // Clear localStorage when logged out
        try {
          localStorage.removeItem(MINIMAL_STORAGE_KEY);
          localStorage.removeItem(CURRENCY_STORAGE_KEY);
        } catch (error) {
          console.error("Failed to clear buyer data from localStorage", error);
        }
      }
    }
  }, [buyer?.id, buyer?.preferredCurrency, isHydrated]);

  const login = (buyerData: BuyerProfile) => {
    const updatedBuyer = {
      ...buyerData,
      lastLogin: new Date().toISOString(),
    };
    setBuyer(updatedBuyer);
  };

  const logout = async () => {
    console.log("🔐 Logging out user...");
    
    try {
      // Call server to clear session
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include", // Include HTTP-only session cookie
      });

      if (!response.ok) {
        console.error("Server logout failed, but clearing local session");
      } else {
        console.log("✅ Server session cleared");
      }
    } catch (error) {
      console.error("Error calling logout endpoint", error);
    }

    // Clear local state (this also clears localStorage via useEffect)
    setBuyer(null);
  };

  const register = async (data: Omit<BuyerProfile, 'id' | 'createdAt' | 'lastLogin'>): Promise<BuyerProfile | null> => {
    try {
      const response = await fetch("/api/buyers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to register");
      }

      const newBuyer = await response.json();
      setBuyer(newBuyer);
      return newBuyer;
    } catch (error) {
      console.error("Registration error:", error);
      // Fallback to local registration if API fails
      const localBuyer: BuyerProfile = {
        ...data,
        id: `BUYER-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
      };
      setBuyer(localBuyer);
      return localBuyer;
    }
  };

  const loginByEmail = async (email: string, phone: string): Promise<BuyerProfile | null> => {
    try {
      const response = await fetch(`/api/buyers?email=${encodeURIComponent(email)}`, {
        method: "GET",
      });

      if (!response.ok) {
        console.log("Buyer not found, skipping DB login");
        return null;
      }

      const buyerData = await response.json();
      login(buyerData);
      return buyerData;
    } catch (error) {
      console.error("Login error:", error);
      return null;
    }
  };

  const updateProfile = (updates: Partial<BuyerProfile>) => {
    if (buyer) {
      setBuyer({
        ...buyer,
        ...updates,
      });
    }
  };

  return (
    <BuyerContext.Provider
      value={{
        buyer,
        isLoggedIn: !!buyer,
        isHydrated,
        login,
        logout,
        updateProfile,
        register,
        loginByEmail,
      }}
    >
      {children}
    </BuyerContext.Provider>
  );
}

export function useBuyer() {
  const context = useContext(BuyerContext);
  if (!context) {
    throw new Error("useBuyer must be used within BuyerProvider");
  }
  return context;
}
