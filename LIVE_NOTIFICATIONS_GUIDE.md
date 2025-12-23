# Live Notifications System Documentation

## Overview

The EMPI app now has a **real-time notification system** using **Socket.IO** that instantly alerts users and admins when:
- ✅ New messages are received in chat
- ✅ New orders are placed  
- ✅ New custom orders are submitted
- ✅ Payments are received
- ✅ Order statuses are updated

All notifications come with **sound alerts** to grab attention.

---

## Features

### 1. **Real-Time Socket.IO Connection**
- Automatic WebSocket connection on app load
- Automatic reconnection with exponential backoff
- Supports both WebSocket and polling transports

### 2. **Sound Notifications**
- **Message Alert**: Two-tone beep (800Hz + 1000Hz)
- **Order Alert**: Three ascending beeps (600Hz, 800Hz, 1000Hz)
- **Alert Sound**: Single loud beep (1200Hz)

### 3. **Notification Bell**
- Shows unread notification count
- Displays dropdown with full notification history
- Last 50 notifications stored
- Mark as read / Clear all functionality

### 4. **Toast Notifications**
- Auto-dismiss after 5 seconds
- Shows in top-right corner
- Different colors for different notification types
- Click to dismiss

### 5. **Notification Types**
| Type | Color | Icon |
|------|-------|------|
| **message** | Blue | 💬 Message |
| **order** | Purple | 📦 Package |
| **custom-order** | Purple | 🎨 Custom |
| **payment** | Green | ✅ Check |
| **status-update** | Orange | 📊 Alert |

---

## How to Use

### For Users

1. **Allow Notifications**
   - The app will automatically show a notification bell in the header
   - Click the bell icon to see all notifications

2. **Sound Alerts**
   - Sound plays automatically when notifications arrive
   - Make sure your device volume is on
   - Different sounds for messages vs orders

3. **Read Notifications**
   - Click any notification in the dropdown to mark it as read
   - Unread count badge updates automatically

### For Admins

1. **Monitor Orders**
   - Get instant alerts when customers place orders
   - See customer name, order number, and amount in notification

2. **Monitor Messages**
   - Get notified when customers send messages
   - See sender name and message preview

3. **Payment Tracking**
   - Get alerts when payments are received
   - See order number in notification

---

## Technical Architecture

### Components

```
NotificationContext (app/context/NotificationContext.tsx)
├── Socket.IO client initialization
├── Payment polling (existing)
├── Live notification state management
└── useNotification() hook

NotificationBell (app/components/NotificationBell.tsx)
├── Bell icon with unread badge
├── Dropdown with notification history
├── Mark as read
└── Clear all

MobileHeader (app/components/MobileHeader.tsx)
└── Includes NotificationBell in top nav
```

### Socket.IO Server Setup

The server is initialized in `/lib/socket.ts`:

```typescript
// Rooms
- 'admin' - Admin notifications
- 'user:{email}' - User-specific notifications
- Global broadcast events

// Events
- join-user(email) - User joins their room
- join-admin() - Admin joins admin room
- message-sent - Send message notifications
- order-created - Send order notifications
- new-message - Receive message notifications
- new-order - Receive order notifications
- payment-received - Payment confirmed
- status-update - Order status changed
```

### API Integration

**When messages are sent** (`/api/messages`):
```typescript
io.emit('new-message', {
  orderId, orderNumber, senderName, senderEmail, 
  senderType, text, messageType, timestamp
});
```

**When orders are created** (`/api/orders`):
```typescript
io.emit('new-order', {
  orderId, orderNumber, customerName, customerEmail,
  totalAmount, items, status, timestamp
});
```

---

## Setup Instructions

### 1. Environment Variables (Already Set)
```env
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_SOCKET_URL="http://localhost:3000"
```

### 2. Socket.IO is Already Initialized
- Packages installed: `socket.io`, `socket.io-client`
- Server code: `/lib/socket.ts`
- API route: `/api/socket/route.ts`
- Context: `/app/context/NotificationContext.tsx`

### 3. Using the Hook

```typescript
import { useNotification } from '@/app/context/NotificationContext';

export function MyComponent() {
  const { 
    socket,                    // Socket.IO instance
    liveNotifications,         // Array of notifications
    unreadCount,               // Number of unread
    addLiveNotification,       // Add new notification
    markAsRead,                // Mark as read
    clearLiveNotifications,    // Clear all
    playSound,                 // Play notification sound
  } = useNotification();

  // Use any of these functions
}
```

---

## Sound Generation

The system uses the **Web Audio API** to generate sounds without external files:

### Message Sound
```
Tone 1: 800Hz for 0.1s
Tone 2: 1000Hz for 0.1s (after 50ms delay)
```

### Order Sound
```
Tone 1: 600Hz for 0.15s
Tone 2: 800Hz for 0.15s (after 50ms delay)
Tone 3: 1000Hz for 0.15s (after 50ms delay)
```

### Alert Sound
```
Tone 1: 1200Hz for 0.3s (louder, 0.5 gain)
```

---

## Testing the Notification System

### 1. **Test Message Notification**
```bash
# Send a message through the chat modal
# Should hear: double beep + toast + bell count updates
```

### 2. **Test Order Notification**
```bash
# Place a new order
# Should hear: triple ascending beep + toast + bell count updates
```

### 3. **Test Admin Notifications**
```bash
# Login as admin
# Place an order as customer
# Admin should see notification immediately
```

### 4. **Test Multiple Tabs**
```bash
# Open app in two tabs
# Send message in one tab
# Both tabs should show notification (via shared Socket.IO room)
```

---

## Notification Flow Diagram

```
Event Occurs (Message/Order/Payment)
          ↓
      API Handler
          ↓
    Socket.IO Server
          ↓
    Broadcast to Room
     (admin or user:email)
          ↓
    Client Receives Event
          ↓
┌────────────────────────────────┐
├── Play Sound                   │
├── Add to State                 │
├── Show Toast (5 sec)           │
├── Increment Badge              │
└── Persist in History (50 max)  │
```

---

## Troubleshooting

### Notifications Not Appearing

**Problem**: No notifications showing up
- Check browser console for `[Socket.IO] ✅ Connected` message
- Verify `NEXT_PUBLIC_SOCKET_URL` in `.env.local`
- Ensure app is running on correct port

### Sounds Not Playing

**Problem**: No sound on notification
- Check device volume
- Check browser sound settings
- Verify AudioContext is not blocked by browser
- Check browser console for audio errors

### Missing Unread Badge

**Problem**: Badge not showing count
- Refresh the page
- Check if Socket.IO is connected
- Clear browser cache

### Multiple Connections

**Problem**: Getting duplicate notifications
- This shouldn't happen (Socket.IO dedupes)
- If it does, check for multiple app instances

---

## Production Deployment

### For AWS/Vercel/Railway

1. **Update Environment Variables**
```env
NEXT_PUBLIC_APP_URL="https://yourdomain.com"
NEXT_PUBLIC_SOCKET_URL="https://yourdomain.com"
```

2. **Socket.IO Behind Load Balancer**
- Socket.IO requires sticky sessions for load balancers
- Configure nginx/HAProxy sticky sessions by session ID
- Or use a dedicated Socket.IO server

3. **For Multi-Server Setup**
- Consider Socket.IO-redis adapter
- Allows socket connections across multiple servers
```bash
npm install socket.io-redis
```

---

## Future Enhancements

- [ ] Browser push notifications (Web Push API)
- [ ] Email notification opt-in
- [ ] SMS notification for critical alerts
- [ ] Notification preferences panel
- [ ] Sound volume control
- [ ] Different notification patterns
- [ ] Notification analytics/dashboard

---

## Browser Support

✅ **Fully Supported**:
- Chrome/Edge 60+
- Firefox 55+
- Safari 11+

⚠️ **Requires Fallback** (polling instead of WebSocket):
- IE 11
- Older mobile browsers

---

## References

- [Socket.IO Documentation](https://socket.io/docs/)
- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [Next.js Real-time Features](https://nextjs.org/docs)
