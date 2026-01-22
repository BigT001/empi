/**
 * 🔔 useAdminNotifications Hook
 * React hook for managing admin notifications
 * Enables/disables notifications and listens for new orders
 */

import { useEffect, useState, useCallback } from 'react';
import {
  requestNotificationPermission,
  notificationsEnabled,
  getNotificationPermission,
  showNewOrderNotification,
  setupRealtimeOrderNotifications,
} from '@/lib/browserNotifications';

interface UseAdminNotificationsOptions {
  userId?: string;
  onNewOrder?: (order: any) => void;
  autoEnable?: boolean;
}

export function useAdminNotifications(options: UseAdminNotificationsOptions = {}) {
  const {
    userId,
    onNewOrder,
    autoEnable = true,
  } = options;

  const [notificationsActive, setNotificationsActive] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission | null>(null);
  const [loading, setLoading] = useState(true);

  // Check current notification status on mount
  useEffect(() => {
    const status = getNotificationPermission();
    setPermissionStatus(status);
    setNotificationsActive(notificationsEnabled());
    setLoading(false);
  }, []);

  // Enable notifications
  const enableNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const granted = await requestNotificationPermission();
      setNotificationsActive(granted);
      setPermissionStatus(granted ? 'granted' : 'denied');
      
      if (granted && userId) {
        setupRealtimeOrderNotifications(userId);
      }
      
      return granted;
    } catch (error) {
      console.error('Error enabling notifications:', error);
      return false;
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Disable notifications (user preference)
  const disableNotifications = useCallback(() => {
    setNotificationsActive(false);
    // Store preference in localStorage
    localStorage.setItem('admin-notifications-disabled', 'true');
  }, []);

  // Show test notification
  const showTestNotification = useCallback(() => {
    if (notificationsActive) {
      showNewOrderNotification(
        'TEST-123',
        'Test Customer',
        50000
      );
    }
  }, [notificationsActive]);

  // Handle new order event
  const handleNewOrder = useCallback((order: any) => {
    if (notificationsActive && onNewOrder) {
      showNewOrderNotification(
        order.orderNumber,
        order.buyerName || 'Customer',
        order.amount || 0
      );
      onNewOrder(order);
    }
  }, [notificationsActive, onNewOrder]);

  return {
    notificationsActive,
    permissionStatus,
    loading,
    enableNotifications,
    disableNotifications,
    showTestNotification,
    handleNewOrder,
  };
}
