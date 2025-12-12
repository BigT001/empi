# 🎨 Checkout Page - Visual & Component Reference

## Color Palette Reference

### Backgrounds & Gradients

```
Order Items Section
┌─────────────────────────────────────────────┐
│ bg-white rounded-2xl shadow-sm              │
│ border border-gray-100                      │
│ hover:shadow-md transition-shadow           │
│ p-8                                         │
│                                             │
│ ITEM CARDS INSIDE:                          │
│ ┌─────────────────────────────────────────┐ │
│ │ from-gray-50 to-transparent gradient    │ │
│ │ rounded-xl border border-gray-100       │ │
│ │ hover:border-blue-200                   │ │
│ └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘

Custom Order Details (Quote Mode)
┌─────────────────────────────────────────────┐
│ bg-white rounded-2xl shadow-sm              │
│ border border-gray-100                      │
│ p-8                                         │
│ hover:shadow-md                             │
│                                             │
│ IMAGE CONTAINER:                            │
│ ┌─────────────────────────────────────────┐ │
│ │ bg-gray-100 rounded-xl overflow-hidden  │ │
│ │ w-full h-64 object-cover                │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ FALLBACK:                                   │
│ ┌─────────────────────────────────────────┐ │
│ │ bg-gray-200 text-gray-500 (no image)    │ │
│ └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘

Custom Order Quote Section
┌─────────────────────────────────────────────┐
│ bg-gradient-to-br from-lime-50 to-green-50 │
│ rounded-2xl shadow-sm                       │
│ border border-lime-300                      │
│ p-8                                         │
│ hover:shadow-md                             │
│                                             │
│ UNIT PRICE:                                 │
│ ┌─────────────────────────────────────────┐ │
│ │ bg-white/60 p-4 rounded-xl              │ │
│ │ border border-lime-200                  │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ DISCOUNT (if applicable):                   │
│ ┌─────────────────────────────────────────┐ │
│ │ bg-green-50 p-4 rounded-xl              │ │
│ │ border border-green-200                 │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ VAT:                                        │
│ ┌─────────────────────────────────────────┐ │
│ │ bg-blue-50 p-4 rounded-xl               │ │
│ │ border border-blue-200                  │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ TOTAL:                                      │
│ ┌─────────────────────────────────────────┐ │
│ │ bg-gradient-to-br from-lime-100         │ │
│ │ to-green-100 p-4 rounded-xl             │ │
│ │ border border-lime-400                  │ │
│ └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘

Rental Schedule Section
┌─────────────────────────────────────────────┐
│ bg-gradient-to-br from-purple-50 to-pink-50│
│ rounded-2xl shadow-sm                       │
│ border border-purple-200                    │
│ p-6                                         │
│ hover:shadow-md                             │
│                                             │
│ PICKUP/RETURN CARDS:                        │
│ ┌─────────────────────────────────────────┐ │
│ │ bg-white/60 rounded-lg p-4              │ │
│ └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘

Delivery Information Section
┌─────────────────────────────────────────────┐
│ bg-gradient-to-br from-green-50             │
│ to-emerald-50 rounded-2xl                   │
│ border border-green-200                     │
│ p-6                                         │
│ hover:shadow-md                             │
│                                             │
│ INFO CARDS:                                 │
│ ┌─────────────────────────────────────────┐ │
│ │ bg-white/60 rounded-lg p-4              │ │
│ └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘

Billing Information Section
┌─────────────────────────────────────────────┐
│ bg-white rounded-2xl shadow-sm              │
│ border border-gray-100 p-6                  │
│ hover:shadow-md                             │
│                                             │
│ FIELD ROWS:                                 │
│ ┌─────────────────────────────────────────┐ │
│ │ from-gray-50 to-transparent gradient    │ │
│ │ rounded-lg border border-gray-100       │ │
│ │ p-4                                     │ │
│ └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘

Payment Summary Sidebar (Regular Order)
┌─────────────────────────────────────────────┐
│ bg-white rounded-2xl shadow-sm              │
│ border border-gray-100 p-6                  │
│ hover:shadow-md                             │
│                                             │
│ [Subtotal Section]                          │
│ [Bulk Discount - if applicable]             │
│ ├─ bg-green-50 p-3 rounded-lg              │
│ ├─ border border-green-200                 │
│                                             │
│ [Caution Fee - if applicable]               │
│ [Shipping]                                  │
│ [VAT]                                       │
│                                             │
│ [TOTAL SECTION]                             │
│ ┌─────────────────────────────────────────┐ │
│ │ bg-gradient-to-br from-purple-50        │ │
│ │ to-blue-50 rounded-xl p-4               │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ [Status Indicator]                          │
│ CheckCircle2 icon (green-600)              │ │
│ "✅ Ready for Payment"                      │
└─────────────────────────────────────────────┘

Payment Summary Sidebar (Quote)
┌─────────────────────────────────────────────┐
│ bg-gradient-to-br from-lime-50 to-green-50 │
│ rounded-2xl shadow-sm                       │
│ border border-lime-300                      │
│ p-6                                         │
│ hover:shadow-md                             │
│                                             │
│ [Quote Details]                             │
│ ├─ bg-white rounded-lg p-4                 │
│                                             │
│ [Pricing Breakdown]                         │
│ ├─ Unit Price                               │
│ ├─ Discount (if applicable)                 │
│ │  └─ bg-green-50 p-3 rounded-lg          │
│ ├─ VAT                                      │
│                                             │
│ [TOTAL SECTION]                             │
│ ├─ bg-gradient-to-br from-lime-100         │
│ │  to-green-100 rounded-xl p-4             │
│ │  border border-lime-400                  │
│                                             │
│ [Status Indicator]                          │
│ ├─ CheckCircle2 icon (green-600)           │
│ ├─ "✅ Ready for Payment"                   │
└─────────────────────────────────────────────┘

Security Badge (Sidebar Bottom)
┌─────────────────────────────────────────────┐
│ bg-gradient-to-br from-green-50             │
│ to-emerald-50 rounded-2xl                   │
│ border border-green-200 p-4                 │
│                                             │
│ Lock icon (green-600)                       │
│ "SECURE PAYMENT"                            │
│ "Your payment information is encrypted..."  │
└─────────────────────────────────────────────┘
```

---

## Icon Reference

| Component | Icon | Color | Size |
|-----------|------|-------|------|
| Page Header | CreditCard | white (in purple-700 box) | h-6 w-6 |
| Order Items Header | ShoppingBag | blue-600 (in blue-100 box) | h-5 w-5 |
| Custom Order Details Header | ShoppingBag | blue-600 (in blue-100 box) | h-5 w-5 |
| No Image Fallback | ShoppingBag | gray-400 | h-12 w-12 |
| Custom Order Quote Header | FileText | lime-600 (in lime-100 box) | h-5 w-5 |
| Rental Schedule Header | Clock | purple-600 (in purple-100 box) | h-5 w-5 |
| Delivery Header | Truck | green-600 (in green-100 box) | h-5 w-5 |
| Billing Header | Lock | blue-600 (in blue-100 box) | h-5 w-5 |
| Error Alert | AlertCircle | red-600 | h-5 w-5 |
| Back Button | Text only ("←") | gray-800 | - |
| Pay Button Icon | Lock | white | h-4 w-4 |
| Security Badge | Lock | green-600 | h-4 w-4 |
| Status Check | CheckCircle2 | green-600 | h-4 w-4 |
| Item Mode Badges | Text emoji | green/purple | - |

---

## Typography System

```
H1 - Page Title (Order Review)
├─ font-bold text-4xl
├─ bg-gradient-to-r from-purple-600 to-blue-600
├─ bg-clip-text text-transparent

H2 - Section Headers (Order Items, Order Details, etc)
├─ font-bold text-xl
├─ text-gray-900

H3 - Subsection Headers (Quote Details, Items Breakdown, etc)
├─ font-bold text-lg
├─ text-gray-900

Labels
├─ text-xs font-semibold text-gray-600
├─ mb-2 or mb-3
├─ uppercase tracking-wide

Values
├─ font-bold or font-semibold
├─ text-gray-900
├─ text-lg or text-xl (for prominent values)

Subtexts
├─ text-xs or text-sm
├─ text-gray-600 or text-gray-700
├─ mt-1 or mt-2

Descriptions
├─ text-sm
├─ text-gray-700
├─ leading-relaxed

Total Amount (Large Display)
├─ font-black text-3xl or text-4xl
├─ bg-gradient-to-r (from-purple-600 to-blue-600 OR from-lime-600 to-green-600)
├─ bg-clip-text text-transparent
```

---

## Button Styles

### Back to Cart Button
```tsx
bg-gray-200 hover:bg-gray-300
text-gray-800 font-semibold
px-6 py-4 rounded-xl
transition duration-200
inline-block text-center
```

### Pay Button
```tsx
bg-gradient-to-r from-purple-600 to-blue-600
hover:from-purple-700 hover:to-blue-700
disabled:from-gray-400 disabled:to-gray-400
text-white font-bold
px-6 py-4 rounded-xl
transition duration-200
shadow-lg hover:shadow-xl
```

### Processing State
```tsx
Spinner: h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin
Text: "Processing..."
```

---

## Badge System

### Item Mode Badges
```
Rental Badge:
├─ bg-purple-100 text-purple-700
├─ px-3 py-1.5 rounded-full
├─ text-xs font-bold whitespace-nowrap
├─ Text: "🔄 Rental"

Buy Badge:
├─ bg-green-100 text-green-700
├─ px-3 py-1.5 rounded-full
├─ text-xs font-bold whitespace-nowrap
├─ Text: "🛍️ Buy"
```

---

## Layout Grid System

### Main Page Grid
```
lg:grid-cols-3 gap-8
├─ Column 1-2 (lg:col-span-2) - Main Content - 66.67%
│  └─ space-y-6 (6 sections)
│
└─ Column 3 (lg:col-span-1) - Sidebar - 33.33%
   └─ sticky top-24 space-y-6 (2 items)
```

### Custom Order Grid
```
md:grid-cols-3 gap-8
├─ Column 1 (md:col-span-1) - Image - 33.33%
└─ Columns 2-3 (md:col-span-2) - Details - 66.67%
   └─ space-y-4
      ├─ Order number & name
      ├─ Description (with border-top)
      ├─ Quantity & Location (grid-cols-2)
      └─ Contact Info (with gradient bg)
```

### Rental Schedule Grid
```
md:grid-cols-2 gap-6
├─ Pickup Card
└─ Return Card
```

### Delivery Information Grid
```
md:grid-cols-2 gap-4
├─ Distance Card
├─ Estimated Time Card
└─ Address Card (md:col-span-2) - Full width
```

---

## Spacing System

```
Section Padding: p-6, p-8
├─ Most sections: p-8 (for large containers)
└─ Some cards: p-6 (for medium containers)

Section Gaps: gap-6, gap-8
├─ Large gaps: gap-8 (main layout grid)
├─ Medium gaps: gap-6 (internal grids)
└─ Small gaps: gap-4 (detailed grids)

Internal Spacing: space-y-3, space-y-4, space-y-6
├─ Tight: space-y-3 (items list)
├─ Medium: space-y-4 (form fields)
└─ Large: space-y-6 (sections)

Border Separators:
├─ pb-4 pt-4 border-t or border-b
├─ Colors: border-gray-200, border-green-200, border-lime-200, border-blue-200
```

---

## Responsive Behavior Reference

```
Mobile (< 768px)
├─ Single column layout
├─ All sections stack vertically
├─ space-y-6 between sections
├─ No sticky sidebar (sidebar below content)
├─ Full-width components
├─ Auth modal shown if not logged in

Tablet (768px - 1023px)
├─ Still single column for lg breakpoint
├─ Better spacing/padding
├─ No sticky sidebar yet
├─ grid-cols-2 for 2-column layouts inside sections

Desktop (1024px+)
├─ 3-column main grid (lg:grid-cols-3)
├─ Sidebar becomes sticky (top-24)
├─ md:grid-cols-* responsive classes activate
├─ grid-cols-2 for 2-column internal layouts
```

---

## Summary Table

| Element | Style Class | Color | Border | Padding |
|---------|-------------|-------|--------|---------|
| Card Container | rounded-2xl shadow-sm | bg-white/gradient | border-gray-100/lime-300/green-200/purple-200/blue-200 | p-6/p-8 |
| Section Header | text-xl font-bold | text-gray-900 | - | mb-6 |
| Label | text-xs font-semibold | text-gray-600 | - | mb-2/mb-3 |
| Badge | rounded-full text-xs font-bold | bg-green-100/purple-100 | - | px-3 py-1.5 |
| Button | rounded-xl font-bold | gradient colors | - | px-6 py-4 |
| Border Separator | border-t or border-b | border-gray-200/green-200/lime-200/blue-200 | - | pt-4 pb-4 |
| Icon Box | rounded-lg | bg-gradient-to-br | - | p-3 |

---

## Key Visual Hierarchy

**Most Important:**
- Pay button (large, gradient, prominent position)
- Total amount (large text, gradient, bold)
- Order items list

**Important:**
- Section headers with icons
- Quote details
- Shipping/delivery info
- Billing info

**Supporting:**
- Labels and descriptions
- Breakdown details
- Status indicators
- Security badge

---

## Consistency Notes

✅ **All section cards:**
- rounded-2xl (not rounded-xl or other)
- shadow-sm border border-color p-6/p-8
- hover:shadow-md transition-shadow

✅ **All headers:**
- Icon in gradient box with rounded-lg p-3
- Header text bold
- Flexbox gap-3 between icon and text

✅ **All prices:**
- Font-bold or font-black
- Gray-900 text color (unless in gradient)
- Locale string formatting with ₦ symbol

✅ **All gradients:**
- bg-gradient-to-br (bottom-right direction)
- Consistent color pairs per section type

✅ **All input-like displays:**
- bg-gradient-to-r from-gray-50 to-transparent
- rounded-lg border border-gray-100
- flex justify-between items-center
- p-4

