import { useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook for managing real-time message updates using polling
 * @param orderId - The order ID to poll messages for
 * @param callback - Callback function to call when new messages are fetched
 * @param interval - Polling interval in milliseconds (default 1500ms)
 */
export function useRealtimeMessages(
  orderId: string,
  callback: (messages: any[]) => void,
  interval: number = 1500
) {
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastFetchRef = useRef<number>(0);

  const fetchMessages = useCallback(async () => {
    try {
      const now = Date.now();
      // Debounce rapid calls (within 500ms)
      if (now - lastFetchRef.current < 500) {
        return;
      }
      lastFetchRef.current = now;

      const response = await fetch(`/api/messages?orderId=${orderId}`);
      const data = await response.json();
      
      if (data.success && Array.isArray(data.messages)) {
        callback(data.messages);
      }
    } catch (error) {
      console.error('[useRealtimeMessages] Error fetching messages:', error);
    }
  }, [orderId, callback]);

  useEffect(() => {
    // Start polling
    pollingIntervalRef.current = setInterval(fetchMessages, interval);

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [fetchMessages, interval]);

  // Return a function to manually trigger fetch
  return fetchMessages;
}

/**
 * Custom hook for managing real-time order updates
 * @param callback - Callback function to call when orders are fetched
 * @param interval - Polling interval in milliseconds (default 2000ms)
 */
export function useRealtimeOrders(
  callback: () => void,
  interval: number = 2000
) {
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Start polling
    pollingIntervalRef.current = setInterval(callback, interval);

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [callback, interval]);
}
