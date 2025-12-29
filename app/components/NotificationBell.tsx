'use client';

import React, { useState, useEffect } from 'react';
import { Bell, X, MessageCircle, Package, CheckCircle, ChevronRight } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';
import { useBuyer } from '../context/BuyerContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface OrderNotification {
  orderId: string;
  orderNumber: string;
  type: 'processing' | 'message' | 'completed';
  title: string;
  count: number;
  preview?: string;
}

interface DetailedNotification {
  id: string;
  orderId: string;
  orderNumber: string;
  type: 'message' | 'processing' | 'completed';
  title: string;
  preview: string;
  timestamp: string;
  status?: string;
}

export function NotificationBell() {
  const { unreadCount } = useNotification();
  const { buyer } = useBuyer();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [showAllNotifications, setShowAllNotifications] = useState(false);
  const [orderNotifications, setOrderNotifications] = useState<OrderNotification[]>([]);
  const [detailedNotifications, setDetailedNotifications] = useState<DetailedNotification[]>([]);
  const [totalNotifications, setTotalNotifications] = useState(0);

  // Fetch notification counts and detailed notifications
  useEffect(() => {
    if (!buyer?.id) return;

    const fetchNotifications = async () => {
      try {
        // Fetch orders to get detailed notifications
        const ordersRes = await fetch(`/api/orders?buyerId=${buyer.id}&limit=100`);
        if (!ordersRes.ok) return;
        const ordersData = await ordersRes.json();
        const orders = Array.isArray(ordersData) ? ordersData : ordersData.orders || [];

        let processingCount = 0;
        let messageCount = 0;
        let completedCount = 0;
        const detailed: DetailedNotification[] = [];

        // Process each order for detailed notifications
        orders.forEach((order: any, index: number) => {
          // Count and list orders with unread messages
          if (order.messages && order.messages.length > 0) {
            const unreadMessages = order.messages.filter((msg: any) => !msg.read);
            if (unreadMessages.length > 0) {
              messageCount += unreadMessages.length;
              
              // Add each unread message as a detailed notification
              unreadMessages.forEach((msg: any, msgIdx: number) => {
                detailed.push({
                  id: `msg-${order._id}-${msgIdx}`,
                  orderId: order._id,
                  orderNumber: order.orderNumber,
                  type: 'message',
                  title: `Message on Order #${order.orderNumber}`,
                  preview: msg.content?.substring(0, 60) + '...' || 'New message',
                  timestamp: new Date(msg.createdAt).toLocaleString(),
                  status: 'New'
                });
              });
            }
          }

          // Count processing orders
          if (order.paymentStatus === 'pending' || order.paymentStatus === 'confirmed') {
            processingCount++;
            detailed.push({
              id: `processing-${order._id}`,
              orderId: order._id,
              orderNumber: order.orderNumber,
              type: 'processing',
              title: `Order #${order.orderNumber} Processing`,
              preview: `Payment Status: ${order.paymentStatus}`,
              timestamp: new Date(order.createdAt).toLocaleString(),
              status: order.paymentStatus
            });
          }

          // Count completed orders
          if (order.paymentStatus === 'completed') {
            completedCount++;
            detailed.push({
              id: `completed-${order._id}`,
              orderId: order._id,
              orderNumber: order.orderNumber,
              type: 'completed',
              title: `Order #${order.orderNumber} Completed`,
              preview: `Total: ₦${order.total?.toLocaleString() || '0'}`,
              timestamp: new Date(order.createdAt).toLocaleString(),
              status: 'Completed'
            });
          }
        });

        // Create summary notifications
        const notifications: OrderNotification[] = [];
        
        if (messageCount > 0) {
          notifications.push({
            orderId: '',
            orderNumber: '',
            type: 'message',
            title: 'Order Messages',
            count: messageCount,
            preview: `${messageCount} unread message${messageCount > 1 ? 's' : ''}`
          });
        }

        if (processingCount > 0) {
          notifications.push({
            orderId: '',
            orderNumber: '',
            type: 'processing',
            title: 'Orders Processing',
            count: processingCount,
            preview: `${processingCount} order${processingCount > 1 ? 's' : ''} awaiting payment`
          });
        }

        if (completedCount > 0) {
          notifications.push({
            orderId: '',
            orderNumber: '',
            type: 'completed',
            title: 'Completed Orders',
            count: completedCount,
            preview: `${completedCount} completed order${completedCount > 1 ? 's' : ''}`
          });
        }

        setOrderNotifications(notifications);
        setDetailedNotifications(detailed);
        setTotalNotifications(messageCount + processingCount + completedCount);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Poll every 30 seconds
    return () => clearInterval(interval);
  }, [buyer?.id]);

  const handleNotificationClick = (notification: DetailedNotification) => {
    setIsOpen(false);
    setShowAllNotifications(false);
    
    // Set the active tab in localStorage before navigating
    if (notification.type === 'message' || notification.type === 'processing' || notification.type === 'completed') {
      localStorage.setItem('buyerDashboardActiveTab', 'orders');
    }
    
    // Navigate intelligently based on notification type
    switch(notification.type) {
      case 'message':
        // Navigate to orders tab and scroll to this specific order's messages
        router.push(`/dashboard?tab=orders&orderId=${notification.orderId}&section=messages`);
        break;
      case 'processing':
        // Navigate directly to this specific processing order
        router.push(`/dashboard?tab=orders&orderId=${notification.orderId}&section=payment`);
        break;
      case 'completed':
        // Navigate directly to this specific completed order
        router.push(`/dashboard?tab=orders&orderId=${notification.orderId}&section=details`);
        break;
      default:
        router.push('/dashboard');
    }
  };

  const getNotificationIcon = (type: string) => {
    switch(type) {
      case 'message':
        return <MessageCircle className="h-4 w-4" />;
      case 'processing':
        return <Package className="h-4 w-4" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch(type) {
      case 'message':
        return 'border-l-blue-600 bg-blue-50 hover:bg-blue-100';
      case 'processing':
        return 'border-l-yellow-600 bg-yellow-50 hover:bg-yellow-100';
      case 'completed':
        return 'border-l-green-600 bg-green-50 hover:bg-green-100';
      default:
        return 'border-l-gray-600 bg-gray-50 hover:bg-gray-100';
    }
  };

  const badgeCount = totalNotifications + unreadCount;

  return (
    <div className="relative z-[10000]">
      {/* Bell Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-gray-100 transition"
        title="Notifications"
      >
        <Bell className="h-6 w-6 text-gray-700" />
        {badgeCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
            {badgeCount > 9 ? '9+' : badgeCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {isOpen && !showAllNotifications && (
        <div className="absolute right-0 mt-2 w-96 max-h-96 bg-white border border-gray-100 rounded-2xl shadow-2xl z-[9999] overflow-hidden flex flex-col backdrop-blur-sm">
          {/* Header with Gradient */}
          <div className="flex items-center justify-between bg-gradient-to-r from-lime-50 to-green-50 px-6 py-4 border-b border-gray-100">
            <div>
              <h3 className="font-bold text-gray-900 text-lg">
                Notifications
              </h3>
              {badgeCount > 0 && <p className="text-sm text-red-500 font-semibold mt-1">{badgeCount} new</p>}
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1.5 rounded-lg transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Notification Summary List */}
          <div className="overflow-y-auto flex-1">
            {orderNotifications.length === 0 && unreadCount === 0 ? (
              <div className="p-12 text-center">
                <div className="inline-block bg-gradient-to-br from-lime-100 to-green-200 p-4 rounded-full mb-4">
                  <Bell className="h-8 w-8 text-green-600" />
                </div>
                <p className="text-gray-500 text-sm font-medium">No notifications yet</p>
                <p className="text-gray-400 text-xs mt-1">Your notifications will appear here</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {orderNotifications.map((notif, idx) => (
                  <li
                    key={idx}
                    onClick={() => setShowAllNotifications(true)}
                    className="px-5 py-4 cursor-pointer hover:bg-gradient-to-r hover:from-lime-50 hover:to-green-50 transition-all duration-200 border-l-4 border-l-green-500"
                  >
                    <div className="flex items-start gap-3 mb-2">
                      <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-lime-100 to-green-200 rounded-lg flex items-center justify-center text-green-600">
                        {getNotificationIcon(notif.type)}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 text-sm">{notif.title}</p>
                        <p className="text-xs text-gray-600 mt-1">{notif.preview}</p>
                      </div>
                      <span className="flex-shrink-0 bg-gradient-to-r from-green-500 to-lime-600 text-white text-xs font-bold rounded-full px-3 py-1 shadow-sm">
                        {notif.count}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Footer - View All Button */}
          {orderNotifications.length > 0 && (
            <div className="border-t border-gray-100 bg-gradient-to-r from-lime-50 to-green-50 px-5 py-3">
              <button
                onClick={() => setShowAllNotifications(true)}
                className="w-full text-center text-sm font-bold text-green-600 hover:text-green-700 transition flex items-center justify-center gap-2 py-2 hover:bg-green-100 rounded-lg"
              >
                View All Notifications <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* All Notifications Expanded View */}
      {isOpen && showAllNotifications && (
        <div className="absolute right-0 mt-2 w-96 max-h-[500px] bg-white border border-gray-100 rounded-2xl shadow-2xl z-[9999] overflow-hidden flex flex-col backdrop-blur-sm">
          {/* Header */}
          <div className="flex items-center justify-end bg-gradient-to-r from-lime-50 to-green-50 px-6 py-3 border-b border-gray-100 min-h-[50px]">
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1.5 rounded-lg transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Detailed Notifications List */}
          <div className="overflow-y-auto flex-1">
            {detailedNotifications.length === 0 ? (
              <div className="p-12 text-center">
                <div className="inline-block bg-gradient-to-br from-lime-100 to-green-200 p-4 rounded-full mb-4">
                  <Bell className="h-8 w-8 text-green-600" />
                </div>
                <p className="text-gray-500 text-sm font-medium">No notifications yet</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {detailedNotifications.map((notif) => (
                  <li
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className={`px-5 py-4 cursor-pointer transition-all duration-200 border-l-4 ${getNotificationColor(notif.type)}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
                        notif.type === 'message' ? 'bg-lime-100 text-green-600' :
                        notif.type === 'processing' ? 'bg-green-100 text-green-600' :
                        'bg-green-100 text-green-600'
                      }`}>
                        {getNotificationIcon(notif.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <p className="font-semibold text-gray-900 text-sm">{notif.title}</p>
                          <span className={`text-xs font-bold rounded-full px-2 py-1 whitespace-nowrap flex-shrink-0 ${
                            notif.type === 'message' ? 'bg-lime-100 text-green-700' :
                            notif.type === 'processing' ? 'bg-green-100 text-green-700' :
                            'bg-green-100 text-green-700'
                          }`}>
                            {notif.status}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 mb-2 line-clamp-2">{notif.preview}</p>
                        <p className="text-xs text-gray-400 font-medium">Order #{notif.orderNumber}</p>
                        <p className="text-xs text-gray-400">{notif.timestamp}</p>
                      </div>
                    </div>
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
