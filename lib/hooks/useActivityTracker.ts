'use client';

import { useEffect, useRef } from 'react';

/**
 * Hook to track user activity and reset session inactivity timeout
 * Monitors: mouse, keyboard, scroll, touch, focus
 * Sends activity signals to server via /api/admin/session-check endpoint
 */
export function useActivityTracker() {
  const activityTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const isActiveRef = useRef<boolean>(true);

  // Activity check interval: check every 5 minutes to see if we need to validate
  // This ensures the session stays alive as long as there's been activity
  const ACTIVITY_CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes

  useEffect(() => {
    const handleActivity = () => {
      lastActivityRef.current = Date.now();
      isActiveRef.current = true;

      // Clear any existing timeout
      if (activityTimeoutRef.current) {
        clearTimeout(activityTimeoutRef.current);
      }

      // Schedule next validation check
      activityTimeoutRef.current = setTimeout(() => {
        validateSession();
      }, ACTIVITY_CHECK_INTERVAL);

      console.log('[ActivityTracker] User activity detected at', new Date(lastActivityRef.current).toLocaleTimeString());
    };

    const validateSession = async () => {
      try {
        console.log('[ActivityTracker] Validating session to reset inactivity timer...');
        const response = await fetch('/api/admin/session-check', {
          method: 'POST',
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          console.log('[ActivityTracker] ✅ Session validated - inactivity: ', data.sessionInfo?.inactivityMinutes, 'minutes');
          
          // Reschedule the next validation
          if (activityTimeoutRef.current) {
            clearTimeout(activityTimeoutRef.current);
          }
          activityTimeoutRef.current = setTimeout(() => {
            validateSession();
          }, ACTIVITY_CHECK_INTERVAL);
        } else {
          console.log('[ActivityTracker] ❌ Session validation failed:', response.status);
        }
      } catch (error) {
        console.error('[ActivityTracker] Error validating session:', error);
      }
    };

    // List of events that indicate user activity
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click', 'focus'];

    // Add event listeners
    events.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    // Initial validation check after interval
    activityTimeoutRef.current = setTimeout(() => {
      validateSession();
    }, ACTIVITY_CHECK_INTERVAL);

    // Cleanup on unmount
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
      if (activityTimeoutRef.current) {
        clearTimeout(activityTimeoutRef.current);
      }
    };
  }, []);

  return {
    isActive: isActiveRef.current,
    lastActivity: new Date(lastActivityRef.current),
  };
}
