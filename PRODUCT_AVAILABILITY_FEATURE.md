# Product Availability Feature Implementation

## 🎯 Feature Overview

Enable admin to control which products are available for **BUY**, **RENT**, or **BOTH** modes independently. Some products should only be available for purchase, some only for rental, and some for both.

## 📋 Implementation Steps

### Step 1: Update Product Schema
**File:** `lib/models/Product.ts`

Add two new boolean fields to control availability:
```typescript
availableForBuy: { type: Boolean, default: true }    // Can be purchased
availableForRent: { type: Boolean, default: true }   // Can be rented
```

### Step 2: Update Admin Upload Form
**File:** `app/admin/mobile-upload.tsx`

Add two toggle switches in the upload form:
- ☑️ Available for Purchase (default: checked)
- ☑️ Available for Rental (default: checked)

Update form state to include:
```typescript
availableForBuy: boolean;
availableForRent: boolean;
```

### Step 3: Update Product Detail Page
**File:** `app/product/[id]/ProductDetailClient.tsx`

Show/hide mode buttons based on availability:
- Only show "🛒 BUY" button if `availableForBuy === true`
- Only show "🎪 RENT" button if `availableForRent === true`
- If only one mode available, auto-select it
- If neither available, show error message

Add helpful badges:
- "Rental Only" badge if rentals available but not for sale
- "For Sale Only" badge if available for sale but not for rent
- Disable unavailable mode with reason message

### Step 4: Update Product Filtering (Search/List)
**File:** `app/api/products` and `app/search/page.tsx`

Add mode filter to query:
- When user selects "BUY" mode → only show products where `availableForBuy === true`
- When user selects "RENT" mode → only show products where `availableForRent === true`

Update API endpoint to accept mode query parameter:
```typescript
const mode = req.query.mode; // 'buy' or 'rent'
// Filter: mode === 'buy' ? availableForBuy : availableForRent
```

### Step 5: Update Product Card Component
**File:** `app/components/ProductCard.tsx`

Add visual indicators:
- Show availability badge (e.g., "Rental Only", "Buy Only")
- Show icons indicating which modes are available
- Strike through unavailable mode prices (if shown)

### Step 6: Update Admin Products Page
**File:** `app/admin/products/page.tsx`

Add availability columns:
- ✅ BUY column (toggleable)
- ✅ RENT column (toggleable)
- Allow bulk editing of availability

### Step 7: Update Cart/Checkout
**File:** Cart and Checkout components

Validate before allowing checkout:
- If mode is "buy" but `availableForBuy === false` → remove item with warning
- If mode is "rent" but `availableForRent === false` → remove item with warning

### Step 8: Update Mode Context/Store
**File:** `app/context/ModeContext.tsx`

When setting mode per product:
- Check if selected mode is available
- Auto-select available mode if current selection unavailable
- Show tooltip explaining why mode is disabled

---

## 🎨 UI/UX Changes

### Product Detail Page
```
┌─────────────────────────────┐
│  Product Name               │
│  [Image]                    │
│                             │
│  Price: ₦50,000            │
│                             │
│  Available Modes:           │
│  [ BUY ONLY ]               │  ← Only show available modes
│  [ 🎪 RENT ONLY ] (disabled) │  ← Gray out unavailable
│                             │
│  Quantity: [1]              │
│  [Add to Cart]              │
└─────────────────────────────┘
```

### Admin Upload Form
```
Available For:
☑️ Purchase (BUY)    ← New toggle
☑️ Rental (RENT)     ← New toggle
```

### Search Results
```
Product 1: 👕 Shirt
├─ BUY: ₦15,000
├─ Badges: [For Sale Only]   ← Availability badge
└─ Status: Available for purchase

Product 2: 🎭 Costume
├─ RENT: ₦5,000/day
├─ Badges: [Rental Only]     ← Availability badge
└─ Status: Available for rental only
```

---

## 🔄 API Changes

### POST/PUT `/api/admin/upload` (Product Upload)
Add fields to request body:
```json
{
  "name": "Costume Name",
  "sellPrice": 50000,
  "rentPrice": 5000,
  "availableForBuy": true,    // ← NEW
  "availableForRent": true,   // ← NEW
  ...existing fields
}
```

### GET `/api/products`
Update query parameters:
```
GET /api/products?search=&category=&mode=buy
// Returns only products where availableForBuy === true

GET /api/products?search=&category=&mode=rent
// Returns only products where availableForRent === true
```

### GET `/api/products/[id]`
Response includes availability flags:
```json
{
  "_id": "...",
  "name": "...",
  "availableForBuy": true,
  "availableForRent": false,
  ...
}
```

---

## 🎯 Implementation Order

1. ✅ **Schema** - Update Product model (5 min)
2. ✅ **Admin Upload** - Add toggles to upload form (15 min)
3. ✅ **Product Detail** - Show/hide modes, add badges (20 min)
4. ✅ **API Filtering** - Update query logic (15 min)
5. ✅ **Search Results** - Apply filters (10 min)
6. ✅ **Product Card** - Add visual indicators (10 min)
7. ✅ **Admin Products Page** - Availability columns (15 min)
8. ✅ **Cart Validation** - Check availability (10 min)
9. ✅ **Mode Context** - Auto-select logic (10 min)

**Total Estimated Time: ~2 hours**

---

## 🧪 Testing Checklist

- [ ] Create product with only BUY available
- [ ] Create product with only RENT available
- [ ] Create product with both BUY and RENT available
- [ ] Verify product detail shows only available modes
- [ ] Verify search filters products by mode availability
- [ ] Verify unavailable mode buttons are disabled
- [ ] Verify unavailable products don't appear in wrong category
- [ ] Test adding item to cart, then removing availability
- [ ] Test admin toggle to change availability
- [ ] Test bulk edit of availability

---

## 📝 Database Migration

After updating schema, need to set defaults for existing products:
```typescript
// Backfill existing products to have both modes available
db.products.updateMany(
  {},
  { 
    $set: { 
      availableForBuy: true, 
      availableForRent: true 
    } 
  }
)
```

---

## 💡 Future Enhancements

- Schedule availability (available from X to Y date)
- Stock/inventory management per mode
- Different images for buy vs rent listings
- Seasonal availability
- Availability by region/delivery location
