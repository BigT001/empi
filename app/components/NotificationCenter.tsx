'use client';

import { useEffect, useState, useCallback } from 'react';
import { Bell, X, CheckCircle, AlertCircle, MessageCircle } from 'lucide-react';
import { playNotificationSound } from '@/lib/notifications';

interface NotificationItem {
  _id: string;
  type: 'order_approved' | 'order_completed' | 'order_rejected' | 'payment_received' | 'chat_message';
  target: 'admin' | 'buyer';
  title: string;
  message: string;
  orderId?: string;
  orderNumber?: string;
  read: boolean;
  soundEnabled: boolean;
  createdAt: string;
}

interface NotificationCenterProps {
  userType: 'admin' | 'buyer';
  userId?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function NotificationCenter({
  userType,
  userId,
  autoRefresh = true,
  refreshInterval = 5000,
}: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showPanel, setShowPanel] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasPlayedSound, setHasPlayedSound] = useState<Set<string>>(new Set());

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/notifications?target=${userType}&limit=20&unreadOnly=false`
      );
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
        
        // Count unread
        const unread = data.filter((n: NotificationItem) => !n.read).length;
        setUnreadCount(unread);

        // Play sound for new unread notifications
        data.forEach((notif: NotificationItem) => {
          if (!notif.read && notif.soundEnabled && !hasPlayedSound.has(notif._id)) {
            playNotificationSound(notif.type);
            setHasPlayedSound(prev => new Set([...prev, notif._id]));
          }
        });
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  }, [userType, hasPlayedSound]);

  // Mark as read
  const markAsRead = async (notificationId: string) => {
    try {
      await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PATCH',
      });
      setNotifications(prev =>
        prev.map(n =>
          n._id === notificationId ? { ...n, read: true } : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  // Auto refresh
  useEffect(() => {
    if (!autoRefresh) return;

    // Initial fetch
    fetchNotifications();

    // Set up interval
    const interval = setInterval(fetchNotifications, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchNotifications]);

  // Get icon for notification type
  const getIcon = (type: string) => {
    switch (type) {
      case 'order_approved':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'order_completed':
        return <CheckCircle className="h-5 w-5 text-blue-600" />;
      case 'payment_received':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'chat_message':
        return <MessageCircle className="h-5 w-5 text-blue-600" />;
      case 'order_rejected':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Bell className="h-5 w-5 text-gray-600" />;
    }
  };

  return (
    <div className="relative">
      {/* Bell Icon Button */}
      <button
        onClick={() => setShowPanel(!showPanel)}
        className="relative p-2 hover:bg-gray-100 rounded-lg transition"
        title="Notifications"
      >
        <Bell className="h-6 w-6 text-gray-700" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      {showPanel && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-y-auto">
          <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-center">
            <h3 className="font-bold text-gray-900">Notifications</h3>
            <button
              onClick={() => setShowPanel(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {notifications.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {notifications.map(notif => (
                <div
                  key={notif._id}
                  onClick={() => !notif.read && markAsRead(notif._id)}
                  className={`p-4 cursor-pointer transition ${
                    notif.read
                      ? 'bg-white hover:bg-gray-50'
                      : 'bg-blue-50 hover:bg-blue-100'
                  }`}
                >
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {getIcon(notif.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-semibold text-sm ${
                        notif.read ? 'text-gray-900' : 'text-blue-900'
                      }`}>
                        {notif.title}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        {notif.message}
                      </p>
                      {notif.orderNumber && (
                        <p className="text-xs text-gray-500 mt-1">
                          Order: {notif.orderNumber}
                        </p>
                      )}
                      <p className="text-xs text-gray-400 mt-2">
                        {new Date(notif.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                    {!notif.read && (
                      <div className="flex-shrink-0">
                        <div className="h-2 w-2 bg-blue-600 rounded-full mt-2" />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
