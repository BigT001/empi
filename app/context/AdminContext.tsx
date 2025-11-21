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
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [admin, setAdmin] = useState<AdminProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if admin is already logged in
  useEffect(() => {
    console.log('[AdminContext] Mounting - checking auth on load');
    checkAuth();
  }, []);

  const checkAuth = async () => {
    console.log('[AdminContext] checkAuth() called');
    try {
      const response = await fetch('/api/admin/me', {
        method: 'GET',
        credentials: 'include',
      });

      console.log('[AdminContext] checkAuth response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('[AdminContext] ✅ Admin authenticated:', data.email);
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
        console.log('[AdminContext] ❌ Admin session expired or invalid (401)');
        setAdmin(null);
      } else {
        console.log('[AdminContext] ❌ Auth check failed with status:', response.status);
        setAdmin(null);
      }
    } catch (error) {
      console.error('[AdminContext] Auth check error:', error);
      setAdmin(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    console.log('[AdminContext] login() called for:', email);
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });

      console.log('[AdminContext] login response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Login failed');
      }

      const data = await response.json();
      console.log('[AdminContext] ✅ Login successful for:', data.email);
      setAdmin({
        id: data._id || data.id,
        email: data.email,
        fullName: data.fullName,
        role: data.role,
        permissions: data.permissions,
        lastLogin: data.lastLogin,
      });
    } catch (error) {
      console.error('[AdminContext] Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    // Clear state immediately first
    console.log('[AdminContext] logout() called');
    console.log('[AdminContext] Current admin state before logout:', admin?.email || 'null');
    
    setAdmin(null);
    console.log('[AdminContext] ✅ Admin state cleared to null');
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/admin/logout', {
        method: 'POST',
        credentials: 'include',
      });
      
      console.log('[AdminContext] logout API response status:', response.status);
      
      if (!response.ok) {
        console.error('[AdminContext] Logout API failed:', response.status);
      } else {
        console.log('[AdminContext] ✅ Logout API successful - session cleared on server');
      }
    } catch (error) {
      console.error('[AdminContext] Logout error:', error);
    } finally {
      setIsLoading(false);
      console.log('[AdminContext] logout() completed');
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
