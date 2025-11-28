# Dashboard Tabs - Visual Guide 🎨

## Tab Headers & Colors

### 📘 Users Tab (Purple)
```
┌────────────────────────────────────────────────────┐
│ 👥 Registered Users              [3 total customers] │ (Purple gradient)
│ 🔍 Search by name, email, or phone...            │
└────────────────────────────────────────────────────┘
```

### 🛒 Orders Tab (Orange)
```
┌────────────────────────────────────────────────────┐
│ 🛍️ Recent Orders                  [25 total orders] │ (Orange gradient)
│ 🔍 Search by order #, email, or name...          │
└────────────────────────────────────────────────────┘
```

### 📦 Products Tab (Green)
```
┌────────────────────────────────────────────────────┐
│ 📦 Products Catalog               [48 total products]│ (Green gradient)
│ 🔍 Search products by name or category...        │
└────────────────────────────────────────────────────┘
```

### ⏰ Pending Tab (Red)
```
┌────────────────────────────────────────────────────┐
│ ⏱️ Pending / Unpaid Orders    ⚠️ [5 orders awaiting] │ (Red gradient)
│ 💰 Total Pending: ₦2,500,000 | Count: 5         │
│ 🔍 Search by order #, email, or name...         │
└────────────────────────────────────────────────────┘
```

---

## Users Tab Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│ User │ Contact              │ Orders │ Member Since │ Last Active    │
├─────────────────────────────────────────────────────────────────────┤
│ 🟣 JD │ john@mail.com        │  🛍 5  │ Nov 15, 2024 │ 🟢 Nov 27  │
│ Jane Doe                     │ Admin  │             │                │
├─────────────────────────────────────────────────────────────────────┤
│ 🟢 MD │ mary@mail.com        │  🛍 8  │ Oct 20, 2024 │ 🟢 Nov 26  │
│ Mary D...                    │        │             │                │
└─────────────────────────────────────────────────────────────────────┘

EXPANDABLE ROW:
┌─────────────────────────────────────────────────────────────────────┐
│ Email: john@mail.com      │ Phone: 08012345678    │ Member for: 42 days │
├─────────────────────────────────────────────────────────────────────┤
│ Recent Orders (5):                                                    │
│  Order #A1B2C3  2024-11-27  ₦150,000  🟢 Completed                 │
│  Order #D4E5F6  2024-11-26  ₦75,000   🟡 Pending                   │
│  Order #G7H8I9  2024-11-25  ₦200,000  🟢 Completed                 │
└─────────────────────────────────────────────────────────────────────┘

ACTIONS:  👁️ View  🔄 Reset Password  🗑️ Delete
```

---

## Orders Tab Layout

### Filter Tabs:
```
[All Orders (25)] [Confirmed (18)] [Pending (5)] [Cancelled (2)]
```

### Table:
```
┌──────────┬──────────────────────┬────────┬──────────┬──────────┬──────────┐
│ Order #  │ Customer             │ Items  │ Total    │ Date     │ Status   │
├──────────┼──────────────────────┼────────┼──────────┼──────────┼──────────┤
│ ORD-0001 │ John Doe             │ 🛍 3   │ ₦500,000 │ Nov 27   │ ✅ Conf. │
│          │ john@email.com       │        │          │          │          │
├──────────┼──────────────────────┼────────┼──────────┼──────────┼──────────┤
│ ORD-0002 │ Mary Smith           │ 🛍 1   │ ₦150,000 │ Nov 26   │ ⏳ Pend. │
│          │ mary@email.com       │        │          │          │          │
├──────────┼──────────────────────┼────────┼──────────┼──────────┼──────────┤
│ ORD-0003 │ Peter Johnson        │ 🛍 5   │ ₦750,000 │ Nov 25   │ ❌ Can.  │
│          │ peter@email.com      │        │          │          │          │
└──────────┴──────────────────────┴────────┴──────────┴──────────┴──────────┘
```

### Status Colors:
- 🟢 **Confirmed/Completed** - Green background, green text
- 🟡 **Pending/Unpaid** - Yellow background, yellow text
- 🔴 **Cancelled** - Red background, red text
- ⚪ **Unknown** - Gray background, gray text

---

## Products Tab Layout

### Category Tabs:
```
[All Products (48)] [Electronics (15)] [Fashion (18)] [Home (15)]
```

### Product Grid:
```
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│ 📷 Product      │  │ 📷 Product      │  │ 📷 Product      │  │ 📷 Product      │
│ Image Here      │  │ Image Here      │  │ Image Here      │  │ Image Here      │
│                 │  │                 │  │                 │  │                 │
│ Product Name    │  │ Product Name    │  │ Product Name    │  │ Product Name    │
│ Electronics     │  │ Fashion         │  │ Electronics     │  │ Home            │
│                 │  │                 │  │                 │  │                 │
│ Sell: ₦50,000   │  │ Sell: ₦35,000   │  │ Sell: ₦100,000  │  │ Sell: ₦25,000   │
│ Rent: ₦5,000    │  │ Rent: N/A       │  │ Rent: ₦8,000    │  │ Rent: ₦2,000    │
└─────────────────┘  └─────────────────┘  └─────────────────┘  └─────────────────┘

┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│ 📷 Product      │  │ 📷 Product      │  │ 📷 Product      │
│ Image Here      │  │ Image Here      │  │ Image Here      │
│ BADGE           │  │ BADGE           │  │                 │
│ Product Name    │  │ Product Name    │  │ Product Name    │
│ Fashion         │  │ Electronics     │  │ Home            │
│                 │  │                 │  │                 │
│ Sell: ₦75,000   │  │ Sell: ₦120,000  │  │ Sell: ₦45,000   │
│ Rent: ₦7,500    │  │ Rent: ₦10,000   │  │ Rent: ₦4,500    │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

**Features:**
- 🎨 Product image with fallback package icon
- 🏷️ Product badge in top-right corner (if available)
- 📝 Product name (max 2 lines)
- 🏷️ Category badge (colored)
- 💚 Sell price in GREEN
- 💙 Rent price in BLUE (if available)

---

## Pending Tab Layout

### Summary Stats (at top):
```
┌────────────────────────────────────┐  ┌────────────────────────────────┐
│ Total Pending Amount               │  │ Orders Count                   │
│ ₦2,500,000                         │  │ 5                              │
└────────────────────────────────────┘  └────────────────────────────────┘
```

### Sort Options:
```
Sort by: [Newest First ▼] [Oldest First] [Highest Amount]
```

### Pending Order Cards:
```
┌─────────────────────────────────────────────────────────────────┐
│ ORD-0042 🔴 7 days old                   ₦500,000            │
│ John Doe                                 ⏳ Pending           │
│ john@email.com                           3 items             │
│ 📅 Nov 20, 2024                                              │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ ORD-0051 🟠 5 days old                   ₦750,000            │
│ Mary Smith                               ⏳ Unpaid            │
│ mary@email.com                           5 items             │
│ 📅 Nov 22, 2024                                              │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ ORD-0065 🟡 1 day old                    ₦250,000            │
│ Peter Johnson                            ⏳ Pending           │
│ peter@email.com                          2 items             │
│ 📅 Nov 26, 2024                                              │
└─────────────────────────────────────────────────────────────────┘
```

### Urgency Color System:
- 🔴 **Red:** 7+ days old (URGENT - needs immediate attention)
- 🟠 **Orange:** 3-7 days old (Important - should follow up)
- 🟡 **Yellow:** < 3 days old (New - monitor)

---

## Interactive Features

### Search Bars:
```
🔍 Search by [Tab-specific fields...]
```
- Users: name, email, phone
- Orders: order #, email, name
- Products: name, category
- Pending: order #, email, name

### Filter Tabs:
```
[Option 1 (Count)] [Option 2 (Count)] [Option 3 (Count)] [Option 4 (Count)]
```
- Click to filter
- Shows count for each option
- Active tab highlighted

### Sort Options:
```
Sort by: [Option ▼]
```
- Dropdown with 2-4 options per tab
- Sorts displayed data instantly

### Actions:
```
👁️  🔄  🗑️  (Hover buttons)
```
- View/Expand details
- Reset/Edit
- Delete

---

## Loading States

### Default (all tabs):
```
    ⟳ ⟲
    
Loading [Tab Name]...
```
Animated spinner with message

---

## Empty States

### Users Tab:
```
👤

No registered users yet
Users who sign up will appear here
```

### Orders Tab:
```
🛍️

No orders yet
Orders will appear here once customers make purchases
```

### Products Tab:
```
📦

No products yet
Products will appear here once you add them
```

### Pending Tab:
```
⏱️

All caught up!
No pending or unpaid orders at the moment
```

---

## Error States

### All Tabs:
```
⚠️  Error loading [Tab Name]
    [Specific error message]
    [Try again button]
```

---

## Responsive Behavior

### Mobile (< 768px):
- Single column layouts
- Search bar in header
- Stacked tables (scroll horizontally)
- Simplified filter tabs
- Card-based layout for pending

### Tablet (768px - 1024px):
- 2-column grid
- Filter tabs with scrolling
- Larger tap targets

### Desktop (> 1024px):
- Full width tables
- All columns visible
- Product grid (3-4 columns)
- All features visible

### Ultra-wide (> 1536px):
- Product grid (4+ columns)
- Wider tables
- Maximum spacing

---

## Color Reference

| Tab | Color | Header | Badges | Icons |
|-----|-------|--------|--------|-------|
| Users | Purple | `from-purple-600 to-purple-700` | Active: `bg-purple-100` | `text-purple-600` |
| Orders | Orange | `from-orange-600 to-orange-700` | Active: `bg-orange-600` | `text-orange-600` |
| Products | Green | `from-green-600 to-green-700` | Active: `bg-green-600` | `text-green-600` |
| Pending | Red | `from-red-600 to-red-700` | Active: `bg-red-600` | `text-red-600` |

---

## Text Formatting

### Dates:
- Format: `Nov 27, 2024`
- Hover shows: Full date/time

### Currency:
- Format: `₦500,000`
- No decimals (NGN format)
- Thousands separated by comma

### Names/IDs:
- User names: Normal text
- Order numbers: Monospace font (for readability)
- Email: Smaller text below name

### Badges:
- Status: Rounded pill shape, color-coded
- Category: Small, pill-shaped
- Admin: Small, purple background

---

## Summary

✅ All tabs follow consistent design patterns
✅ Color-coded for quick visual identification
✅ Responsive and mobile-friendly
✅ Professional and polished appearance
✅ Rich information at a glance
✅ Interactive and feature-rich
✅ Real data from MongoDB
✅ Error handling and loading states
✅ Search, filter, and sort capabilities
✅ Production-ready

🚀 **Ready to test and deploy!**
