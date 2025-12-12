# Pay Now Button - Troubleshooting Guide

## Why You Can't See the Pay Now Button

The "Pay Now" button appears under specific conditions. Follow this guide to debug:

---

## ✅ Prerequisites to See the Button

### 1. Quote Message Must Have Quote Data
The message **must** include:
- ✅ `quotedPrice` (unit price)
- ✅ `quotedVAT` (calculated VAT)
- ✅ `quotedTotal` (final amount)

### 2. Message Must Be from Admin to Customer
```
senderType: 'admin'  ✅
senderType: 'customer'  ❌
senderType: 'system'  ❌
```

### 3. You Must Be Viewing as Customer (Not Admin)
```
isAdmin: false  ✅  (Show button)
isAdmin: true   ❌  (Hide button - diagnostic message shows instead)
```

### 4. Message Must Be Marked as Final Price OR Have Quote Total
The condition is:
```typescript
{(msg.isFinalPrice || (msg.messageType === 'quote' && msg.quotedTotal)) && (
  // Show button
)}
```

---

## 🔍 Diagnostic Messages

If you don't see the "Pay Now" button, look for diagnostic messages:

### Message 1: "Pay Now button visible only for customer quote messages from admin"
**Meaning:** The message is NOT from an admin
**Fix:** Make sure the person sending the quote is logged in as **admin**

### Message 2: "Pay Now hidden: you're viewing as admin"
**Meaning:** You're currently viewing the chat as an admin
**Fix:** Log out and view the chat as a **customer** instead

### No Diagnostic Message Appearing
**Meaning:** The message doesn't have `isFinalPrice: true` and no quote total
**Fix:** Follow "How to Send a Proper Quote" below

---

## 📋 How to Send a Proper Quote (Admin)

### Step 1: Click "+ Send Quote" Button
- This button only appears for admins
- Located in the chat input area

### Step 2: Enter Unit Price
```
Price: 15000
(This is the price per unit)
```

### Step 3: Review the Quote Preview
You should see:
```
Unit Price: ₦15,000
Discount (10%): -₦1,500  (if applicable)
VAT (7.5%): ₦1,013
Total: ₦14,513
```

### Step 4: CHECK "Mark as final price"
⚠️ **THIS IS IMPORTANT** ⚠️

```
☑️ Mark as final price
   (This checkbox MUST be checked)
```

### Step 5: Click "Send Quote"
- The quote will be sent with all calculations

---

## 🎯 Step-by-Step Test

Follow these steps to verify everything is working:

### As Admin:
1. [ ] Log in with **admin account**
2. [ ] Go to Dashboard → Custom Orders
3. [ ] Click on a custom order
4. [ ] Scroll down to Chat Modal
5. [ ] Click "+ Send Quote" button
6. [ ] Enter a price (e.g., 5000)
7. [ ] **CHECK the checkbox** for "Mark as final price"
8. [ ] Click "Send Quote"

### As Customer:
1. [ ] **Log out** of admin account
2. [ ] Log in with **customer account** (or different account)
3. [ ] Go to Dashboard → Custom Orders
4. [ ] Click on the **same custom order**
5. [ ] Scroll down to Chat Modal
6. [ ] Look for the quote message from admin
7. [ ] You should now see:
   - ✓ Final Price badge
   - 💵 Pay Now button

---

## 🐛 Common Issues & Fixes

### Issue 1: "I see the quote but no Pay Now button"

**Possible Causes:**

A) **You're still logged in as admin**
   - Fix: Log out, then log in as customer

B) **The checkbox wasn't checked when sending**
   - Fix: Admin should send quote again with checkbox checked

C) **Old message without quote data**
   - Fix: Clear chat and send a new quote

---

### Issue 2: "I see diagnostic message but not button"

**Example message shown:**
> "(Pay Now hidden: you're viewing as admin)"

**Fix:** 
- You need to view as a **customer**, not admin
- Log out of your admin account
- Open the chat in a different browser or incognito window as customer

---

### Issue 3: "I don't see the Final Price badge at all"

**Possible Causes:**

A) **Quote doesn't have all required fields**
   - The API might not have saved quotedPrice, quotedVAT, quotedTotal
   - Solution: Check browser console for errors when sending quote

B) **Order might not have a quantity set**
   - VAT/Total calculations need the quantity
   - Solution: Make sure custom order has a quantity value

C) **Old messages from before this feature was added**
   - Solution: Send a new quote message

---

## 🔧 Debug Checklist

Open your browser's **Developer Console** (F12) and look for:

### When Sending Quote (Admin):
```
[ChatModal] handlePayNow()
[API:POST /messages] Received: { orderId, orderNumber, senderType: 'admin', messageType: 'quote', ... }
[API:POST /messages] Quote calculated: { basePrice, quantity, discountPercentage, ... }
✅ Message created: [message ID]
```

### When Loading Messages (Customer):
```
[ChatModal] Fetching messages for orderId: [order ID]
[ChatModal] ✅ Found X messages
```

### Errors to Look For:
```
❌ Error fetching messages:
❌ Error saving order:
❌ Failed to send message:
```

If you see errors, check:
1. Network tab (F12 → Network) - Any failed requests?
2. Database connection - Is MongoDB running?
3. API endpoint - Is `/api/messages` working?

---

## 📱 Mobile vs Desktop

The Pay Now button should work on both:
- ✅ Desktop browsers
- ✅ Mobile browsers
- ✅ Tablets

If it's only missing on mobile, check CSS classes:
```
className="w-full bg-lime-600 hover:bg-lime-700 text-white..."
```

These should be responsive.

---

## 🔄 How the Flow Works

```
Admin Sends Quote (with checkbox ✓)
        ↓
API saves: isFinalPrice = true
        ↓
Message stored in database with all quote fields
        ↓
Customer loads chat
        ↓
Messages fetched from database
        ↓
ChatModal checks: msg.isFinalPrice && msg.senderType === 'admin' && !isAdmin
        ↓
✅ Button appears
        ↓
Customer clicks "Pay Now"
        ↓
Quote data sent to checkout page
        ↓
Checkout displays quote summary
        ↓
Customer completes payment
```

---

## 💡 Pro Tips

1. **Use Incognito Windows**
   - Admin in one window
   - Customer in incognito window
   - Makes it easy to test both roles

2. **Refresh After Admin Sends Quote**
   - Close and reopen chat as customer
   - Ensures latest messages are fetched

3. **Check Message Timestamps**
   - New quotes should show very recent timestamps
   - Old messages might be from before the feature existed

4. **Save Yourself Time**
   - Screenshot the quote message
   - Makes it easy to see all fields

---

## ✨ Expected Behavior

When everything is working correctly:

### You See This:
```
┌─────────────────────────────────────┐
│ Admin: "Final quote for your order" │
├─────────────────────────────────────┤
│ Unit Price:      ₦5,000            │
│ Discount (5%):   -₦250             │
│ VAT (7.5%):      ₦357              │
│ ─────────────────────────────────── │
│ Total:           ₦5,107            │
├─────────────────────────────────────┤
│ ✓ Final Price                       │
│                                     │
│   [💵 Pay Now]                      │
└─────────────────────────────────────┘
```

### When You Click "Pay Now":
```
Quote data stored in sessionStorage
↓
Navigate to checkout page
↓
Checkout page loads quote
↓
Display custom order quote section
↓
Show all calculations
↓
Ready for payment
```

---

## 🎓 Still Having Issues?

Check in this order:

1. **Browser Console** - Any errors? (F12 → Console)
2. **Network Tab** - Are API calls succeeding? (F12 → Network)
3. **Admin Sent Correctly** - Checkbox checked?
4. **Viewing as Customer** - Not logged in as admin?
5. **Clear Cache** - Ctrl+Shift+Delete to clear browser cache

If still stuck, check:
- Are you using the latest code?
- Did you restart your dev server?
- Is MongoDB connected?

---

## 📊 Quick Reference

| Requirement | ✅ Yes | ❌ No | Impact |
|---|---|---|---|
| `msg.isFinalPrice = true` | Show button | Hide button | Primary condition |
| `msg.senderType = 'admin'` | Show button | Hide button | Primary condition |
| `!isAdmin` (viewing as customer) | Show button | Hide button | Primary condition |
| `msg.quotedTotal` exists | Show button | Hide button | Fallback condition |
| `msg.messageType = 'quote'` | Show button | Hide button | Fallback condition |

**Summary:** Button shows if: `(isFinalPrice OR (quote AND total)) AND admin AND not-admin-viewer`
