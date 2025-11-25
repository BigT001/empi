# 🎯 STEP-BY-STEP: TEST PAYMENT & CAPTURE LOGS

## Server Status: ✅ RUNNING

Your server is now running! I can see:
```
[HMR] connected
[AdminContext] Mounting - checking auth on load
```

This means the app is ready. Now let's test the payment.

---

## EXACT STEPS TO FOLLOW (Copy-Paste)

### Step 1: Open Browser
Open a new browser tab and go to:
```
http://localhost:3000/checkout
```

### Step 2: Open DevTools Console
Press: **`F12`** on keyboard

You should see a panel appear at bottom or right side of screen.

### Step 3: Go to Console Tab
Look at the tabs at the top of DevTools panel:
- Elements
- Console ← Click this
- Sources
- Network
- etc.

Click the **"Console"** tab.

### Step 4: Clear Console
In the Console tab, look for the 🚫 icon or trash can icon.
Click it to clear all existing logs.

### Step 5: Fill Out Checkout Form

Fill in the form fields:

**Billing Information:**
- Full Name: `Test User`
- Email: `test@example.com`
- Phone: `+2349012345678`

**Delivery Selection:**
- Scroll down to "Select Delivery State"
- Click dropdown and select: `Lagos` (or any state)
- Click on a location
- Select a vehicle type (any option)

### Step 6: Click Pay Button
Look for the green button that says: **"Pay ₦268,541.50"**

Click it.

**NOW WATCH THE CONSOLE!** 👀

You should see logs appearing like:
```
🔵 initializePaystack called
📋 Billing Info: {...}
🔍 Checking PaystackPop availability...
```

### Step 7: Paystack Modal Opens
After a moment, a Paystack payment modal should appear on screen.

### Step 8: Enter Test Card Details

In the Paystack modal, you'll see a form asking for:
- Card Number
- Expiry Date
- CVV

Enter:
```
Card Number: 5399 8343 1234 5678
Expiry: 12/25
CVV: 123
```

### Step 9: Click Continue (Next Button)
After entering card details, click "Continue" or "Next"

You'll see an OTP screen.

### Step 10: Enter OTP
The OTP field will appear.

Enter: `123456`

Click "Pay" or "Verify"

**NOW WATCH THE CONSOLE AGAIN!** 👀

You should see:
```
🟢 ===== PAYMENT SUCCESS CALLBACK FIRED =====
Response object: {...}
✅ Success modal should be visible now
📦 Order Response Status: 201
✅ Order saved successfully
```

---

## WHAT SHOULD HAPPEN

### If Everything Works ✅
1. Modal closes after payment
2. A **green popup/modal appears** with "Order Confirmed!" and a "Go to Dashboard" button
3. Console shows all the ✅ success messages
4. Everything is working!

### If Something Fails ❌
1. Modal may hang or show error
2. No popup appears
3. Console shows ❌ error messages
4. We'll know exactly what's wrong

---

## CAPTURING THE CONSOLE OUTPUT

### Method 1: Screenshot (EASIEST)

1. After payment completes (or fails)
2. Look at your console (F12 panel)
3. Scroll up to see ALL logs from the beginning
4. Take a screenshot: **`Print Screen`** or `Windows + Shift + S`
5. Paste it somewhere and send to me

### Method 2: Copy All Logs

1. Click in the console area
2. Press: `Ctrl + A` (select all)
3. Press: `Ctrl + C` (copy)
4. Open a text editor (Notepad, Word, etc.)
5. Press: `Ctrl + V` (paste)
6. Save the file
7. Send me the file

### Method 3: Export Console

Some browsers let you right-click in console and "Save As..."
- Right-click in console area
- Look for "Save" or "Export" option
- Save and send

---

## WHAT TO LOOK FOR IN LOGS

### 🟢 Good Signs
```
🟢 ===== PAYMENT SUCCESS CALLBACK FIRED =====
✅ Payment Success - Reference: EMPI-...
✅ Success modal should be visible now
📦 Order Response Status: 201
📋 Invoice Response Status: 201
✅ Order saved successfully
✅ Invoice generated successfully
```

If you see these → **SUCCESS!** ✅

### ❌ Bad Signs (Error Indicators)
```
❌ PaystackPop NOT available
❌ Billing info incomplete
❌ Order API returned error
❌ Invoice API returned error
```

If you see these → **Tell me what they say** 🔍

### 🔴 No Success Callback
```
[Lots of init logs]
✅ Handler opened (modal should appear)
[Then nothing - no callback logs]
```

If you see this → **Paystack didn't approve payment** 

---

## IF PAYSTACK MODAL DOESN'T APPEAR

This means Paystack script didn't load.

**What to do:**
1. Hard refresh: `Ctrl + Shift + R`
2. Check console for: `❌ PaystackPop NOT available`
3. Check if you have `NEXT_PUBLIC_PAYSTACK_KEY` in `.env.local`

---

## TROUBLESHOOTING: COMMON ISSUES

### Issue 1: "I see errors in console about metadata"
This is OK - these are just warnings, not blocking errors.

### Issue 2: "Nothing happens when I click Pay"
Check console for:
- `❌ Billing info incomplete` → Fill all fields
- `❌ Delivery quote missing` → Select delivery
- `❌ PaystackPop NOT available` → Reload page

### Issue 3: "Paystack modal appears but hangs"
This is Paystack processing. Wait 5-10 seconds.

### Issue 4: "Modal closes but nothing happens"
Check console for success callback. If you see:
- ✅ Callback fired → Success, watch for popup
- ❌ No callback → Payment was declined

---

## AFTER YOU GET THE LOGS

Send me:
1. Screenshot of console
2. OR copy of all logs
3. Tell me:
   - Did a popup appear?
   - What's the last ✅ or ❌ message?
   - Any error messages?
   - What happened on screen?

---

## QUICK REFERENCE

| Action | Key |
|--------|-----|
| Open DevTools | F12 |
| Go to Console | Click "Console" tab |
| Clear console | Click 🚫 icon |
| Select all logs | Ctrl + A |
| Copy logs | Ctrl + C |
| Take screenshot | Print Screen or Win+Shift+S |
| Reload page | Ctrl + Shift + R |
| Hard refresh | Ctrl + Shift + R |

---

## EXACT CHECKLIST

Before you start:
- [ ] Server running (`npm run dev` in terminal)
- [ ] No terminal errors
- [ ] Browser at `http://localhost:3000/checkout`
- [ ] DevTools open (F12)
- [ ] Console tab active
- [ ] Console cleared (clicked 🚫)

During payment:
- [ ] Form filled completely
- [ ] Clicked "Pay" button
- [ ] Watched console for logs
- [ ] Paystack modal appeared
- [ ] Entered test card: 5399 8343 1234 5678
- [ ] Entered OTP: 123456
- [ ] Clicked Pay in modal
- [ ] Watched console again

After payment:
- [ ] Captured full console screenshot
- [ ] Noted last log message
- [ ] Noted any ❌ errors
- [ ] Checked if popup appeared
- [ ] Ready to report

---

## READY?

Start at **Step 1: Open Browser** above and follow each step exactly.

When done, send me:
1. **Screenshot of console**
2. **Description of what happened**
3. **Whether popup appeared or not**

This will show us exactly what's happening! 🔍

---

## STATUS: ✅ READY TO TEST

Server is running, logging is in place, now let's find the problem!

**Go do the test now!** 🚀
