'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

export interface AdminProfile {
  id: string;
  email: string;
  fullName: string;
  role: 'super_admin' | 'admin' | 'finance_admin' | 'logistics_admin';
  permissions: string[];
  department?: 'general' | 'finance' | 'logistics';
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

// Session validation - disabled
// Sessions are now persistent until manual logout
// The server extends session on each request (sliding window)

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [admin, setAdmin] = useState<AdminProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false);
  const authCheckAttempted = React.useRef(false);

  // Check if admin is already logged in
  useEffect(() => {
    if (authCheckAttempted.current) return;
    authCheckAttempted.current = true;
    
    console.log('[AdminContext] Mounting - checking auth on load');
    checkAuth();
  }, []);

  // Session is now persistent - no periodic validation
  // Server extends session on each API call using sliding window
  // Admin only logs out when manually clicking the logout button

  const checkAuth = async (retryCount = 0) => {
    console.log(`[AdminContext] checkAuth() called (attempt ${retryCount + 1})`);
    try {
      const response = await fetch('/api/admin/me', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
        },
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
        setSessionError(null);
        setHasCheckedAuth(true);
        setIsLoading(false);
        return;
      } else if (response.status === 401) {
        // Session expired or invalid - ONLY set sessionError for explicit 401
        console.log('[AdminContext] ❌ Admin session expired or invalid (401)');
        const errorData = await response.json().catch(() => ({}));
        setSessionError(errorData.error || 'Session expired. Please log in again.');
        setAdmin(null);
        setHasCheckedAuth(true);
        setIsLoading(false);
        return;
      } else if (response.status >= 500) {
        // Server error - retry after delay
        if (retryCount < 2) {
          console.log('[AdminContext] ⚠️ Server error, retrying...');
          await new Promise(resolve => setTimeout(resolve, 500 * (retryCount + 1)));
          return checkAuth(retryCount + 1);
        }
      }
      
      // Other non-401 errors or final retry failed
      console.log('[AdminContext] ⚠️ Auth check returned status:', response.status);
      setAdmin(null);
      setHasCheckedAuth(true);
      setIsLoading(false);
    } catch (error) {
      console.error('[AdminContext] Auth check error:', error);
      
      // Network error - retry once
      if (retryCount < 1) {
        console.log('[AdminContext] Network error, retrying in 500ms...');
        await new Promise(resolve => setTimeout(resolve, 500));
        return checkAuth(retryCount + 1);
      }
      
      console.log('[AdminContext] Auth check failed after retries');
      setAdmin(null);
      setHasCheckedAuth(true);
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
