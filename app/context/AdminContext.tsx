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
  sessionError: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

// Session validation interval (check every 5 minutes)
const SESSION_CHECK_INTERVAL = 5 * 60 * 1000;

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [admin, setAdmin] = useState<AdminProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionError, setSessionError] = useState<string | null>(null);

  // Check if admin is already logged in
  useEffect(() => {
    console.log('[AdminContext] Mounting - checking auth on load');
    checkAuth();
  }, []);

  // Set up periodic session validation
  useEffect(() => {
    if (!admin) return;

    console.log('[AdminContext] Setting up session validation interval (every 5 minutes)');
    const intervalId = setInterval(() => {
      console.log('[AdminContext] Running periodic session validation...');
      checkAuth();
    }, SESSION_CHECK_INTERVAL);

    return () => {
      console.log('[AdminContext] Clearing session validation interval');
      clearInterval(intervalId);
    };
  }, [admin]);

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
        setSessionError(null); // Clear any previous errors
      } else if (response.status === 401) {
        // Session expired or invalid
        console.log('[AdminContext] ❌ Admin session expired or invalid (401)');
        const errorData = await response.json().catch(() => ({}));
        setSessionError(errorData.error || 'Session expired. Please log in again.');
        setAdmin(null);
      } else {
        console.log('[AdminContext] ❌ Auth check failed with status:', response.status);
        setSessionError('Authentication check failed. Please try again.');
        setAdmin(null);
      }
    } catch (error) {
      console.error('[AdminContext] Auth check error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Network error. Please check your connection.';
      setSessionError(errorMessage);
      setAdmin(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    console.log('[AdminContext] login() called for:', email);
    setIsLoading(true);
    setSessionError(null);
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
        const errorMessage = errorData.error || 'Login failed';
        setSessionError(errorMessage);
        throw new Error(errorMessage);
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
      setSessionError(null); // Clear any previous errors
    } catch (error) {
      console.error('[AdminContext] Login error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Login failed. Please try again.';
      setSessionError(errorMessage);
      throw error; // Re-throw for component to handle
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    // Clear state immediately first
    console.log('[AdminContext] logout() called');
    console.log('[AdminContext] Current admin state before logout:', admin?.email || 'null');
    
    const adminEmail = admin?.email;
    setAdmin(null);
    setSessionError(null);
    console.log('[AdminContext] ✅ Admin state cleared to null');
    setIsLoading(true);
    
    // Retry logic for logout API
    const maxRetries = 3;
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`[AdminContext] Logout attempt ${attempt}/${maxRetries}...`);
        const response = await fetch('/api/admin/logout', {
          method: 'POST',
          credentials: 'include',
        });
        
        console.log('[AdminContext] logout API response status:', response.status);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const error = new Error(errorData.error || `Logout failed with status ${response.status}`);
          lastError = error;
          
          // Only retry on network errors or 5xx errors, not 4xx
          if (response.status >= 400 && response.status < 500 && response.status !== 408) {
            console.error(`[AdminContext] ❌ Client error (${response.status}), not retrying`);
            break;
          }
          
          if (attempt < maxRetries) {
            console.log(`[AdminContext] Retrying logout in 1 second...`);
            await new Promise(resolve => setTimeout(resolve, 1000));
            continue;
          }
          throw error;
        }

        console.log('[AdminContext] ✅ Logout API successful - session cleared on server');
        lastError = null;
        break;
      } catch (error) {
        console.error(`[AdminContext] Logout error on attempt ${attempt}:`, error);
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (attempt < maxRetries) {
          console.log(`[AdminContext] Retrying logout in 1 second...`);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }
    
    setIsLoading(false);
    
    if (lastError) {
      console.error('[AdminContext] ❌ Logout failed after all retries:', lastError.message);
      setSessionError(`Logout failed: ${lastError.message}`);
      // Even if logout API fails, we've already cleared the client state
      // The session will expire naturally on the server after 7 days
    } else {
      console.log('[AdminContext] ✅ logout() completed successfully for:', adminEmail);
    }
  };

  return (
    <AdminContext.Provider value={{ admin, isLoading, sessionError, login, logout, checkAuth }}>
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
