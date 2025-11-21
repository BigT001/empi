'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

export interface AdminProfile {
  id: string;
  email: string;
  fullName: string;
  role: 'super_admin' | 'admin';
  permissions: string[];
  lastLogin?: Date;
}

interface AdminContextType {
  admin: AdminProfile | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [admin, setAdmin] = useState<AdminProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if admin is already logged in
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/admin/me', {
        method: 'GET',
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setAdmin({
          id: data._id || data.id,
          email: data.email,
          fullName: data.fullName,
          role: data.role,
          permissions: data.permissions,
          lastLogin: data.lastLogin,
        });
      } else {
        setAdmin(null);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setAdmin(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Login failed');
      }

      const data = await response.json();
      setAdmin({
        id: data._id || data.id,
        email: data.email,
        fullName: data.fullName,
        role: data.role,
        permissions: data.permissions,
        lastLogin: data.lastLogin,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/admin/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear admin state regardless of API response
      setAdmin(null);
      // Force page reload to ensure all state is cleared
      if (typeof window !== 'undefined') {
        window.location.href = '/admin/login';
      }
    }
  };

  return (
    <AdminContext.Provider value={{ admin, isLoading, login, logout, checkAuth }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within AdminProvider');
  }
  return context;
}
