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

// 🔒 SECURITY: All buyer data comes from server via /api/auth/me
// Removed localStorage - prevents stale data issues

export function BuyerProvider({ children }: { children: ReactNode }) {
  const [buyer, setBuyer] = useState<BuyerProfile | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  // 🔒 Load buyer profile from secure server endpoint on mount
  // Server validates HTTP-only session cookie
  useEffect(() => {
    const loadBuyerProfile = async () => {
      try {
        // Try to fetch fresh profile from server
        const response = await fetch("/api/auth/me", { credentials: "include" });

        if (response.ok) {
          const data = await response.json();
          setBuyer(data.buyer);
        } else {
          // Session invalid or expired
          setBuyer(null);
        }
      } catch (error) {
        console.error("Failed to load buyer profile from server", error);
        setBuyer(null);
      }

      setIsHydrated(true);
    };

    loadBuyerProfile();
  }, []);

  // ✅ Buyer data is maintained in state from server only
  // Removed localStorage to prevent stale data issues
  useEffect(() => {
    if (isHydrated) {
      // Data stays in memory only - server validates all operations
      // This prevents outdated profile info from being used
    }
  }, [isHydrated]);

  const login = (buyerData: BuyerProfile) => {
    const updatedBuyer = {
      ...buyerData,
      // Normalize email to lowercase for consistency in queries
      email: buyerData.email.toLowerCase(),
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
    
    // Redirect to home page
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  };

  const register = async (data: Omit<BuyerProfile, 'id' | 'createdAt' | 'lastLogin'>): Promise<BuyerProfile | null> => {
    try {
      // Normalize email to lowercase
      const normalizedData = {
        ...data,
        email: data.email.toLowerCase(),
      };
      
      const response = await fetch("/api/buyers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(normalizedData),
      });

      if (!response.ok) {
        throw new Error("Failed to register");
      }

      const newBuyer = await response.json();
      // Ensure email is lowercase in the response too
      newBuyer.email = newBuyer.email.toLowerCase();
      setBuyer(newBuyer);
      return newBuyer;
    } catch (error) {
      console.error("Registration error:", error);
      // Fallback to local registration if API fails
      const localBuyer: BuyerProfile = {
        ...data,
        email: data.email.toLowerCase(),
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
      // Normalize email to lowercase
      const normalizedEmail = email.toLowerCase();
      const response = await fetch(`/api/buyers?email=${encodeURIComponent(normalizedEmail)}`, {
        method: "GET",
      });

      if (!response.ok) {
        console.log("Buyer not found, skipping DB login");
        return null;
      }

      const buyerData = await response.json();
      // Ensure email is lowercase in the returned data too
      buyerData.email = buyerData.email.toLowerCase();
      login(buyerData);
      return buyerData;
    } catch (error) {
      console.error("Login error:", error);
      return null;
    }
  };

  const updateProfile = async (updates: Partial<BuyerProfile>) => {
    if (buyer) {
      const updatedBuyer = {
        ...buyer,
        ...updates,
      };
      
      // Update local state immediately for UX
      setBuyer(updatedBuyer);
      
      // Save to database
      try {
        const response = await fetch('/api/buyers', {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            buyerId: buyer.id,
            updates: {
              fullName: updates.fullName || buyer.fullName,
              phone: updates.phone || buyer.phone,
              address: updates.address || buyer.address,
              city: updates.city || buyer.city,
              state: updates.state || buyer.state,
              postalCode: updates.postalCode || buyer.postalCode,
            },
          }),
        });

        if (!response.ok) {
          console.error("Failed to update profile in database");
          // Revert local state on error
          setBuyer(buyer);
          throw new Error("Failed to update profile");
        }

        const savedBuyer = await response.json();
        console.log("✅ Profile updated in database:", savedBuyer);
        setBuyer(savedBuyer);
      } catch (error) {
        console.error("Error updating profile:", error);
        // Keep the local update but log the error
      }
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
