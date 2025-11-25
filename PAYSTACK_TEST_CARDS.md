# 🧪 PAYSTACK TEST CARDS - Official Approved

## ✅ Valid Test Cards for Paystack

### 1. **Mastercard - VISA (SHOULD ALWAYS PASS)**
```
Card Number:    5399 8343 1234 5678
Expiry:         Any future date (e.g., 12/27)
CVV:            Any 3 digits (e.g., 123)
PIN:            1234
OTP:            000000
Result:         ✅ SUCCESSFUL PAYMENT
```

### 2. **Visa Card**
```
Card Number:    4084 0843 0844 3010
Expiry:         Any future date (e.g., 12/27)
CVV:            Any 3 digits (e.g., 123)
PIN:            1234
OTP:            000000
Result:         ✅ SUCCESSFUL PAYMENT
```

### 3. **Verve Card**
```
Card Number:    5061 0600 0610 6047
Expiry:         Any future date (e.g., 12/27)
CVV:            Any 3 digits (e.g., 123)
PIN:            1234
OTP:            000000
Result:         ✅ SUCCESSFUL PAYMENT
```

---

## 🎯 IMPORTANT SETTINGS

**Make sure you're in TEST MODE:**

1. Go to https://dashboard.paystack.com
2. Click your **account profile** (top right)
3. Make sure **"Live Mode is OFF"** or you're in **"Test Mode"**
4. Get your **TEST PUBLIC KEY** (starts with `pk_test_`)
5. Copy that key to your `.env.local` file

---

## ⚙️ UPDATE YOUR `.env.local`

```bash
# PAYSTACK - USE TEST KEYS FIRST
NEXT_PUBLIC_PAYSTACK_KEY="pk_test_YOUR_TEST_PUBLIC_KEY_HERE"
PAYSTACK_SECRET_KEY="sk_test_YOUR_TEST_SECRET_KEY_HERE"
```

---

## 🧪 STEP-BY-STEP TEST FLOW

1. **Restart your dev server:**
   ```bash
   npm run dev
   ```

2. **Go to checkout page:**
   - http://localhost:3000/checkout

3. **Fill billing information:**
   - Name: Test User
   - Email: test@example.com
   - Phone: +2348012345678

4. **Select delivery:**
   - Choose a state (e.g., Lagos)
   - Accept the delivery quote

5. **Click "Pay" button:**
   - Paystack modal should open

6. **Enter test card details:**
   ```
   Card Number:    5399 8343 1234 5678
   Expiry:         12/27
   CVV:            123
   PIN:            1234
   OTP:            000000
   ```

7. **Payment should succeed:**
   - ✅ Modal closes
   - ✅ Redirects to confirmation page
   - ✅ Order appears in database

---

## ❌ COMMON ERRORS & FIXES

| Error | Cause | Solution |
|-------|-------|----------|
| "Invalid card number" | Card format wrong or not a valid test card | Use cards from THIS file |
| "Card declined" | Using live card in test mode | Switch to TEST keys in dashboard |
| "Invalid amount" | Amount is 0 or negative | Make sure cart has items |
| "Invalid key" | Wrong key format or empty | Restart server after adding `.env.local` |
| "Transaction reference not found" | API error | Check network tab in DevTools (F12) |

---

## 🔍 HOW TO DEBUG

**If payment still fails:**

1. **Open Browser DevTools:** Press `F12`
2. **Go to Console tab:** Look for error messages
3. **Go to Network tab:** Check:
   - Look for API calls to `/api/orders`
   - Should see `POST` request succeed (200 or 201)
4. **Check Paystack modal:**
   - It should show error message if card declined
   - Follow the error message instructions

---

## ✨ RECOMMENDED TEST FLOW

1. Use **Mastercard test card** first (most reliable)
2. Fill in minimal test data
3. Use small amount (e.g., ₦1,000)
4. OTP is always `000000` in test mode
5. PIN is always `1234` in test mode

---

## 📝 TEST DATA

```
Full Name:      John Doe Test
Email:          test.user@gmail.com
Phone:          +2348012345678
State:          Lagos
Delivery:       EMPI Delivery
Card:           5399 8343 1234 5678
Expiry:         12/27
CVV:            123
PIN:            1234
OTP:            000000
```

---

## 🚀 ONCE TESTING IS DONE

When you're ready for LIVE payments:

1. Go to https://dashboard.paystack.com/settings/developers
2. Toggle **LIVE MODE ON**
3. Copy your **LIVE PUBLIC KEY** (pk_live_*)
4. Update `.env.local`:
   ```bash
   NEXT_PUBLIC_PAYSTACK_KEY="pk_live_YOUR_LIVE_KEY"
   ```
5. Restart server
6. Use REAL debit cards for payments

---

**Status:** Ready for testing! 🎉
