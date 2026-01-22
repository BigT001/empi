# 🔔 Admin Notifications - Implementation Guide

## Quick Integration Guide

### Step 1: Add Notification Settings to Admin Dashboard

Create a component in your admin dashboard:

```typescript
// components/admin/NotificationSettings.tsx
'use client';

import { useAdminNotifications } from '@/hooks/useAdminNotifications';
import { useState, useEffect } from 'react';

export function NotificationSettings() {
  const {
    notificationsActive,
    permissionStatus,
    loading,
    enableNotifications,
    disableNotifications,
    showTestNotification,
  } = useAdminNotifications({
    userId: 'admin-user-id', // Your admin user ID
    autoEnable: false,
  });

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-4">🔔 Order Notifications</h2>
      
      <div className="space-y-4">
        {/* Status Card */}
        <div className={`p-4 rounded-lg border-2 ${
          notificationsActive 
            ? 'border-green-500 bg-green-50' 
            : 'border-gray-300 bg-gray-50'
        }`}>
          <p className="font-semibold">
            {notificationsActive ? '✅ Notifications Enabled' : '❌ Notifications Disabled'}
          </p>
          <p className="text-sm text-gray-600">
            Permission: {permissionStatus || 'Not requested'}
          </p>
        </div>

        {/* Enable/Disable Button */}
        <div className="flex gap-2">
          {!notificationsActive ? (
            <button
              onClick={enableNotifications}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Requesting...' : 'Enable Notifications'}
            </button>
          ) : (
            <button
              onClick={disableNotifications}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Disable Notifications
            </button>
          )}

          {/* Test Button */}
          <button
            onClick={showTestNotification}
            disabled={!notificationsActive}
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
          >
            Test Notification
          </button>
        </div>

        {/* Info */}
        <div className="bg-blue-50 p-4 rounded border border-blue-200">
          <p className="text-sm text-blue-900">
            <strong>ℹ️ Note:</strong> When enabled, you'll receive desktop notifications 
            for every new order. Allow notifications in your browser permission prompt.
          </p>
        </div>
      </div>
    </div>
  );
}
```

### Step 2: Add to Admin Dashboard Page

```typescript
// app/dashboard/page.tsx or components in dashboard
import { NotificationSettings } from '@/components/admin/NotificationSettings';

export default function Dashboard() {
  return (
    <div>
      {/* Other dashboard content */}
      <NotificationSettings />
    </div>
  );
}
```

### Step 3: Listen for New Orders (Real-Time)

If using Socket.io or WebSocket:

```typescript
// hooks/useOrderListener.ts
import { useEffect } from 'react';
import { useAdminNotifications } from './useAdminNotifications';

export function useOrderListener() {
  const { handleNewOrder } = useAdminNotifications();

  useEffect(() => {
    // Example with Socket.io
    // const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL);
    
    // socket.on('new-order', (order) => {
    //   handleNewOrder(order);
    // });

    // return () => {
    //   socket.disconnect();
    // };
  }, [handleNewOrder]);
}
```

### Step 4: Verify Setup

1. **Build the project:**
   ```bash
   npm run build
   ```

2. **Test in browser:**
   - Go to admin dashboard
   - Click "Enable Notifications"
   - Allow permission in browser
   - Click "Test Notification" to see popup

3. **Test with API:**
   ```bash
   curl -X POST http://localhost:3000/api/notifications/test-admin
   ```

---

## Email Notification Details

### What Admin Receives:

1. **Email Subject**: `🆕 New Order Alert! - ORDER-12345`
2. **From**: Configured via Resend email service
3. **To**: `info.samuelstanley@gmail.com`
4. **Contents**:
   - Order number and amount
   - Customer name and email
   - Order type
   - Link to view order

### Email Template Location:
- [lib/notificationService.ts](lib/notificationService.ts#L583) → `generateAdminNewOrderEmail()`

---

## Browser Notification Details

### What Admin Sees:

```
┌─────────────────────────────────┐
│ 🆕 New Order Alert!             │
├─────────────────────────────────┤
│ Order #ORD-1234 from John Doe   │
│ ₦75,000                          │
│                                 │
│ [View]  [Dismiss]               │
└─────────────────────────────────┘
```

### Features:
- ✅ Auto-closes after 10 seconds
- ✅ Click to view order in dashboard
- ✅ Persists until dismissed
- ✅ Uses browser notification center

---

## Troubleshooting

### Notifications Not Appearing?

1. **Check permission status:**
   - Browser Settings → Notifications
   - Make sure domain is allowed

2. **Verify browser support:**
   ```javascript
   console.log('Notifications supported:', 'Notification' in window);
   ```

3. **Check HTTPS:**
   - Notifications require HTTPS in production
   - Localhost works without HTTPS

4. **Check email:**
   - Verify email is correct in `.env.local`
   - Check spam folder for emails

### Email Not Received?

1. **Check Resend config:**
   - Verify Resend API key is set
   - Check Resend dashboard for failures

2. **Check email settings:**
   ```typescript
   // lib/notificationService.ts
   const adminEmail = process.env.ADMIN_EMAIL || 'info.samuelstanley@gmail.com';
   ```

3. **Test endpoint:**
   ```bash
   curl -X POST http://localhost:3000/api/notifications/test-admin
   ```

---

## Advanced: Custom Notification Styles

To customize notification appearance, edit `lib/browserNotifications.ts`:

```typescript
// Custom notification options
export function showNewOrderNotification(
  orderNumber: string,
  customerName: string,
  amount: number
): Notification | null {
  return showNotification('🆕 New Order Alert!', {
    body: `Order #${orderNumber} from ${customerName} - ₦${amount.toLocaleString('en-NG')}`,
    icon: '/logo.png', // Your logo
    badge: '/badge-icon.png', // Badge icon
    tag: `order-${orderNumber}`,
    requireInteraction: true, // Keep until clicked
    autoClose: 10000, // 10 seconds
    
    // Advanced options:
    // actions: [
    //   { action: 'view', title: 'View Order' },
    //   { action: 'approve', title: 'Approve' }
    // ],
  });
}
```

---

## API Endpoints

### Test Admin Notification
```bash
POST /api/notifications/test-admin

Request:
{
  "testMode": true
}

Response:
{
  "success": true,
  "testOrderNumber": "TEST-123456",
  "notificationsSent": {
    "email": true,
    "message": true,
    "push": true,
    "mobile": false
  }
}
```

### Send New Order Notification (Automatic)
```bash
POST /api/notifications/admin-order-placed

Request:
{
  "orderNumber": "ORD-12345",
  "orderId": "507f1f77bcf86cd799439011",
  "buyerName": "John Doe",
  "buyerEmail": "john@example.com",
  "amount": 75000,
  "orderType": "Custom"
}

Response:
{
  "success": true,
  "result": {
    "email": true,
    "message": true,
    "push": true,
    "mobile": false
  }
}
```

---

## Files Modified/Created

### Modified:
- ✅ `app/api/notifications/admin-order-placed/route.ts` - Updated admin email
- ✅ `lib/notificationService.ts` - Added admin email template

### Created:
- ✅ `lib/browserNotifications.ts` - Browser notification utilities
- ✅ `hooks/useAdminNotifications.ts` - React hook
- ✅ `app/api/notifications/test-admin/route.ts` - Test endpoint
- ✅ `ADMIN_NOTIFICATIONS_COMPLETE.md` - Documentation

---

## Next: SMS Notifications (Optional)

To add SMS alerts to admin phone:

```typescript
// In sendMultiChannelNotification()
const smsSent = await sendSMSNotification({
  phone: process.env.ADMIN_PHONE,
  message: `New order #${orderNumber}. ₦${amount}. View: ${dashboardLink}`,
});
```

Requires:
- SMS provider (Twilio, Termii, etc.)
- Admin phone number configured
- API credentials

---

## Support & Maintenance

- **Email Issues**: Check Resend dashboard
- **Notification Issues**: Check browser console
- **Order Issues**: Check `/api/notifications/admin-order-placed` logs
- **Permission Issues**: Clear browser cache and retry

---

✅ Implementation Complete! Your admin will now get instant alerts for every order. 🎉
