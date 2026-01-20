"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useBuyer } from './BuyerContext';
import io, { Socket } from 'socket.io-client';

export interface PaymentApprovedNotification {
  type: 'payment_approved';
  orderId: string;
  orderNumber: string;
  amount: number;
  invoiceNumber?: string;
  invoiceId?: string;
}

export interface LiveNotification {
  id: string;
  type: 'message' | 'order' | 'custom-order' | 'payment' | 'status-update';
  title: string;
  message: string;
  data?: any;
  timestamp: number;
  read: boolean;
}

interface NotificationContextType {
  notification: PaymentApprovedNotification | null;
  setNotification: (notification: PaymentApprovedNotification | null) => void;
  dismissNotification: () => void;
  // New Socket.IO based notifications
  socket: Socket | null;
  liveNotifications: LiveNotification[];
  unreadCount: number;
  addLiveNotification: (notification: Omit<LiveNotification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  clearLiveNotifications: () => void;
  playSound: (type: 'message' | 'order' | 'alert') => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { buyer } = useBuyer();
  const [notification, setNotification] = useState<PaymentApprovedNotification | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [liveNotifications, setLiveNotifications] = useState<LiveNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [toastNotifications, setToastNotifications] = useState<LiveNotification[]>([]);

  const dismissNotification = useCallback(() => {
    setNotification(null);
  }, []);

  // Play sound notification
  const playSound = useCallback((type: 'message' | 'order' | 'alert') => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      if (type === 'message') {
        // Message: two quick beeps
        oscillator.frequency.value = 800;
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);

        oscillator.frequency.value = 1000;
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime + 0.15);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.25);
        oscillator.start(audioContext.currentTime + 0.15);
        oscillator.stop(audioContext.currentTime + 0.25);
      } else if (type === 'order') {
        // Order: ascending beeps
        oscillator.frequency.value = 600;
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.15);

        oscillator.frequency.value = 800;
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime + 0.2);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.35);
        oscillator.start(audioContext.currentTime + 0.2);
        oscillator.stop(audioContext.currentTime + 0.35);

        oscillator.frequency.value = 1000;
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime + 0.4);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.55);
        oscillator.start(audioContext.currentTime + 0.4);
        oscillator.stop(audioContext.currentTime + 0.55);
      } else {
        // Alert: loud single beep
        oscillator.frequency.value = 1200;
        gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
      }
    } catch (error) {
      console.warn('[Notifications] Could not play sound:', error);
    }
  }, []);

  const addLiveNotification = useCallback((notification: Omit<LiveNotification, 'id' | 'timestamp' | 'read'>) => {
    const id = `notif-${Date.now()}-${Math.random()}`;
    const newNotif: LiveNotification = {
      ...notification,
      id,
      timestamp: Date.now(),
      read: false,
    };

    setLiveNotifications((prev) => [newNotif, ...prev].slice(0, 50));
    setUnreadCount((prev) => prev + 1);

    // Show as toast for 5 seconds
    setToastNotifications((prev) => [...prev, newNotif]);
    setTimeout(() => {
      setToastNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 5000);

    // Play sound
    playSound(notification.type === 'order' || notification.type === 'custom-order' ? 'order' : 'message');
  }, [playSound]);

  const markAsRead = useCallback((id: string) => {
    setLiveNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }, []);

  const clearLiveNotifications = useCallback(() => {
    setLiveNotifications([]);
    setUnreadCount(0);
  }, []);

  // Initialize Socket.IO
  useEffect(() => {
    const socketUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const newSocket = io(socketUrl, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      transports: ['websocket', 'polling'],
    });

    newSocket.on('connect', () => {
      console.log('[Socket.IO] ✅ Connected to notification server');
      
      // Get user email
      const userEmail = typeof window !== 'undefined' 
        ? localStorage.getItem('userEmail') || localStorage.getItem('buyerEmail') || buyer?.email
        : null;
      
      if (userEmail) {
        newSocket.emit('join-user', userEmail);
      }

      // Check if admin
      const adminSession = typeof window !== 'undefined' 
        ? localStorage.getItem('adminSession')
        : null;
      
      if (adminSession) {
        newSocket.emit('join-admin');
      }
    });

    newSocket.on('new-message', (data) => {
      console.log('[Socket.IO] 💬 New message:', data);
      addLiveNotification({
        type: 'message',
        title: 'New Message',
        message: data.senderName ? `${data.senderName}: ${data.text || 'Sent a file'}` : 'You have a new message',
        data,
      });
    });

    newSocket.on('new-order', (data) => {
      console.log('[Socket.IO] 📦 New order:', data);
      addLiveNotification({
        type: 'order',
        title: 'New Order',
        message: `Order #${data.orderNumber || data._id?.slice(-4)} - ₦${data.totalAmount || data.total}`,
        data,
      });
    });

    newSocket.on('new-custom-order', (data) => {
      console.log('[Socket.IO] 🎨 New custom order:', data);
      addLiveNotification({
        type: 'custom-order',
        title: 'New Custom Order',
        message: `Custom order from ${data.buyerName || 'Customer'}`,
        data,
      });
    });

    newSocket.on('payment-received', (data) => {
      console.log('[Socket.IO] 💰 Payment received:', data);
      addLiveNotification({
        type: 'payment',
        title: 'Payment Received',
        message: `Payment confirmed for order #${data.orderNumber}`,
        data,
      });
    });

    newSocket.on('status-update', (data) => {
      console.log('[Socket.IO] 📊 Status updated:', data);
      addLiveNotification({
        type: 'status-update',
        title: 'Order Status Updated',
        message: `Your order status: ${data.status}`,
        data,
      });
    });

    newSocket.on('disconnect', () => {
      console.log('[Socket.IO] ❌ Disconnected');
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [buyer?.email, addLiveNotification]);

  // Keep existing polling mechanism
  useEffect(() => {
    if (!buyer?.id) {
      console.log('[NotificationContext] Skipping poll: no buyer ID');
      return;
    }

    const pollInterval = setInterval(async () => {
      try {
        const buyerId = buyer?.id;
        if (!buyerId) return;
        
        const res = await fetch(`/api/orders/unified?limit=10&buyerId=${buyerId}`);
        if (!res.ok) {
          console.warn('[NotificationContext] Poll failed with status:', res.status);
          return;
        }

        const data = await res.json();
        const orders = Array.isArray(data) ? data : data.orders || [];

        // Check for recently confirmed orders (paymentStatus === 'confirmed')
        const confirmedOrder = orders.find(
          (order: any) =>
            order.paymentStatus === 'confirmed' &&
            order.paymentConfirmedAt &&
            // Only show notification if order was confirmed in last 30 seconds
            new Date(order.paymentConfirmedAt).getTime() > Date.now() - 30000
        );

        if (confirmedOrder && !notification) {
          // Try to fetch the invoice for this order
          let invoiceNumber = undefined;
          let invoiceId = undefined;
          
          try {
            const invoiceRes = await fetch(
              `/api/invoices?buyerId=${buyer.id}&limit=1`
            );
            if (invoiceRes.ok) {
              const invoiceData = await invoiceRes.json();
              const invoices = Array.isArray(invoiceData) ? invoiceData : invoiceData.invoices || [];
              
              // Find invoice for this order (most recent)
              const invoice = invoices.find(
                (inv: any) => inv.orderNumber === confirmedOrder.orderNumber
              );
              
              if (invoice) {
                invoiceNumber = invoice.invoiceNumber;
                invoiceId = invoice._id;
              }
            }
          } catch (invoiceError) {
            console.warn('[NotificationContext] Failed to fetch invoice:', invoiceError instanceof Error ? invoiceError.message : String(invoiceError));
            // Continue without invoice - not critical
          }

          setNotification({
            type: 'payment_approved',
            orderId: confirmedOrder._id,
            orderNumber: confirmedOrder.orderNumber,
            amount: confirmedOrder.total,
            invoiceNumber,
            invoiceId,
          });
        }
      } catch (error) {
        console.error('[NotificationContext] Polling error:', error instanceof Error ? error.message : String(error));
      }
    }, 15000); // Poll every 15 seconds

    return () => clearInterval(pollInterval);
  }, [buyer?.id, notification]);

  return (
    <NotificationContext.Provider value={{ 
      notification, 
      setNotification, 
      dismissNotification,
      socket,
      liveNotifications,
      unreadCount,
      addLiveNotification,
      markAsRead,
      clearLiveNotifications,
      playSound,
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
}
