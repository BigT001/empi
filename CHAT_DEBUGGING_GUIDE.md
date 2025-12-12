# Chat Communication Debugging Guide

## How to Test the Messaging System

### 1. **Open Browser DevTools**
   - Press `F12` or right-click → "Inspect"
   - Go to the "Console" tab
   - Look for messages starting with `[ChatPanel]` or `[CustomerChat]`

### 2. **Admin Side - Send a Message**
   - Go to `/admin/dashboard`
   - Click on "Custom Orders" tab
   - Find a custom order and click it to expand
   - Click the "Chat" button
   - Type a test message like "Hi, are you there?"
   - Click "Send"

**What to look for in console:**
```
[ChatPanel] Component mounted for order: CUSTOM-... ID: ...
[ChatPanel] Fetching messages for orderId: ...
[API:GET /messages] Received request - orderId: ...
[API:GET /messages] ✅ Found 0 messages
[ChatPanel] Sending message: {orderId: "...", content: "Hi, are you there?", ...}
[API:POST /messages] Received: {orderId: "...", senderType: "admin", ...}
✅ Message created: ...
[ChatPanel] Message sent successfully: {success: true, message: {...}}
[ChatPanel] Setting messages, count: 1
```

### 3. **Customer Side - See Admin Message**
   - Go to `/dashboard`
   - Click on "Custom Orders" tab
   - Find the same order and click "Open Chat"
   - Wait a few seconds (3-second polling interval)

**What to look for in console:**
```
[CustomerChat] Component mounted for order: CUSTOM-... ID: ...
[CustomerChat] Fetching messages for orderId: ...
[API:GET /messages] Received request - orderId: ...
[API:GET /messages] ✅ Found 1 messages
[CustomerChat] Setting messages, count: 1
```

### 4. **Customer Side - Send Response**
   - Type a response like "Yes, I'm interested!"
   - Click "Send"

**What to look for in console:**
```
[CustomerChat] Sending message: {orderId: "...", content: "Yes, I'm interested!", senderType: "customer", ...}
[API:POST /messages] Received: {orderId: "...", senderType: "customer", ...}
✅ Message created: ...
```

### 5. **Admin Side - Refresh Chat**
   - Go back to admin dashboard
   - The chat should auto-refresh every 3 seconds
   - You should see the customer's response

**What to look for in console:**
```
[ChatPanel] Fetching messages for orderId: ...
[ChatPanel] Setting messages, count: 2
```

## Common Issues and Solutions

### Issue 1: "No messages yet" appears even after sending
**Possible causes:**
- orderId is null or incorrect
- Messages aren't being saved to database
- API is returning empty array

**How to debug:**
1. Check console for `[API:POST /messages] Received`
2. Check if `✅ Message created` appears
3. Check `[API:GET /messages] ✅ Found X messages`

### Issue 2: Admin doesn't see customer messages
**Possible causes:**
- Customer's messages are not being saved
- Customer is using a different email address
- Order ID mismatch

**How to debug:**
1. Verify customer email matches when sending message
2. Check if orderId is consistent between pages
3. Look for `[API:POST /messages]` for customer messages

### Issue 3: Messages appear only sometimes
**Possible causes:**
- Polling not running
- Browser cache issues
- Multiple windows interfering

**How to debug:**
1. Check console for regular polling logs
2. Open DevTools Network tab and filter by `/api/messages`
3. Use single browser window/tab

## MongoDB Query to Check Messages

If you have access to MongoDB Compass or CLI:

```javascript
// List all messages for a specific order
db.messages.find({ orderNumber: "CUSTOM-..." })

// See total message count
db.messages.countDocuments()

// See messages by sender type
db.messages.aggregate([
  { $group: { _id: "$senderType", count: { $sum: 1 } } }
])
```

## Network Inspection

In DevTools Network tab:
1. Filter by `/api/messages`
2. For GET requests:
   - Should see Status 200
   - Response should have `{success: true, messages: [...]}`
3. For POST requests:
   - Should see Status 201
   - Response should have `{success: true, message: {...}}`

## Performance Check

The polling happens every 3 seconds. If messages are delayed:
1. Check Network tab for slow requests
2. Look for MongoDB connection issues in console
3. Check server logs for errors
