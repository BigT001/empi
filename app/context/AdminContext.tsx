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
      } else if (response.status === 401) {
        // Session expired or invalid
        console.log('Admin session expired or invalid');
        setAdmin(null);
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
      const response = await fetch('/api/admin/logout', {
        method: 'POST',
        credentials: 'include',
      });
      
      if (!response.ok) {
        console.error('Logout API failed:', response.status);
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Always clear state immediately
      console.log('Clearing admin state');
      setAdmin(null);
      setIsLoading(false);
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
