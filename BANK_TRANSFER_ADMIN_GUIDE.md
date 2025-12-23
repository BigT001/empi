# Bank Transfer Admin Guide

## Quick Start

### 1️⃣ Set Up Bank Details
Go to: **Admin Panel → Settings → Bank Details**

Fill in:
- **Account Name**: Your company name registered with bank
- **Bank Name**: e.g., "First Bank of Nigeria", "Access Bank", "GTBank"
- **Account Number**: Your 10-digit account number
- **Bank Code** (optional): Your bank's USSD code or sort code
- **Instructions** (optional): "Please include order number in transfer description"

**Save** and verify the preview looks correct.

---

### 2️⃣ Review Pending Orders
Location: **Admin Orders Dashboard**

Orders with status **"AWAITING PAYMENT"**:
- Show ⏳ pending payment icon
- Display total amount due
- May have uploaded payment proof screenshot

---

### 3️⃣ Confirm Payment Received
1. Check that customer has transferred the correct amount
2. Verify from your bank account
3. (Optional) Review uploaded payment proof screenshot
4. Click **"Confirm Payment"** button

**What happens automatically:**
✅ Order status changes to "CONFIRMED"
✅ Invoice PDF is generated
✅ Customer receives confirmation email with invoice
✅ Order moves to processing

---

### 4️⃣ Manage Multiple Orders

**Filter by Payment Status:**
- **Pending**: Not yet paid
- **Awaiting Confirmation**: Proof uploaded, waiting for review
- **Confirmed**: Payment verified, ready to process

**Quick Actions:**
- 📸 View payment proof (if uploaded)
- ✅ Confirm payment
- 📧 Resend confirmation email
- ❌ Mark as failed (if needed)

---

## Key Points to Remember

| What | Where to Find |
|------|-------------|
| **Manage bank account** | Admin → Settings → Bank Details |
| **Confirm payments** | Admin → Orders → [Select pending order] |
| **View proof screenshots** | Order details page (if uploaded) |
| **Check payment history** | Analytics → Payment Status Report |

---

## Payment Confirmation Workflow

```
Customer Places Order
        ↓
Order Created (Status: PENDING)
        ↓
Customer Transfers Money
        ↓
(Optional) Customer Uploads Proof Screenshot
        ↓
Admin Reviews Order
        ↓
Admin Clicks "Confirm Payment"
        ↓
System Auto-Generates Invoice
        ↓
Customer Gets Email with Invoice
        ↓
Order Status: CONFIRMED → Ready to Process
```

---

## Email Templates Sent Automatically

### **When Order Created:**
```
Subject: Order Confirmation - [ORDER-NUMBER]

Hi [Customer Name],

Your order has been created and is awaiting payment.

Order Details:
- Order Number: [ORDER-NUMBER]
- Amount: ₦[TOTAL]
- Status: Awaiting Payment

Next Steps:
1. Transfer ₦[TOTAL] to our bank account
2. (Optional) Upload payment proof in your confirmation email
3. We'll verify and confirm your payment within 24 hours

Bank Details:
[Your Account Name]
[Your Bank Name]
[Your Account Number]
[Instructions]

Thank you!
```

### **When Payment Confirmed:**
```
Subject: Payment Confirmed - Order [ORDER-NUMBER]

Hi [Customer Name],

Great! We've received and confirmed your payment.

Order Number: [ORDER-NUMBER]
Amount Paid: ₦[TOTAL]
Status: CONFIRMED

Your invoice is attached.

Thank you for shopping with EMPI!
```

---

## Common Tasks

### ❓ Customer says they transferred but I don't see payment?
1. Check your bank account - money may take time to clear
2. Ask customer for proof (screenshot, transaction reference)
3. Mark order as "Awaiting Confirmation" temporarily
4. Once verified, confirm payment

### ❓ Customer uploaded wrong amount?
1. View the uploaded proof
2. Contact customer to clarify
3. Either:
   - Mark as failed and ask for correct amount
   - Accept partial payment if agreed
   - Cancel order if customer wants to

### ❓ How long does invoice generation take?
- **Instant** - generates immediately when you confirm payment
- Customer receives email within seconds (depending on email server)

### ❓ Can I edit bank details while orders are pending?
- **Yes!** Changes apply immediately
- Existing orders keep their original bank details in confirmation email
- New orders will see updated details

### ❓ What if customer needs refund?
- Mark order as "Failed" or "Cancelled"
- Send message to customer with refund instructions
- Manually transfer money back to their account
- Keep records for audit

---

## Pro Tips 💡

1. **Regular Bank Check**: Check your bank account daily for transfers
2. **Set Reminders**: For unpaid orders older than 24 hours
3. **Documentation**: Keep screenshots of proofs for audit trail
4. **Communication**: Be clear in transfer instructions so customers include order number
5. **Backup**: Ensure someone else can also confirm payments if you're unavailable

---

## Troubleshooting

### ❗ "Confirm Payment" button not showing?
- Check if you're logged in as admin
- Verify order status is "PENDING" or "AWAITING_PAYMENT"
- Refresh the page

### ❗ Invoice didn't send to customer?
- Check your email configuration in settings
- Verify customer email is correct in order
- Check spam/junk folder
- Resend manually from order details

### ❗ Bank details not showing to customers?
- Go to Bank Details settings and verify they're saved
- Click "Save Bank Details" again
- Check the preview matches what you entered
- Clear browser cache

---

## Support

For technical issues or questions:
1. Check `BANK_TRANSFER_IMPLEMENTATION.md` for detailed docs
2. Review API endpoints in technical guide
3. Contact support with order number and screenshot

---

**Your bank transfer system is ready to use! 🎉**
