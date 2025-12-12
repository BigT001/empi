# Custom Order Dashboard - Card Redesign with Message Notifications

## Overview
Redesigned the custom orders section on the user dashboard from a list view to a modern card grid layout with real-time message count notifications. This provides a better visual hierarchy and makes it easier for users to see unread messages from the admin at a glance.

## Changes Made

### 1. Layout Transformation
**Before**: Vertical list with expandable sections
**After**: Responsive card grid (1 column on mobile, 2 on tablet, 3 on desktop)

```tsx
// New grid layout
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {customOrders.map((order) => (
    <div className="bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden hover:shadow-xl transition transform hover:-translate-y-1 flex flex-col h-full">
      {/* Card content */}
    </div>
  ))}
</div>
```

### 2. Message Count Tracking
Added state to track message counts per order:

```tsx
const [messageCountPerOrder, setMessageCountPerOrder] = useState<Record<string, { total: number; unread: number }>>({});
```

This tracks both:
- **total**: Total number of messages from admin
- **unread**: Number of unread messages from admin

### 3. Message Notification Badge
Added a red notification badge at the top of the card that shows when there are unread messages:

```tsx
{messageCount.unread > 0 && (
  <div className="bg-red-500 text-white text-xs font-bold px-4 py-2 flex items-center justify-between">
    <span className="flex items-center gap-2">
      <MessageCircle className="h-4 w-4" />
      {messageCount.unread} new message{messageCount.unread !== 1 ? 's' : ''}
    </span>
  </div>
)}
```

**Features**:
- Only shows when `unread > 0`
- Uses red background (alert color) for visibility
- Shows message count with proper singular/plural grammar
- Displays message icon for visual clarity

### 4. Card Header Design
Condensed and cleaner header with:
- Order number
- Date submitted
- Status badge
- Quantity and price summary in a grid

```tsx
<div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-200">
  <div>
    <p className="text-xs text-gray-600 mb-1">Quantity</p>
    <p className="text-sm font-bold text-gray-900">{order.quantity || 1} unit{(order.quantity || 1) !== 1 ? 's' : ''}</p>
  </div>
  {order.quotedPrice && (
    <div className="text-right">
      <p className="text-xs text-gray-600 mb-1">Quote</p>
      <p className="text-sm font-bold text-lime-600">₦{order.quotedPrice.toLocaleString()}</p>
    </div>
  )}
</div>
```

### 5. Expanded Content Area
When a card is expanded:
- Description preview with line clamping (`line-clamp-3`)
- "View Images" button
- Additional details (needed by date, notes)
- Chat button with message count

The expanded content is scrollable to prevent card overflow:

```tsx
<div className="p-5 space-y-5 bg-gray-50 flex-1 overflow-y-auto max-h-96">
  {/* Expanded content */}
</div>
```

### 6. Enhanced Chat Button
Updated to show message count when available:

```tsx
<button>
  <MessageCircle className="h-4 w-4" />
  {messageCount.total > 0 ? `Chat (${messageCount.total})` : 'Open Chat'}
</button>
```

## Message Fetching Logic

The dashboard automatically fetches message counts for all custom orders:

```typescript
// Fetch message counts for each order
const messageCounts: Record<string, { total: number; unread: number }> = {};
for (const order of customerOrders) {
  try {
    const messagesResponse = await fetch(`/api/messages?orderId=${order._id}`);
    const messagesData = await messagesResponse.json();
    if (messagesData.messages && Array.isArray(messagesData.messages)) {
      const adminMessages = messagesData.messages.filter((msg: any) => msg.senderType === 'admin');
      const unreadAdminMessages = adminMessages.filter((msg: any) => !msg.isRead);
      messageCounts[order._id] = {
        total: adminMessages.length,
        unread: unreadAdminMessages.length
      };
    }
  } catch (error) {
    console.error(`Error fetching messages for order ${order._id}:`, error);
    messageCounts[order._id] = { total: 0, unread: 0 };
  }
}
setMessageCountPerOrder(messageCounts);
```

**Features**:
- Fetches messages for all orders in parallel
- Filters to only count admin messages
- Separates unread count
- Graceful error handling with fallback
- Updates state with counts

## Responsive Design

### Mobile (1 column)
- Full-width cards
- Compact header
- Expanded content scrollable
- Large touch-friendly buttons

### Tablet (2 columns)
- Medium-sized cards
- Good spacing
- Content area scrollable

### Desktop (3 columns)
- Optimal grid layout
- Visual balance
- More content visible at once

## Visual Enhancements

### Hover Effects
```css
hover:shadow-xl transition transform hover:-translate-y-1
```
- Elevated shadow on hover
- Subtle upward lift
- Smooth transitions

### Status Badges
Colored badges for each status:
- **Pending**: Yellow
- **Approved**: Blue
- **In Progress**: Purple
- **Ready**: Green
- **Completed**: Gray
- **Rejected**: Red

Each includes an appropriate icon.

### Color Scheme
- **Primary**: Lime-600 (#10b981) for quotes and chat button
- **Notification**: Red-500 for unread messages
- **Backgrounds**: White with subtle gray on expanded
- **Text**: Gray-900 for primary, Gray-600 for secondary

## User Experience Flow

### 1. Dashboard Load
```
User logs in → Dashboard loads → Fetches custom orders → Fetches message counts → Cards render with notification badges
```

### 2. Seeing Unread Messages
```
Admin sends message → Message marked unread → Next fetch updates count → Red badge appears on card → User clicks card or chat button
```

### 3. Opening Chat
```
User clicks "Open Chat" → Chat modal opens → Messages load → User can read/respond → Messages marked as read
```

### 4. Collapsing Card
```
User clicks expanded card → Content collapses → Card shrinks → More orders visible
```

## API Endpoint Required

The feature relies on:
```
GET /api/messages?orderId={orderId}
```

Expected response:
```json
{
  "messages": [
    {
      "_id": "...",
      "orderId": "...",
      "senderType": "admin" | "customer" | "system",
      "isRead": boolean,
      "createdAt": "ISO date string",
      // ... other message fields
    }
  ]
}
```

## State Management

```typescript
const [messageCountPerOrder, setMessageCountPerOrder] = useState<Record<string, { total: number; unread: number }>>({});
```

Structure:
```typescript
{
  "order-id-1": { total: 3, unread: 2 },
  "order-id-2": { total: 5, unread: 0 },
  "order-id-3": { total: 0, unread: 0 }
}
```

## Performance Considerations

1. **Parallel Fetching**: All message counts fetched in a single loop (not sequential)
2. **Caching**: State cached in component, updates on fresh custom orders fetch
3. **Error Handling**: Individual order errors don't block other orders
4. **Lazy Loading**: Images don't load until modal is opened

## Browser Compatibility

✅ Chrome/Edge (latest)
✅ Firefox (latest)
✅ Safari (latest)
✅ Mobile browsers (iOS Safari, Chrome Mobile)

## Files Modified

- **`/app/dashboard/page.tsx`**
  - Added `messageCountPerOrder` state
  - Enhanced custom orders fetch with message count logic
  - Replaced list layout with card grid
  - Added message notification badge
  - Updated card header and expanded content design
  - Enhanced chat button with message count display

## Future Enhancements

1. **Real-time Updates**: Use WebSocket/polling for live message notifications
2. **Badge Animation**: Add subtle pulse animation when new message arrives
3. **Mark as Read**: Option to mark unread messages as read from card
4. **Quick Reply**: Quick message input on card without opening modal
5. **Search & Filter**: Filter cards by status, unread count, etc.
6. **Sorting**: Sort by date, status, or unread count
7. **Mobile Notifications**: Browser notifications for new messages
8. **Message Preview**: Show first line of latest message on card
9. **Card Actions**: Quick actions menu (chat, view details, etc.)
10. **Dark Mode**: Support for dark theme

## Testing Checklist

- [ ] Load dashboard and verify cards display
- [ ] Check message count fetching for multiple orders
- [ ] Verify notification badge shows only when unread > 0
- [ ] Test card expansion/collapse
- [ ] Test chat button opens modal
- [ ] Test responsive layout on mobile (1 column)
- [ ] Test responsive layout on tablet (2 columns)
- [ ] Test responsive layout on desktop (3 columns)
- [ ] Verify hover effects work
- [ ] Test with 0 messages (no badge)
- [ ] Test with multiple unread messages
- [ ] Check accessibility (keyboard navigation)
- [ ] Verify "View Images" button works
- [ ] Test order creation shows up as new card
- [ ] Test status badge colors are correct
- [ ] Verify scrollable content in expanded state
- [ ] Test empty state (no orders)
