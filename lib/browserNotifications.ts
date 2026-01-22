/**
 * 🔔 BROWSER NOTIFICATION UTILITY
 * Handles desktop push notifications for admins
 * Uses the Notifications API to display browser notifications
 */

/**
 * Request permission to show notifications
 * Call this when admin enables notifications in settings
 */
export async function requestNotificationPermission(): Promise<boolean> {
  // Check if browser supports Notifications API
  if (!('Notification' in window)) {
    console.warn('🔔 Browser does not support Notifications API');
    return false;
  }

  // If permission already granted, return true
  if (Notification.permission === 'granted') {
    console.log('✅ Notification permission already granted');
    return true;
  }

  // If permission denied, can't request again
  if (Notification.permission === 'denied') {
    console.warn('❌ Notification permission denied by user');
    return false;
  }

  // Permission is 'default', ask user
  try {
    const permission = await Notification.requestPermission();
    console.log(`📢 Notification permission: ${permission}`);
    return permission === 'granted';
  } catch (error) {
    console.error('❌ Error requesting notification permission:', error);
    return false;
  }
}

/**
 * Show a desktop notification
 */
export function showNotification(
  title: string,
  options?: NotificationOptions & { autoClose?: number }
): Notification | null {
  // Check if permission is granted
  if (Notification.permission !== 'granted') {
    console.warn('🔔 Notification permission not granted');
    return null;
  }

  try {
    const { autoClose, ...notificationOptions } = options || {};

    const notification = new Notification(title, {
      icon: '/logo.png',
      badge: '/badge-icon.png',
      ...notificationOptions,
    });

    // Auto-close notification after specified time (default: 5 seconds)
    if (autoClose) {
      setTimeout(() => {
        notification.close();
      }, autoClose);
    }

    // Click handler to focus window
    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    return notification;
  } catch (error) {
    console.error('❌ Error showing notification:', error);
    return null;
  }
}

/**
 * Show admin notification for new order
 */
export function showNewOrderNotification(orderNumber: string, customerName: string, amount: number): Notification | null {
  return showNotification('🆕 New Order Alert!', {
    body: `Order #${orderNumber} from ${customerName} - ₦${amount.toLocaleString('en-NG')}`,
    tag: `order-${orderNumber}`, // Prevents duplicates
    requireInteraction: true, // Keep until user interacts
    autoClose: 10000, // 10 seconds
  });
}

/**
 * Check if notifications are supported and allowed
 */
export function notificationsEnabled(): boolean {
  return 'Notification' in window && Notification.permission === 'granted';
}

/**
 * Get current notification permission status
 */
export function getNotificationPermission(): NotificationPermission | null {
  if (!('Notification' in window)) {
    return null;
  }
  return Notification.permission;
}

/**
 * Setup WebSocket listener for real-time order notifications
 * This connects to your Socket.io or WebSocket server
 */
export function setupRealtimeOrderNotifications(userId: string): void {
  // This would typically connect to your WebSocket/Socket.io server
  // For example:
  /*
  const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL);
  
  socket.on('new-order', (data) => {
    if (notificationsEnabled()) {
      showNewOrderNotification(
        data.orderNumber,
        data.customerName,
        data.amount
      );
    }
  });

  socket.on('order-ready', (data) => {
    showNotification('🎉 Order Ready!', {
      body: `Order #${data.orderNumber} is ready for delivery`,
    });
  });
  */
  
  console.log('🔌 Real-time order notifications setup would be initialized');
}
