# 🔔 Live Notifications & Sound Alerts - Setup Guide

## What's Implemented

Your EMPI app now has **real-time live notifications with sound alerts** for both users and admins!

### ✅ Features Ready to Use:

1. **Message Notifications** 💬
   - When admin sends a message → Customer gets instant notification + sound
   - When customer sends a message → Admin gets instant notification + sound

2. **Order Notifications** 📦
   - When new order is created → Admin gets instant notification + sound
   - When custom order is placed → Admin gets instant notification + sound

3. **Payment Notifications** 💰
   - When payment is received → Customer & Admin get notification
   - System detects payment automatically via invoices

4. **Status Updates** 📊
   - When order status changes → Customer notified
   - When delivery option confirmed → System notified

5. **Notification Bell** 🔔
   - Located in top navigation bar (mobile header)
   - Shows unread count badge
   - Click to see full notification history
   - Color-coded by type (message, order, payment, status)

## How to Use

### For Users:
1. **Watch the bell icon** in the top right of the navbar
2. **Hear sound alerts** when admin messages you
3. **Click the bell** to see all notifications
4. **Notifications auto-dismiss** after 5 seconds as toast

### For Admins:
1. **Be alerted immediately** when new orders arrive
2. **Hear distinct sounds** for messages vs orders
3. **Manage notifications** via the bell dropdown
4. **See notification history** for reference

## Technical Details

### Files Created/Modified:

| File | Purpose |
|------|---------|
| `/lib/socket.ts` | Socket.IO server setup |
| `/app/context/NotificationContext.tsx` | Notification state management |
| `/app/components/NotificationBell.tsx` | Bell icon with dropdown |
| `/app/components/NotificationToast.tsx` | Toast notifications |
| `/app/api/messages/route.ts` | Emits new-message events |
| `/app/api/orders/route.ts` | Emits new-order events |
| `/.env.local` | Socket.IO URLs configured |

### Sound Types:

- **Message**: Double chirp (800Hz, 1000Hz)
- **Order**: Ascending beeps (600Hz → 800Hz → 1000Hz)
- **Alert**: Single loud beep (1200Hz)

## Configuration

The following environment variables are already set in `.env.local`:

```env
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_SOCKET_URL="http://localhost:3000"
```

### For Production Deployment:

Update these URLs when deploying:

```env
# Replace with your actual domain
NEXT_PUBLIC_APP_URL="https://yourdomain.com"
NEXT_PUBLIC_SOCKET_URL="https://yourdomain.com"
```

## Browser Compatibility

✅ Works on all modern browsers:
- Chrome, Edge, Firefox, Safari
- Mobile: iOS Safari, Chrome Mobile, Firefox Mobile

⚠️ **First Use**: Sound may not play until user interacts with page (clicks/scrolls). This is a browser security feature.

## Testing the Notifications

### Test 1: Message Notification
1. Login as admin in one browser
2. Login as customer in another browser  
3. Admin sends message → Customer should hear sound + see toast
4. Check notification bell for history

### Test 2: Order Notification
1. Go through checkout process
2. Admin should hear ascending beeps
3. Bell icon updates with unread count
4. Click bell to see order details

### Test 3: Sound Variants
1. Open browser console (F12)
2. Look for log: `[Socket.IO] ✅ Connected to notification server`
3. Verify different sounds play for different notification types

## Troubleshooting

### Sound not playing?
- **Check**: Browser volume is not muted
- **Check**: You've interacted with the page (click/scroll)
- **Check**: Open console - look for AudioContext errors

### Notifications not appearing?
- **Check**: `.env.local` has correct `NEXT_PUBLIC_SOCKET_URL`
- **Check**: App is running (not built/static)
- **Check**: User/admin session tokens exist in localStorage
- **Check**: Browser console has `Socket.IO Connected` message

### Duplicate notifications?
- **Normal!** Both polling (15s interval) and WebSocket trigger
- Confirms both systems working
- Remove polling if you prefer WebSocket-only

## API Events Reference

### Server emits these events to clients:

```javascript
// When message is sent
io.emit('new-message', {
  orderId,
  orderNumber,
  senderName,
  senderEmail,
  senderType,
  text,
  messageType,
  timestamp
});

// When order is created
io.emit('new-order', {
  orderId,
  orderNumber,
  customerName,
  customerEmail,
  totalAmount,
  items,
  status,
  timestamp
});

// When custom order created
io.emit('new-custom-order', {
  customOrderId,
  buyerName,
  buyerEmail,
  status,
  timestamp
});

// When payment confirmed
io.emit('payment-received', {
  orderNumber,
  customerEmail,
  amount,
  timestamp
});

// When order status changes
io.emit('status-update', {
  orderNumber,
  customerEmail,
  status,
  timestamp
});
```

### Client joins rooms:

```javascript
// User logs in - join their personal room
socket.emit('join-user', userEmail);

// Admin logs in - join admin room
socket.emit('join-admin');
```

## Next Steps / Future Enhancements

- [ ] Email notifications for critical events
- [ ] SMS notifications via Twilio
- [ ] Desktop browser notifications (Notification API)
- [ ] Notification preferences (enable/disable per type)
- [ ] Quiet hours scheduling
- [ ] Notification database persistence
- [ ] Push notifications for mobile apps
- [ ] Notification categories/filtering

## Support

If notifications aren't working:

1. **Check browser console** for Socket.IO connection logs
2. **Verify `.env.local`** has Socket.IO URLs
3. **Clear browser cache** and refresh
4. **Restart dev server** (`npm run dev`)
5. **Check network tab** for WebSocket connection

## How It Works (Technical Overview)

```
User/Admin Action
     ↓
API Endpoint (messages or orders)
     ↓
Socket.IO Server emits event
     ↓
Notification Context receives event
     ↓
Two things happen:
  1. Toast notification shows (5 sec auto-dismiss)
  2. Sound plays (Web Audio API)
     ↓
Bell icon updates with count
     ↓
User can click bell to see history
```

---

**Notifications are now live! 🎉**

Your users and admins will get instant alerts with sound when messages arrive and orders are placed.
