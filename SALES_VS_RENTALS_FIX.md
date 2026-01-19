# SALES vs RENTALS CATEGORIZATION FIX

## Problem Identified
All orders (both rental and sales) were being recorded under "Rentals" in the dashboard, causing incorrect business metrics and revenue categorization.

## Root Cause
The system had the capability to distinguish orders via item `mode` field ('rent' vs 'buy'), but:
1. No explicit `orderType` field at the Order level to clearly mark rental vs sales orders
2. Items without explicit `mode` would default to being counted as sales
3. Mixed orders (both rental and sales items) weren't properly categorized

## Solution Implemented

### 1. ✅ Added Explicit `orderType` Field to Order Model
**File**: `lib/models/Order.ts`

```typescript
orderType: 'rental' | 'sales' | 'mixed'
```

- **rental**: Order contains only rental items
- **sales**: Order contains only sales items  
- **mixed**: Order contains both rental and sales items

Added MongoDB index on `orderType` for fast filtering by order category.

### 2. ✅ Updated Order Creation Logic
**File**: `app/api/orders/route.ts`

Now automatically determines `orderType` when creating orders:
```typescript
const hasRentalItems = processedItems.some(item => item.mode === 'rent');
const hasSalesItems = processedItems.some(item => item.mode !== 'rent');
const orderType = hasRentalItems && hasSalesItems 
  ? 'mixed' 
  : hasRentalItems ? 'rental' : 'sales';
```

### 3. ✅ Fixed Analytics Calculations
**File**: `app/api/admin/analytics/route.ts`

Enhanced to:
- Use `orderType` as primary categorization indicator
- Fallback to item-level `mode` checking for accuracy
- Handle mixed orders correctly (count in both rental AND sales metrics)
- Skip custom order payments (track separately)
- Revenue calculated per-item, not per-order

### 4. ✅ Created Migration Script
**File**: `migrate-order-types.js`

Analyzes all existing orders and assigns correct `orderType` based on their items.

## Implementation Steps

### Step 1: Deploy Code Changes
All changes are backward compatible - existing orders continue to work without `orderType` (defaults to 'sales').

### Step 2: Run Migration
```bash
npx ts-node migrate-order-types.js
```

This will:
- Scan all existing orders
- Analyze their items to determine correct type
- Update each order with appropriate `orderType`
- Show progress with order numbers and counts

### Step 3: Verify Dashboard
Log in to admin dashboard - sales and rental metrics should now separate correctly:
- **Sales Revenue**: Orders with `orderType: 'sales'`
- **Rental Revenue**: Orders with `orderType: 'rental'`
- **Mixed Orders**: Counted in both sales and rental counts

## Technical Details

### Order Type Determination Logic
```
IF order has ONLY rental items     → orderType = 'rental'
IF order has ONLY sales items      → orderType = 'sales'
IF order has BOTH types            → orderType = 'mixed'
```

### Analytics Metrics Accuracy
- Revenue is calculated at item level (not order level)
- Each item's revenue goes to correct category based on its `mode`
- Mixed orders contribute to both sales AND rental totals
- Daily metrics track sales and rental separately

### Mixed Orders Example
Customer buys 2 costumes (sales) and rents 1 costume (rental):
- Order `orderType` = 'mixed'
- Sales revenue = ₦20,000 (2 × ₦10,000)
- Rental revenue = ₦5,000 (1 × ₦10,000)
- Both metrics updated
- Caution fee (₦2,500) tracked separately

## Data Integrity
✅ No data loss - migration reads actual item data
✅ Backward compatible - old orders still work
✅ Safe - tracks errors per order, doesn't skip on failure
✅ Reversible - orderType can be recalculated anytime

## Files Modified
1. `lib/models/Order.ts` - Added orderType field
2. `app/api/orders/route.ts` - Set orderType on creation
3. `app/api/admin/analytics/route.ts` - Fixed calculation logic
4. `migrate-order-types.js` - NEW: Migration script

## Testing
After migration:
1. Check dashboard - Sales and Rental metrics should differ
2. Create a new sales order - verify it goes to "Sales" 
3. Create a new rental order - verify it goes to "Rental"
4. Create mixed order - verify both metrics update
5. Check daily metrics chart - should show proper distribution

## Performance Notes
- Added index on `orderType` for fast filtering
- Analytics queries still scan all orders but now filter correctly
- No N+1 query issues
- Migration runs in single pass (O(n) complexity)

## Future Enhancements
- [ ] Admin UI to view orders by type
- [ ] Filter orders by type in admin panel
- [ ] Separate reports for rentals vs sales
- [ ] Type-specific order status workflows
- [ ] Marketing metrics: rental vs sales growth trend
