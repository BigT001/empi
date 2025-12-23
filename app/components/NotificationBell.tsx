'use client';

import React, { useState } from 'react';
import { Bell, X } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';

export function NotificationBell() {
  const { liveNotifications, unreadCount, markAsRead, clearLiveNotifications } = useNotification();
  const [isOpen, setIsOpen] = useState(false);

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'message':
        return 'border-l-blue-600 bg-blue-50';
      case 'order':
      case 'custom-order':
        return 'border-l-purple-600 bg-purple-50';
      case 'payment':
        return 'border-l-green-600 bg-green-50';
      case 'status-update':
        return 'border-l-orange-600 bg-orange-50';
      default:
        return 'border-l-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="relative">
      {/* Bell Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-gray-100 transition"
        title="Notifications"
      >
        <Bell className="h-6 w-6 text-gray-700" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 max-h-96 bg-white border border-gray-200 rounded-lg shadow-lg z-40 overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between bg-gray-50 px-4 py-3 border-b">
            <h3 className="font-semibold text-gray-900">
              Notifications {unreadCount > 0 && <span className="text-sm text-red-600">({unreadCount})</span>}
            </h3>
            <div className="flex gap-2">
              {liveNotifications && liveNotifications.length > 0 && (
                <button
                  onClick={clearLiveNotifications}
                  className="text-xs text-gray-500 hover:text-gray-700 transition"
                >
                  Clear All
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Notification List */}
          <div className="overflow-y-auto flex-1">
            {!liveNotifications || liveNotifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">No notifications yet</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {liveNotifications.map((notif) => (
                  <li
                    key={notif.id}
                    onClick={() => {
                      markAsRead(notif.id);
                    }}
                    className={`px-4 py-3 cursor-pointer hover:bg-gray-50 transition border-l-4 ${getNotificationColor(
                      notif.type
                    )} ${notif.read ? 'opacity-60' : 'opacity-100'}`}
                  >
                    <p className="font-medium text-sm text-gray-900">{notif.title}</p>
                    <p className="text-xs text-gray-600 mt-1 line-clamp-2">{notif.message}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(notif.timestamp).toLocaleTimeString()}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
