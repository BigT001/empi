// Notification system with sound alerts for admin and users

export type NotificationType = 'order_approved' | 'order_completed' | 'order_rejected' | 'payment_received' | 'chat_message';
export type NotificationTarget = 'admin' | 'buyer';

interface Notification {
  id: string;
  type: NotificationType;
  target: NotificationTarget;
  title: string;
  message: string;
  orderId?: string;
  orderNumber?: string;
  timestamp: Date;
  read: boolean;
  soundEnabled: boolean;
  smsEnabled: boolean;
}

// Play notification sound
export const playNotificationSound = (type: NotificationType = 'order_approved') => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Different sounds for different notification types
    switch (type) {
      case 'order_approved':
        // Success sound - ascending notes
        oscillator.frequency.value = 800;
        oscillator.frequency.exponentialRampToValueAtTime(1000, audioContext.currentTime + 0.1);
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.2);
        break;

      case 'payment_received':
        // Payment sound - two ascending beeps
        oscillator.frequency.value = 600;
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.15);

        const osc2 = audioContext.createOscillator();
        const gain2 = audioContext.createGain();
        osc2.connect(gain2);
        gain2.connect(audioContext.destination);
        osc2.frequency.value = 800;
        gain2.gain.setValueAtTime(0.3, audioContext.currentTime + 0.2);
        gain2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.35);
        osc2.start(audioContext.currentTime + 0.2);
        osc2.stop(audioContext.currentTime + 0.35);
        break;

      case 'chat_message':
        // Message sound - quick beep
        oscillator.frequency.value = 1000;
        gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
        break;

      default:
        oscillator.frequency.value = 700;
        gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.15);
    }
  } catch (err) {
    console.error('Error playing notification sound:', err);
  }
};

// Request notification permission
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) {
    console.log('Browser does not support notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
};

// Show browser notification
export const showBrowserNotification = (title: string, options?: NotificationOptions) => {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, {
      icon: '/logo.png',
      badge: '/logo.png',
      ...options,
    });
  }
};

// Send SMS notification (calls backend)
export const sendSMSNotification = async (
  phoneNumber: string,
  message: string,
  type: NotificationType
): Promise<boolean> => {
  try {
    const res = await fetch('/api/notifications/sms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phoneNumber,
        message,
        type,
      }),
    });

    return res.ok;
  } catch (err) {
    console.error('Error sending SMS notification:', err);
    return false;
  }
};

// Create and send notification
export const sendNotification = async (
  notification: Omit<Notification, 'id' | 'timestamp'>
): Promise<boolean> => {
  try {
    const res = await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(notification),
    });

    if (res.ok) {
      // Play sound if enabled
      if (notification.soundEnabled) {
        playNotificationSound(notification.type);
      }

      // Show browser notification
      showBrowserNotification(notification.title, {
        body: notification.message,
        tag: notification.orderId,
      });

      return true;
    }
    return false;
  } catch (err) {
    console.error('Error sending notification:', err);
    return false;
  }
};

// Get notifications for user
export const getNotifications = async (
  target: NotificationTarget,
  limit: number = 50
): Promise<Notification[]> => {
  try {
    const res = await fetch(`/api/notifications?target=${target}&limit=${limit}`);
    if (res.ok) {
      return res.json();
    }
    return [];
  } catch (err) {
    console.error('Error fetching notifications:', err);
    return [];
  }
};

// Mark notification as read
export const markNotificationAsRead = async (notificationId: string): Promise<boolean> => {
  try {
    const res = await fetch(`/api/notifications/${notificationId}/read`, {
      method: 'PATCH',
    });
    return res.ok;
  } catch (err) {
    console.error('Error marking notification as read:', err);
    return false;
  }
};
