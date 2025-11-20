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
const STORAGE_KEY = "empi_buyer_profile";

export function BuyerProvider({ children }: { children: ReactNode }) {
  const [buyer, setBuyer] = useState<BuyerProfile | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const buyerData = JSON.parse(stored);
        setBuyer(buyerData);
      }
    } catch (error) {
      console.error("Failed to load buyer profile from localStorage", error);
    }
    setIsHydrated(true);
  }, []);

  // Save to localStorage whenever buyer changes
  useEffect(() => {
    if (isHydrated && buyer) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(buyer));
      } catch (error) {
        console.error("Failed to save buyer profile to localStorage", error);
      }
    }
  }, [buyer, isHydrated]);

  const login = (buyerData: BuyerProfile) => {
    const updatedBuyer = {
      ...buyerData,
      lastLogin: new Date().toISOString(),
    };
    setBuyer(updatedBuyer);
  };

  const logout = () => {
    setBuyer(null);
    localStorage.removeItem(STORAGE_KEY);
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
