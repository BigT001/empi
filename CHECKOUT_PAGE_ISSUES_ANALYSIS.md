# 🔴 CHECKOUT PAGE - HARDCODED CODE & CALCULATION ISSUES FOUND

**Date:** December 12, 2025  
**Issue:** Same figure displayed for both quote checkout and regular checkout  
**Severity:** HIGH - Affects payment accuracy

---

## 🚨 Problems Identified

### PROBLEM 1: Hardcoded SHIPPING_OPTIONS Redeclaration
**Location:** Line 430 in `/app/checkout/page.tsx`

```tsx
// BAD: This creates a DUPLICATE definition with different values
const SHIPPING_OPTIONS: Record<string, { name: string; estimatedDays: string; cost: number }> = {
  empi: { name: "EMPI Delivery", estimatedDays: "1-2 days", cost: 2500 },  // ← Changed from top
  self: { name: "Self Pickup", estimatedDays: "Same day", cost: 0 },
};
```

**Issue:** This redefines `SHIPPING_OPTIONS` with HARDCODED "1-2 days" instead of original "2-5 business days"

**Original (Line 18):**
```tsx
const SHIPPING_OPTIONS = {
  empi: { id: "empi", name: "EMPI Delivery", cost: 2500, estimatedDays: "2-5 business days" },
  self: { id: "self", name: "Self Pickup", cost: 0, estimatedDays: "Ready within 24 hours" },
};
```

---

### PROBLEM 2: Using `total` from Context (Incorrect)
**Location:** Line 951 in `/app/checkout/page.tsx`

```tsx
// WRONG: This uses the context's total which is INCORRECT
<p className="font-bold text-gray-900">₦{total.toLocaleString()}</p>
```

**Issue:** `total` from CartContext is `price × quantity` (no rental days)

**CartContext calculation (Line 227):**
```tsx
const total = items.reduce((sum, item) => {
  return sum + item.price * item.quantity;  // ← Missing rental days!
}, 0);
```

**Should be:** `buySubtotal` (calculated correctly in checkout at line 68)

---

### PROBLEM 3: Calculation Mismatch Between Checkout and CartContext

**CartContext `total` (WRONG for rentals):**
```
total = price × quantity (for ALL items)
```

**Checkout `buySubtotal` (CORRECT):**
```
buySubtotal = price × quantity (for BUY items only)
```

**But sidebar uses context `total` which includes incorrectly calculated rental items!**

---

### PROBLEM 4: Using `subtotalForVAT` Inconsistently

**For display (sidebar):** Uses `total` from context (WRONG)
**For payment:** Uses `subtotalForVAT` (CORRECT)

This causes **different amounts in sidebar vs actual payment**

---

### PROBLEM 5: Quote Mode Shows Same Total as Regular Mode

**Issue:** The sidebar calculations don't differentiate properly

When in quote mode:
- Quote has its own pricing: `customOrderQuote.quotedTotal`
- Should NOT show regular cart items or their calculations

But the page may be showing both or mixing them up.

---

## 📊 The Real Problem

When you click "Pay Now" from chat:
1. `customOrderQuote` is set with quote data
2. Sidebar shows quote pricing ✓ (Correct)
3. Main items section shows custom order details ✓ (Correct)

When you go regular checkout:
1. `customOrderQuote` is NOT set
2. Sidebar shows `total` from context (WRONG - missing rental days)
3. But payment uses `subtotalForVAT` (CORRECT - has rental days)
4. **Result: Sidebar shows one amount, payment charges different amount!**

---

## ✅ The Fix

### Step 1: Remove Hardcoded SHIPPING_OPTIONS Redeclaration
**Delete line 430-433** - Use the one at top of file

### Step 2: Fix Sidebar Subtotal for Regular Mode
**Change line 951** from:
```tsx
<p className="font-bold text-gray-900">₦{total.toLocaleString()}</p>
```

To:
```tsx
<p className="font-bold text-gray-900">₦{buySubtotal.toLocaleString()}</p>
```

### Step 3: Update All Sidebar Calculations to Use Correct Variables
```
Subtotal       = buySubtotal (not total)
After Discount = buySubtotalAfterDiscount
Caution Fee    = cautionFee  ✓ (already correct)
VAT            = taxEstimate ✓ (already correct)
Total          = totalAmount ✓ (already correct)
```

---

## 🔍 Detailed Line-by-Line Issues

### Issue A: Line 430-433 Hardcoded Duplicate
```tsx
const SHIPPING_OPTIONS: Record<string, { name: string; estimatedDays: string; cost: number }> = {
  empi: { name: "EMPI Delivery", estimatedDays: "1-2 days", cost: 2500 },  // ← Should be "2-5 business days"
  self: { name: "Self Pickup", estimatedDays: "Same day", cost: 0 },
};
```

**Status:** NEEDS REMOVAL

---

### Issue B: Line 951 Using Wrong Total
```tsx
<p className="font-bold text-gray-900">₦{total.toLocaleString()}</p>
```

**Problem:** `total` = sum of all items without rental days
**Should be:** `buySubtotal` = sum of buy items only (rental days handled separately)

**Current flow:**
- `total` = ₦10,000 (might be missing rental calculation)
- `buySubtotal` = ₦10,000 (correct for buy items)
- Payment uses `subtotalForVAT` which is correct

**Status:** NEEDS FIXING

---

### Issue C: Line 970-974 Bulk Discount Logic
```tsx
{discountPercentage > 0 && (
  <div className="mt-3 pt-3 border-t border-green-200 bg-green-50 p-3 rounded-lg space-y-2">
    <div className="flex justify-between items-center">
      <p className="text-xs font-semibold text-green-700">🎉 Bulk Discount ({discountPercentage}%)</p>
      <p className="font-bold text-green-700">-₦{discountAmount.toLocaleString()}</p>
    </div>
```

**Status:** This is CORRECT ✓ (uses properly calculated `discountAmount`)

---

## 💾 Summary of Changes Needed

| Line | Current | Issue | Fix |
|------|---------|-------|-----|
| 430-433 | `const SHIPPING_OPTIONS = {...}` | Hardcoded duplicate with wrong estimatedDays | DELETE these lines |
| 951 | `₦{total.toLocaleString()}` | Missing rental days calculation | Change to `₦{buySubtotal.toLocaleString()}` |

---

## 🧮 Why This Causes Same Figure

**Quote Mode:**
- Shows `customOrderQuote.quotedTotal` (correct for quote)

**Regular Mode (Cart → Checkout):**
- Sidebar shows `total` (context value, might be wrong)
- Payment charges `totalAmount` (calculated correctly)
- **If `total` ≈ `buySubtotal`, they look the same!**

But actually:
- `total` from context = ₦X (for buy items)
- `customOrderQuote.quotedTotal` = ₦Y (for quote)
- If X ≈ Y, they appear the same but are calculated differently!

---

## 🎯 Root Cause Analysis

**The user reports:** "I get the same figure when I click on Pay Now and when I do normal checkout"

**Why this happens:**

1. **Quote Checkout:**
   - Uses `customOrderQuote.quotedTotal`
   - Example: Admin quotes ₦5,000

2. **Regular Checkout:**
   - Uses `total` from context
   - Example: Add 1 item at ₦5,000 = ₦5,000

3. **Result:** Both show ₦5,000, but calculated differently!

**The Fix:** Use consistent, correct calculations everywhere

---

## ✨ What Will Be Fixed

After applying fixes:

✅ **Quote Checkout:** Shows quote price (unchanged)
✅ **Regular Checkout:** Shows correct buy subtotal with proper rental calculations
✅ **No Hardcoded Values:** All values come from actual data
✅ **Consistent Calculations:** Sidebar and payment use same values
✅ **No Duplicates:** Only one SHIPPING_OPTIONS definition

---

## 🔧 Implementation Plan

**Priority: HIGH**

1. **Remove hardcoded SHIPPING_OPTIONS** (line 430-433)
   - Keep only the one at top (line 18)
   - 3 lines to delete

2. **Fix sidebar subtotal calculation** (line 951)
   - Change `total` to `buySubtotal`
   - 1 line to fix

**Estimated time:** 2 minutes
**Risk level:** Very Low (these are clear corrections)
**Testing:** Compare quote checkout vs regular checkout totals

---

## 📋 Files to Modify

- `/app/checkout/page.tsx` (2 changes)

## 📋 Files NOT to Modify

- `/app/components/CartContext.tsx` (don't touch `total` - it's used elsewhere correctly)
- `/app/components/Header.tsx`
- `/app/components/Footer.tsx`

---

**Status: Issues Identified, Ready for Implementation**

