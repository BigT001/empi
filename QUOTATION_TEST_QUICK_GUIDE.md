# Quick Quotation System Test Guide

## Before You Test
Make sure your browser DevTools console is open to see all the logs:
- **Chrome/Edge**: F12 → Console tab
- **Firefox**: F12 → Console tab
- **Safari**: Cmd+Option+I → Console tab

---

## Test Scenario: Send and Receive a Quote

### Phase 1: Admin Creates and Sends Quote (5 minutes)

**Step 1**: Go to Admin Dashboard → Pending Orders

**Step 2**: Find a custom order (one with no quote yet)
- Should show order details
- No quote section yet

**Step 3**: Add quote items
```
Example:
- Item 1: "T-Shirt Design" × 100 @ ₦5,000 = ₦500,000
- Item 2: "Embroidery" × 100 @ ₦2,000 = ₦200,000
Subtotal: ₦700,000
VAT (7.5%): ₦52,500
Total: ₦752,500
```

**Step 4**: Click "Send Quote" button

**Step 5**: Check browser console:
```
EXPECTED LOGS:
✓ [CustomOrderCard] 📊 Quote Details Being Sent:
✓ [CustomOrderCard] ✅ PATCH response status: 200
✓ [CustomOrderCard] ✅ Quote saved successfully
✓ [CustomOrderCard] API Response Order: {quotedPrice: 752500, quoteItemsCount: 2}
```

**Step 6**: Verify in admin card
- Card should show "Quote Sent ✅" status
- Quote section should display with items and pricing

---

### Phase 2: User Receives Quote (5 minutes)

**Step 1**: Log out of admin, log in as customer

**Step 2**: Go to Dashboard → Orders

**Step 3**: Find the custom order you just sent quote for

**Step 4**: Watch browser console:
```
EXPECTED LOGS (Watch in order):

1. Card mounting:
   [UserCustomOrderCard] Initialized with:
     designUrlsCount: X
     quotedPrice: undefined (if polling)
   
2. Polling starts:
   [UserCustomOrderCard] ⏱️ Polling for quote update...
   [UserCustomOrderCard] 📥 Poll response received
   
3. Quote data received:
   [UserCustomOrderCard] 📊 Quote Data from API:
     ├─ quotedPrice: 752500
     ├─ quoteItemsCount: 2
     ├─ quoteItems: [{itemName: "T-Shirt Design", quantity: 100, ...}, ...]
     └─ Quote Changed?: true
   
4. State update:
   [UserCustomOrderCard] ✅ Updated quote items
   [UserCustomOrderCard] 💰 Quote updated: 752500
```

**Step 5**: Verify visual display:
- Card background changed from yellow to green
- Quote section visible showing:
  - Quote Items list
  - Subtotal, VAT, Total
  - "Proceed to Payment" button

---

## Quick Troubleshooting

### Quote Not Appearing on User Card?

**Check 1**: Is polling running?
```
Look for:
[UserCustomOrderCard] ⏱️ Polling for quote update...
[UserCustomOrderCard] 📥 Poll response received
```
- If YES ✅, go to Check 2
- If NO ❌, check if quotedPrice was already in props (won't poll if quote exists)

**Check 2**: Is API returning quote data?
```
Look for:
[UserCustomOrderCard] 📊 Quote Data from API:
  ├─ quotedPrice: [number] (not undefined!)
  ├─ quoteItemsCount: [> 0] (should have items)
```
- If YES ✅, go to Check 3
- If NO ❌, quote not saved in database - check admin sending

**Check 3**: Is state updating?
```
Look for:
[UserCustomOrderCard] 💰 Quote updated: [number]
```
- If YES ✅, check visual display (Step 5 above)
- If NO ❌, issue with state management - check console for errors

**Check 4**: Verify Database
```
Using MongoDB Compass or CLI:
1. Connect to your database
2. Find UnifiedOrder collection
3. Find the order by orderNumber
4. Check fields:
   quotedPrice: should be a number
   quoteItems: should be an array
   
If both are null/undefined:
└─> PROBLEM: Admin quote not saving
    Action: Check admin console logs
```

---

## Debug Commands in Console

Run these in browser console while on user card to get current state:

### See all orders fetched:
```javascript
// Look for in console logs
"[Unified Orders API] ✅ Order retrieved:"
```

### Check what's being sent:
```javascript
// In admin card, look for
"[CustomOrderCard] 📊 Quote Details Being Sent:"
```

### Monitor network requests:
```
In DevTools Network tab:
1. Filter by "unified" 
2. Watch for:
   - PATCH /api/orders/unified/[id] (admin sending)
   - GET /api/orders/unified/[id] (user polling)
3. Check Response tab to see data
```

---

## Success Indicators

### Admin Side ✅
- [x] "Send Quote" button works without errors
- [x] Console shows all quote details
- [x] PATCH request returns 200 status
- [x] Quote items count matches what was sent
- [x] Card shows "Quote Sent" status

### User Side ✅
- [x] Polling starts if quote not in initial props
- [x] Poll response shows quotedPrice from API
- [x] Poll response shows quoteItems array
- [x] State updates with new quote
- [x] Card background changes color (yellow → green)
- [x] Quote section renders with items
- [x] Pricing breakdown displays correctly
- [x] "Proceed to Payment" button appears

### Database ✅
- [x] UnifiedOrder document has quotedPrice field with value
- [x] UnifiedOrder document has quoteItems field with array
- [x] Both fields populated after admin sends quote

---

## Still Having Issues?

1. **Clear browser cache**: Ctrl+Shift+Delete (Chrome) or Cmd+Shift+Delete (Safari)
2. **Check API logs**: Look at your server console/logs
3. **Verify schema**: Check that `/lib/models/UnifiedOrder.ts` has quote fields
4. **Check timestamps**: Make sure quotes were sent AFTER the code changes
5. **Try a fresh order**: Create a new custom order and test from scratch

If still stuck, check:
- MongoDB connection status
- API endpoint accessibility
- No CORS errors in console
- Quote totals calculate correctly (subtotal + VAT = total)

