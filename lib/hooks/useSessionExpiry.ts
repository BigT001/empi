/**
 * Hook to detect session expiry and redirect to login
 * Used in protected routes to automatically logout when session expires
 */

'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAdmin } from '@/app/context/AdminContext';

/**
 * Hook for automatic session expiry handling
 * Detects 401 responses and redirects to login
 * Also handles sessionError from context
 */
export function useSessionExpiry() {
  const router = useRouter();
  const { admin, sessionError } = useAdmin();
  const hasRedirected = useRef(false);

  useEffect(() => {
    // Prevent duplicate redirects
    if (hasRedirected.current) return;

    // ONLY redirect if we have an explicit sessionError (401 from API)
    // Don't redirect just because admin is null - there might be other reasons
    if (sessionError && !admin && !hasRedirected.current) {
      console.log('[useSessionExpiry] Detected session expiry (401), redirecting to login:', sessionError);
      hasRedirected.current = true;
      // Use setTimeout to ensure React state updates are complete
      setTimeout(() => {
        router.push('/admin/login?expired=true');
      }, 500);
    }
  }, [admin, sessionError, router]);

  return { sessionError };
}

/**
 * Hook for handling API 401 responses
 * Can be used in any component making API calls
 */
export function useHandleUnauthorized() {
  const router = useRouter();

  const handleUnauthorized = async (response: Response) => {
    if (response.status === 401) {
      console.log('[useHandleUnauthorized] 401 received, redirecting to login');
      // Clear session from context via a logout-like action
      setTimeout(() => {
        router.push('/admin/login?expired=true');
      }, 500);
      return true;
    }
    return false;
  };

  return { handleUnauthorized };
}
