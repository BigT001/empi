# Offline Orders Management - Visual Guide

## 📊 What Admin Sees

### 1. Offline VAT Summary Tab
Located in the Finance Dashboard > VAT Management > "Offline VAT Summary" tab

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Offline Orders Management                                                   │
│ Manage all manual/offline sales transactions...                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│     🛒       │  │      💰       │  │      ↑       │  │      ↑       │
│  Total       │  │  Sales       │  │  VAT         │  │  Total       │
│  Offline     │  │  (Ex VAT)    │  │  Collected   │  │  Revenue     │
│  Orders      │  │              │  │  (7.5%)      │  │  (Inc VAT)   │
├──────────────┤  ├──────────────┤  ├──────────────┤  ├──────────────┤
│      5       │  │  ₦125,000    │  │  ₦9,375      │  │  ₦134,375    │
└──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘

Search box: "Search by order #, customer name, or email..."  [+ Add Offline Order]

┌─────────────────────────────────────────────────────────────────────────────┐
│ Order #        │ Customer     │ Contact  │ Amount    │ VAT    │ Total     │
├─────────────────────────────────────────────────────────────────────────────┤
│ OFF-1727...    │ John Doe     │ 08123... │ ₦25,000   │ ₦1,875 │ ₦26,875   │
│ OFF-1726...    │ Jane Smith   │ jane@... │ ₦30,000   │ ₦2,250 │ ₦32,250   │
│ OFF-1725...    │ Bob Wilson   │ 07015... │ ₦20,000   │ ₦1,500 │ ₦21,500   │
│ OFF-1724...    │ Alice Brown  │ alice@.. │ ₦35,000   │ ₦2,625 │ ₦37,625   │
│ OFF-1723...    │ Carol Davis  │ 09087... │ ₦15,000   │ ₦1,125 │ ₦16,125   │
└─────────────────────────────────────────────────────────────────────────────┘
Payment │ Status    │ Date        │ Actions
────────┼───────────┼─────────────┼──────────────
Cash    │ Completed │ Nov 27 2024 │ [👁️] [✏️] [🗑️]
B-Trans │ Completed │ Nov 26 2024 │ [👁️] [✏️] [🗑️]
Card    │ Completed │ Nov 25 2024 │ [👁️] [✏️] [🗑️]
Cash    │ Pending   │ Nov 24 2024 │ [👁️] [✏️] [🗑️]
B-Trans │ Completed │ Nov 23 2024 │ [👁️] [✏️] [🗑️]

Showing 5 of 5 orders  [< Prev]  Page 1 of 1  [Next >]
```

## 🎯 Actions User Can Perform

### Action 1: Add New Offline Order
```
Admin clicks: [+ Add Offline Order]

Modal opens:
┌──────────────────────────────────────────────────────┐
│ Add Offline Order                              [X]   │
├──────────────────────────────────────────────────────┤
│ First Name *           │ Last Name *                 │
│ [_______________]      │ [_________________]         │
│                                                      │
│ Email *                                              │
│ [_____________________________]                      │
│                                                      │
│ Phone                 │ City                         │
│ [________________]     │ [________________]           │
│                                                      │
│ State                 │ Amount *                     │
│ [________________]     │ [________________]           │
│                                                      │
│ Item Description                                     │
│ [____________________________________]              │
│                                                      │
│ Payment Method                                       │
│ [▼ Cash ▼]                                           │
│                                                      │
│ 💡 VAT Preview: 7.5% = ₦1,875 on ₦25,000           │
│ Total with VAT: ₦26,875                             │
│                                                      │
│                            [Cancel]  [Save Order]   │
└──────────────────────────────────────────────────────┘

After clicking Save:
✅ Offline order saved successfully
[Shows new order in table immediately]
```

### Action 2: View Order Details
```
Admin clicks: [👁️] View icon

Modal opens:
┌─────────────────────────────────────────────┐
│ Order Details                          [X]  │
├─────────────────────────────────────────────┤
│ Order Number: OFF-1727...                   │
│                                             │
│ First Name: John      │ Last Name: Doe      │
│ Email: john@email.com                       │
│ Phone: 08123456789                          │
│ Location: Lagos, Lagos                      │
│                                             │
│ Amount: ₦25,000                             │
│ VAT (7.5%): ₦1,875                         │
│ ┌─────────────────────────────────────────┐ │
│ │ Total: ₦26,875                          │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ Payment: [Cash]    │ Status: [Completed]   │
│ Date: Nov 27, 2024                         │
└─────────────────────────────────────────────┘
```

### Action 3: Edit Order
```
Admin clicks: [✏️] Edit icon

Same form opens but with data pre-filled:
┌──────────────────────────────────────────────────────┐
│ Edit Offline Order                            [X]    │
├──────────────────────────────────────────────────────┤
│ First Name *           │ Last Name *                 │
│ [John____________]     │ [Doe______________]         │
│                                                      │
│ Email *                                              │
│ [john@email.com________________]                     │
│                                                      │
│ Phone                 │ City                         │
│ [08123456789____]     │ [Lagos____________]          │
│                                                      │
│ State                 │ Amount *                     │
│ [Lagos____________]    │ [25000____________]         │
│                                                      │
│ Payment Method                                       │
│ [▼ Cash ▼]                                           │
│                                                      │
│ 💡 VAT Preview: 7.5% = ₦1,875 on ₦25,000           │
│ Total with VAT: ₦26,875                             │
│                                                      │
│                            [Cancel]  [Update Order] │
└──────────────────────────────────────────────────────┘

After clicking Update:
✅ Offline order updated successfully
[Table shows updated information]
```

### Action 4: Delete Order
```
Admin clicks: [🗑️] Delete icon

Confirmation dialog:
┌──────────────────────────────────────────┐
│ Delete Order?                             │
├──────────────────────────────────────────┤
│ Are you sure you want to delete this      │
│ offline order? This action cannot be      │
│ undone.                                   │
│                                           │
│                    [Cancel]  [Delete]    │
└──────────────────────────────────────────┘

After clicking Delete:
✅ Offline order deleted successfully
[Order removed from table immediately]
```

## 🔍 Search & Filter

```
Search by: Order Number
  ↓
OFF-1727... appears in table
All other orders hidden

Search by: Customer Name
  ↓
"John" → Shows only John Doe's orders

Search by: Email
  ↓
"jane@" → Shows Jane Smith's orders

[Clear search to see all orders again]
```

## 📄 Table Columns Explained

| Column | What It Shows |
|--------|---------------|
| **Order #** | Unique identifier (OFF-{timestamp}-{random}) |
| **Customer** | First and Last Name, plus Email below |
| **Contact** | Phone number and City, State |
| **Amount** | Sales amount BEFORE VAT is added |
| **VAT** | 7.5% tax collected (shown in orange) |
| **Total** | Final amount including VAT (shown in green) |
| **Payment** | How customer paid (Cash, Bank Transfer, Card) |
| **Status** | Order status (Completed, Pending, Cancelled) |
| **Date** | When order was created (localized format) |
| **Actions** | View 👁️, Edit ✏️, Delete 🗑️ buttons |

## 🎨 Color Coding

### Status Badges
- 🟢 **Completed** - Green background (order processed)
- 🟡 **Pending** - Yellow background (awaiting action)
- 🔴 **Cancelled** - Red background (order cancelled)

### Payment Method Badges
- 🔵 **Cash** - Blue background
- 🟣 **Bank Transfer** - Purple background
- 🟢 **Card** - Green background

### Amount Colors
- **Amount (Ex VAT)** - Black text (neutral)
- **VAT** - Orange text (tax highlight)
- **Total** - Green text (positive/revenue)

## 📱 Mobile View

On small screens, table becomes scrollable horizontally:
```
[← Scroll → ]
┌─────────────────────────────────────────────┐
│ Order # │ Customer │ Amount │ VAT │ Actions │
├─────────────────────────────────────────────┤
│ OFF-... │ John Doe │ ₦25k   │ ₦2k │ [...]   │
│ OFF-... │ Jane ... │ ₦30k   │ ₦3k │ [...]   │
└─────────────────────────────────────────────┘
```

## 📊 Pagination

```
Showing 1 to 10 of 45 orders

[< Previous] Page 1 of 5 [Next >]
                ↓
              Page 2 of 5
                ↓
              Page 3 of 5
                ↓
              Page 4 of 5
                ↓
              Page 5 of 5
```

## ✅ Best Practices

1. **Add orders regularly**: Build a complete record of all offline sales
2. **Use consistent data**: Keep customer names and emails formatted consistently
3. **Update amounts carefully**: Any amount change recalculates VAT automatically
4. **Delete cautiously**: Deleted orders cannot be recovered
5. **Review monthly**: Use the summary cards to verify VAT collections
6. **Track payments**: Use the payment method field to record how customers paid

## 🚀 Quick Tips

- **Bulk Entry**: No bulk import yet, but you can add orders one by one quickly
- **Search Tips**: Search is instant - no need to press Enter
- **Pagination**: Jump to page 2-5 if you have many orders
- **Recovery**: If you accidentally delete, check database backups
- **Validation**: Form won't submit if required fields are empty
- **Auto-calculations**: VAT is always 7.5%, calculated automatically
