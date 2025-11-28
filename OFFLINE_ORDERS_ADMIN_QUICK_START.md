# Offline Orders Management - Admin Quick Start Guide

## 🎯 What Is This?

A **complete offline orders management system** where you can:
- ✅ Manually add orders that weren't done online (social media, phone calls, walk-in customers)
- ✅ View all offline orders in an organized table
- ✅ Search for specific orders quickly
- ✅ Edit order details if needed
- ✅ Delete orders (with confirmation)
- ✅ Track VAT on all offline sales automatically

## 📍 Where to Find It

1. Go to **Finance Dashboard**
2. Click on **VAT Management** tab
3. Click on **Offline VAT Summary** sub-tab (the third tab, right after "Transaction History")
4. You'll see the Offline Orders Management section

## 🚀 How to Use

### Step 1: Add Your First Offline Order

**Option A: From Offline Orders Table**
1. Look for the **"Add Offline Order"** button (green button with + icon)
2. Click it

**Option B: From Finance Dashboard Header**
1. Click **"Add Offline Order"** in the Finance Dashboard header
2. Either way opens the same form

**Form Fields to Fill:**
```
First Name *          → John
Last Name *           → Doe
Email *               → john@example.com
Phone                 → 08123456789
City                  → Lagos
State                 → Lagos
Amount *              → 25000    (this amount gets 7.5% VAT added)
Item Description      → Pack of goods
Payment Method        → Cash / Bank Transfer / Card
```

**What Happens:**
- System auto-calculates VAT: 25000 × 7.5% = 1,875
- Total amount: 26,875 (including VAT)
- Order gets a unique ID: OFF-{date}-{random}
- Click "Save Order" → Order appears in your table immediately
- ✅ Success message appears

### Step 2: View All Your Offline Orders

**The Table Shows:**
- Order # (unique identifier)
- Customer name and email
- Contact info (phone, city, state)
- Amount before VAT
- VAT amount (always 7.5%)
- Total (including VAT)
- Payment method (Cash, Bank Transfer, Card)
- Status (Completed, Pending, Cancelled)
- Date created
- Action buttons (View, Edit, Delete)

**Pagination:**
- Shows 10 orders per page
- Use Previous/Next buttons to navigate
- Shows "Showing X of Y orders"

### Step 3: Search for Specific Orders

**Find by Order Number:**
1. Click the search box
2. Type the order number (e.g., OFF-1727...)
3. Table filters automatically
4. Only matching orders display

**Find by Customer Name:**
1. Type customer's first or last name
2. Table shows only that customer's orders

**Find by Email:**
1. Type email address
2. Table shows only that customer's orders

**Clear Search:**
- Delete text from search box to see all orders again

### Step 4: View Order Details

**To See Full Details:**
1. Find the order in the table
2. Click the **Eye icon** (👁️) in the Actions column
3. A modal pops up showing:
   - Order number
   - Customer's full information
   - All amounts (Ex VAT, VAT, Total)
   - Payment method
   - Status
   - Creation date

**Close Modal:**
- Click the X button in top right

### Step 5: Edit an Order

**If You Need to Change Something:**
1. Find the order in the table
2. Click the **Pencil icon** (✏️) in the Actions column
3. Form opens with current data pre-filled
4. Change what you need:
   - Customer name
   - Email
   - Phone
   - City/State
   - Amount (VAT recalculates automatically)
   - Payment method
   - Status

5. Click **"Update Order"**
6. ✅ Success message appears
7. Table shows updated information

### Step 6: Delete an Order

**To Remove an Order:**
1. Find the order in the table
2. Click the **Trash icon** (🗑️) in the Actions column
3. **Confirmation dialog appears**: "Are you sure you want to delete this offline order?"
4. Choose:
   - **Cancel** → Order stays in system
   - **Delete** → Order is permanently removed

⚠️ **Important:** Deleted orders cannot be recovered! Be careful.

## 📊 Summary Cards (Top of Page)

These automatically update as you add/delete orders:

```
┌─────────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ Total Offline   │  │ Sales        │  │ VAT          │  │ Total        │
│ Orders          │  │ (Ex VAT)     │  │ Collected    │  │ Revenue      │
├─────────────────┤  ├──────────────┤  ├──────────────┤  ├──────────────┤
│ 5 orders        │  │ ₦125,000     │  │ ₦9,375       │  │ ₦134,375     │
└─────────────────┘  └──────────────┘  └──────────────┘  └──────────────┘
```

These show:
- **Total Orders**: How many offline orders you've recorded
- **Sales (Ex VAT)**: Total sales amount BEFORE tax
- **VAT Collected**: Total VAT (7.5% on all sales)
- **Total Revenue**: Everything including tax

## 🎨 Understanding the Colors

**Payment Method (Colored Badges):**
- 🔵 **Cash** - Blue badge
- 🟣 **Bank Transfer** - Purple badge
- 🟢 **Card** - Green badge

**Order Status (Colored Badges):**
- 🟢 **Completed** - Green badge (order is done)
- 🟡 **Pending** - Yellow badge (waiting for something)
- 🔴 **Cancelled** - Red badge (order was cancelled)

**Amount Colors in Table:**
- Black text: Amount before VAT
- Orange text: VAT amount (7.5%)
- Green text: Total including VAT

## ✅ Important Things to Know

### VAT is Automatic
- You only enter the **sale amount** (before VAT)
- System automatically calculates 7.5% VAT
- You never need to calculate it manually

### Order Numbers Are Unique
- Every order gets a unique ID: `OFF-{timestamp}-{random}`
- You don't assign these - system creates them
- Format: OFF-1727625890-ABC123DEF

### All Money Uses Nigerian Format
- ₦ symbol (Nigerian Naira)
- Commas for thousands: ₦1,000,000
- Two decimal places: ₦1,234.56

### Dates Use Nigerian Format
- Nov 27, 2024 (day-month-year)
- Time shown in 24-hour format

### Offline Orders Are Included in VAT Reports
- All offline orders automatically go into:
  - Monthly VAT calculations
  - Annual tax reports
  - Output VAT totals
- No manual work needed for tax filing

## 🔍 Troubleshooting

### Problem: "Can't save order - field is empty"
**Solution:** Make sure you filled in all fields marked with * (required)
- First Name *
- Last Name *
- Email *
- Amount *

### Problem: "Order number doesn't appear to be valid"
**Solution:** Don't worry, the system creates the order number automatically

### Problem: "Can't find an order I just added"
**Solution:** 
- Make sure you're on page 1 (newest orders appear first)
- Or search by customer name or email
- Refresh the page if needed

### Problem: "Amount looks wrong"
**Solution:** Remember:
- Enter the amount BEFORE VAT
- System adds 7.5% tax automatically
- So ₦25,000 becomes ₦26,875 (includes ₦1,875 VAT)

### Problem: "I deleted an order by mistake"
**Solution:** 
- Unfortunately, deleted orders cannot be recovered from this interface
- Contact your system administrator if it's critical
- They may be able to restore from database backups

## 📋 Data to Have Ready

When adding an offline order, have these details:

```
Customer Information:
- Full name (first and last)
- Email address
- Phone number (if available)
- City (if available)
- State (if available)

Sale Information:
- Amount sold (before VAT)
- What was sold/item description
- How they paid (Cash/Bank Transfer/Card)
- Order status (usually "Completed")
```

## 💡 Best Practices

1. **Add Orders Regularly**
   - Don't wait until end of month
   - Add them the day they happen
   - Makes tracking easier

2. **Use Consistent Names**
   - If customer is "John Doe", always write it that way
   - Helps with searching later

3. **Include All Contact Info**
   - Getting complete information helps with follow-ups
   - Phone numbers are especially useful

4. **Double-Check Amounts**
   - Verify the sale amount before submitting
   - System calculates VAT correctly, but wrong input = wrong total

5. **Use Correct Payment Method**
   - Helps with accounting and reconciliation
   - Marks whether you received cash or bank transfer

6. **Set Correct Status**
   - "Completed" = order is finished
   - "Pending" = waiting for something
   - "Cancelled" = customer cancelled

## 🚀 Quick Actions Reference

| What You Want | How to Do It |
|---|---|
| Add new offline order | Click "Add Offline Order" button |
| Find specific order | Type in search box |
| See order details | Click 👁️ View button |
| Change order info | Click ✏️ Edit button |
| Remove order | Click 🗑️ Delete button |
| Go to next page | Click "Next" button at bottom |
| Go to previous page | Click "Previous" button at bottom |
| See all orders again | Clear the search box |

## 📞 Need Help?

If something doesn't work:
1. Check the error message (tells you what's wrong)
2. Follow the troubleshooting section above
3. Contact your system administrator

## 🎓 Example Workflow

**Scenario:** Customer ordered via WhatsApp

1. Customer: "I want 5 t-shirts for ₦5,000 each"
2. You calculate: 5 × ₦5,000 = ₦25,000
3. You go to Offline Orders Management
4. Click "Add Offline Order"
5. Fill in:
   - Name: Adekunle Ahmed
   - Email: adekunle@example.com
   - Phone: 08123456789
   - City: Lagos
   - Amount: 25000
   - Item: 5 T-shirts
   - Payment: Cash (customer paid cash)
   - Status: Completed
6. Click "Save Order"
7. System shows:
   - Subtotal: ₦25,000
   - VAT (7.5%): ₦1,875
   - Total: ₦26,875
8. ✅ Order saved and appears in table
9. Order automatically included in monthly VAT calculations

---

**You're all set!** 🎉

Start adding your offline orders and watch your VAT dashboard update in real-time.
