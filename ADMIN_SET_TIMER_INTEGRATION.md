# 🎯 Admin Dashboard - Set Timer Button Implementation

**Status:** READY FOR INTEGRATION  
**File Location:** Admin dashboard (to be integrated)  
**Component Dependency:** SetTimerModal, API: POST /api/custom-orders/set-timer  

---

## Quick Implementation Guide

This shows how to add the "Set Timer" button to the admin dashboard.

### 1. Import Required Components

```typescript
import { SetTimerModal } from "../components/SetTimerModal";
import { Clock } from "lucide-react";
```

### 2. Add State Management

```typescript
const [timerModalOpen, setTimerModalOpen] = useState<string | null>(null); // orderId

const handleSetTimer = async (durationDays: number, durationHours: number) => {
  if (!timerModalOpen) return;
  
  try {
    const response = await fetch('/api/custom-orders/set-timer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId: timerModalOpen,
        durationDays,
        durationHours,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to set timer');
    }

    const data = await response.json();
    console.log('✅ Timer set successfully:', data);
    
    // Refresh custom orders
    fetchCustomOrders();
  } catch (error) {
    throw error; // SetTimerModal will handle error display
  }
};
```

### 3. Add Button to Order Card

In the admin order card (next to Chat button), add:

```tsx
{/* Admin Actions - Set Timer Button */}
{order.status === "approved" && !order.timerStartedAt && (
  <button
    onClick={(e) => {
      e.preventDefault();
      e.stopPropagation();
      setTimerModalOpen(order._id);
    }}
    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-lg text-white font-semibold py-2 px-3 rounded-lg transition flex items-center justify-center gap-2 text-sm"
  >
    <Clock className="h-4 w-4" />
    Set Delivery Timer
  </button>
)}

{/* Button already set - show modification option */}
{order.status === "approved" && order.timerStartedAt && (
  <button
    onClick={(e) => {
      e.preventDefault();
      e.stopPropagation();
      setTimerModalOpen(order._id);
    }}
    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:shadow-lg text-white font-semibold py-2 px-3 rounded-lg transition flex items-center justify-center gap-2 text-sm"
  >
    <Clock className="h-4 w-4" />
    Modify Timer
  </button>
)}
```

### 4. Add Modal to Admin Dashboard

```tsx
{/* Set Timer Modal */}
<SetTimerModal
  isOpen={timerModalOpen !== null}
  onClose={() => setTimerModalOpen(null)}
  onSet={handleSetTimer}
  orderNumber={customOrders.find(o => o._id === timerModalOpen)?.orderNumber || ""}
  isLoading={false}
/>
```

---

## Visual Example

### Before Timer Set (Approved Status)
```
┌─────────────────────────────────┐
│ Order: CUSTOM-1765491175266    │
│ Status: ✓ Approved             │
│ Price: ₦318,630                │
│                                │
│ [Chat] [Set Delivery Timer]    │ ← Blue button
│ [Accept] [Reject]              │
└─────────────────────────────────┘
```

### After Timer Set (In-Progress Status)
```
┌──────────────────────────────────────┐
│ Order: CUSTOM-1765491175266         │
│ Status: ⚙️ In-Progress [7d 05:23]   │
│ Price: ₦318,630                     │
│                                     │
│ [Chat] [Modify Timer]               │ ← Purple button
│ [Mark Ready] [Extensions]           │
└──────────────────────────────────────┘
```

---

## Button Placement Options

### Option A: In Action Row (Recommended)
```tsx
<div className="flex gap-2 mt-4">
  <button>Chat</button>
  <button>Set Timer</button>
  <button>Accept</button>
  <button>More</button>
</div>
```

### Option B: Below Chat
```tsx
<button>Chat (x unread)</button>
<button>Set Delivery Timer</button>
<button>Accept</button>
```

### Option C: In Expanded Card
```tsx
{isExpanded && (
  <div className="p-5 space-y-3">
    {/* Description */}
    {/* Images */}
    {/* Set Timer Button Here */}
    <button>Set Delivery Timer</button>
  </div>
)}
```

---

## Status Permissions

**Can Set Timer:**
- Status: `approved`
- Not yet timed
- Admin only

**Can Modify Timer:**
- Status: `approved` or `in-progress`
- Timer already set
- Admin only

**Cannot Set Timer:**
- Status: `pending` (awaiting approval)
- Status: `rejected` (order rejected)
- Status: `completed` (already done)
- Buyer cannot set timer

---

## Backend Response Handling

### Success Response
```javascript
{
  "success": true,
  "message": "Timer set successfully",
  "order": {
    "_id": "507f1f77bcf86cd799439011",
    "status": "in-progress",  // ← Status changed!
    "timerStartedAt": "2025-12-12T10:30:00Z",
    "deadlineDate": "2025-12-19T12:30:00Z"
  }
}
```

The SetTimerModal component handles:
- ✅ Success message display
- ✅ Auto-close after 1.5 seconds
- ✅ Automatic page refresh (via fetchCustomOrders)

### Error Handling
The SetTimerModal component handles:
- ❌ Display error message
- ❌ Allow retry without closing modal
- ❌ Log errors for debugging

---

## Next Steps

1. **Integrate into Admin Dashboard:**
   - Copy the code snippets above
   - Add SetTimerModal import
   - Add handleSetTimer function
   - Add button to order card
   - Add modal component

2. **Test:**
   - Create a test order
   - Mark as "approved"
   - Click "Set Timer"
   - Set 7 days 2 hours
   - Verify timer appears in dashboard

3. **Deploy:**
   - Merge to main branch
   - Deploy to production
   - Monitor for issues

---

## Troubleshooting

### Modal doesn't appear
- Check: `timerModalOpen` state is being set
- Check: Modal `isOpen` prop is true
- Console log the state to verify

### Timer doesn't update
- Check: Browser console for errors
- Check: `timerStartedAt` and `deadlineDate` are set in database
- Check: Component is properly mounted

### API request fails
- Check: Order ID is correct
- Check: Duration values are valid
- Check: Network tab shows 200 response
- Check: Server logs for detailed error

---

## Code Template for Admin Dashboard

```typescript
import { SetTimerModal } from "../components/SetTimerModal";
import { Clock } from "lucide-react";

export default function AdminDashboard() {
  const [timerModalOpen, setTimerModalOpen] = useState<string | null>(null);

  const handleSetTimer = async (durationDays: number, durationHours: number) => {
    if (!timerModalOpen) return;
    
    try {
      const response = await fetch('/api/custom-orders/set-timer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: timerModalOpen,
          durationDays,
          durationHours,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to set timer');
      }

      // Refresh data
      fetchCustomOrders();
    } catch (error) {
      throw error;
    }
  };

  return (
    <>
      {/* Render custom orders with Set Timer button */}
      {customOrders.map((order) => (
        <div key={order._id} className="...">
          {order.status === "approved" && (
            <button
              onClick={() => setTimerModalOpen(order._id)}
              className="flex items-center gap-2 text-sm"
            >
              <Clock className="h-4 w-4" />
              Set Timer
            </button>
          )}
        </div>
      ))}

      {/* Modal */}
      <SetTimerModal
        isOpen={timerModalOpen !== null}
        onClose={() => setTimerModalOpen(null)}
        onSet={handleSetTimer}
        orderNumber={
          customOrders.find(o => o._id === timerModalOpen)?.orderNumber || ""
        }
      />
    </>
  );
}
```

---

## Ready to Integrate! ✅

All components are ready. Just copy and customize to your admin dashboard structure.

