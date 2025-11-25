# Delivery Modal - Complete Testing Guide

## ✅ All Features Now Restored

Your delivery modal now includes all features from the original design:

| Feature | Status | Location |
|---------|--------|----------|
| State Selection (36 states) | ✅ | Left column |
| Vehicle Type (Bike/Car/Van) | ✅ | Left column |
| **Delivery Options (Rush/Weekend)** | ✅ | Left column |
| Location Method (GPS/Manual) | ✅ | Left column |
| Google Maps Display | ✅ | Right column |
| **Fee Breakdown** | ✅ | Right column quote box |
| **Warnings Section** | ✅ | Bottom of form |
| **Recommendations/Tips** | ✅ | Bottom of form |
| Real-time Quote Update | ✅ | All sections |
| Modifiers Display | ✅ | Fee breakdown |

---

## Testing Steps

### Step 1: Navigate to Cart Page
```
1. Start server: npm run dev
2. Go to: http://localhost:3000/cart
3. Look for "Real-Time Delivery" section
```

### Step 2: Click to Open Modal
```
1. Click "Real-Time Delivery" button
2. Modal should open with:
   ✓ Header: "Real-Time Delivery"
   ✓ Left column: Form fields
   ✓ Right column: Loading map
```

### Step 3: Test State Selection
```
1. Check state dropdown has 36 states
2. Lagos should be pre-selected
3. Select different state:
   - Should show capital city
   - Quote should recalculate
   - Map should update
   - Rush option appears for Lagos/Ogun/Oyo
```

### Step 4: Test Vehicle Selection
```
1. Click different vehicle buttons:
   - 🏍 Bike: Lowest cost
   - 🚗 Car: Medium cost
   - 🚐 Van: Highest cost
2. Quote should update instantly
3. Fee breakdown should show vehicle fee
4. Recommendations should suggest alternatives
```

### Step 5: Test Delivery Options ✅ NEW
```
1. Look for "Delivery Options" section
2. Check "Rush Delivery":
   - Only available for Lagos/Ogun/Oyo
   - Should add 50% surcharge
   - Fee breakdown should show "Rush Delivery +50%"
   - Total fee increases

3. Check "Weekend Delivery":
   - Available for all states
   - Should add 30% surcharge
   - Fee breakdown updates
   - Can combine with rush delivery
```

### Step 6: Test Fee Breakdown Display ✅ NEW
```
1. Check quote box shows:
   ✓ Distance (X.X km)
   ✓ Estimated Time (X mins)
   ✓ Fee Breakdown section with:
     - Zone Base Fee (if applicable)
     - Vehicle Fee
     - Distance Fee
     - Rush Delivery (+50% if selected)
     - Weekend Delivery (+30% if selected)
   ✓ Total Delivery Fee prominently shown

2. When you change options:
   - Breakdown should update instantly
   - All fees should recalculate
   - Total should be correct
```

### Step 7: Test Warnings Section ✅ NEW
```
1. Scroll down below the quote
2. Look for yellow "Important Information" box
3. Should display:
   ✓ Warning icon (⚠️)
   ✓ Clear warning text
   ✓ Multiple warnings if applicable
   
Example warnings:
- "Estimated delivery time may increase during peak hours"
- "Rush delivery not available after 2 PM on weekends"
- "Area is marked as high-demand zone"
```

### Step 8: Test Recommendations Section ✅ NEW
```
1. Below warnings, look for green "Tips to Save Money" section
2. Should show suggestions like:
   ✓ "Consider bike delivery for light packages - save ₦3,000"
   ✓ "Choose standard delivery instead of rush - save ₦8,250"
   ✓ "Current vehicle might be overkill for package size"

3. Tips should update when:
   - Vehicle changes
   - Options change
   - State changes
   - These change cost calculations
```

### Step 9: Test Location Methods
```
1. GPS Option (default):
   - Should request location permission
   - Should show "Using your location"
   - Map should center on your location
   - Blue marker on map

2. Manual Address Option:
   - Click radio button
   - Textarea appears
   - Type test address
   - Should trigger calculation
```

### Step 10: Test Google Map Display
```
1. Right side should show map
2. Green marker: Pickup location (state capital)
3. Blue marker: Your delivery location (GPS or estimated)
4. Map should center properly
5. Zoom level should be appropriate (level 13)
6. Loading state shows spinner while loading
```

### Step 11: Test Real-Time Updates
```
Try different combinations:

Scenario 1: Lagos → Bike + Rush Delivery
- Quote should calculate
- Show bike price + rush surcharge
- Display all fees

Scenario 2: Change to Oyo → Car
- Quote updates instantly
- Oyo is checked for rush availability
- Car fees apply

Scenario 3: Enable Weekend Delivery
- Fee increases by 30%
- Breakdown shows modifier
- Can be combined with rush

Scenario 4: Change to manual address
- Map might update
- New calculation performed
- Quote updates
```

### Step 12: Test Action Buttons
```
1. "Cancel" button:
   - Should close modal
   - Return to cart

2. "Confirm Delivery" button:
   - Should be disabled until:
     ✓ State selected
     ✓ Quote calculated
     ✓ Not loading
   - When enabled and clicked:
     - Should submit selection
     - Should include:
       * Selected state
       * Vehicle type
       * Delivery address
       * Complete quote
       * Modifiers (rush/weekend)
```

---

## Expected Results

### ✅ Correct Behavior

**Fee Calculation Example (Lagos → Ikeja):**
```
Base Vehicle Fee:      ₦2,500  (Car)
Distance Fee (15 km):  ₦3,000  (₦200/km)
Zone Base Fee:         ₦5,000  (Lagos)
Subtotal:              ₦10,500

With Rush Delivery (+50%):
  ₦10,500 × 1.50 =     ₦15,750

With Weekend Delivery (+30%):
  ₦15,750 × 1.30 =     ₦20,475

Total:                 ₦20,475
```

**Fee Breakdown Display:**
```
Zone Base Fee................ ₦5,000
Car Fee...................... ₦2,500
Distance Fee (15 km)......... ₦3,000
Rush Delivery (+50%)......... ₦8,250
Weekend Delivery (+30%)...... ₦4,950
─────────────────────────────────
Total Delivery Fee........ ₦23,700
```

---

## Common Issues & Fixes

### Issue 1: Map Not Showing
**Solution:**
- Add Google Maps API key to `.env.local`
- Restart dev server: `npm run dev`
- Hard refresh browser: `Ctrl+Shift+R`

### Issue 2: States Not Loading
**Solution:**
- Check API: http://localhost:3000/api/delivery/states
- Should return 36 states
- Check console for errors

### Issue 3: Fee Not Calculating
**Solution:**
- Ensure state is selected
- Check location is set (GPS or manual)
- Verify API endpoint works
- Check console for errors

### Issue 4: Delivery Options Not Showing
**Solution:**
- Ensure selected state is Lagos, Ogun, or Oyo (rush)
- Weekend should always show
- Refresh if checkboxes hidden

### Issue 5: Fee Breakdown Not Showing
**Solution:**
- Wait for quote to calculate (loading indicator)
- Ensure quote data includes breakdown
- Check API response format

---

## Browser Console Checks

Open DevTools (F12) and check:

```javascript
// Check if component renders
document.querySelector('[class*="modal"]')  // Should find modal

// Check API responses
// Network tab → delivery/calculate → Response
// Should show complete quote with breakdown

// Check for errors
// Console tab should be clean (except warnings)
```

---

## Performance Checklist

- [ ] Modal opens in < 2 seconds
- [ ] States dropdown loads instantly
- [ ] Quote calculates in < 500ms
- [ ] Map displays in < 2 seconds
- [ ] Option changes are instant (< 100ms)
- [ ] No lag when scrolling
- [ ] Buttons respond immediately
- [ ] No console errors

---

## Responsive Testing

### Mobile (< 600px)
```
☐ Modal takes full screen width
☐ Form stacks vertically
☐ Map is smaller but visible
☐ Quote box is readable
☐ Buttons are large enough to tap
☐ Text is readable (16px+)
```

### Tablet (600px - 1000px)
```
☐ 2-column layout works
☐ Map and form side-by-side
☐ All content visible
☐ Scrolling smooth
```

### Desktop (> 1000px)
```
☐ Full layout displays perfectly
☐ Map and form have equal space
☐ All sections visible
☐ Quote box positioned correctly
```

---

## Feature-Specific Tests

### ✅ Rush Delivery
```
[ ] Shows only for Lagos, Ogun, Oyo
[ ] Checkbox appears/disappears appropriately
[ ] Adds 50% to base fee
[ ] Shows in fee breakdown
[ ] Can combine with weekend delivery
[ ] Disables for non-qualifying states
```

### ✅ Weekend Delivery
```
[ ] Shows for all states
[ ] Always available checkbox
[ ] Adds 30% surcharge
[ ] Appears in modifiers
[ ] Can combine with rush delivery
[ ] Updates total correctly
```

### ✅ Fee Breakdown
```
[ ] Zone base fee displays
[ ] Vehicle fee displays
[ ] Distance fee displays
[ ] Each modifier listed
[ ] All values correct
[ ] Total = sum of parts
[ ] Updates on option change
```

### ✅ Warnings
```
[ ] Yellow box displays
[ ] Warning icon shows
[ ] Text is readable
[ ] Multiple warnings show
[ ] Updates based on state/options
[ ] Dismissible (if implemented)
```

### ✅ Recommendations
```
[ ] Green box displays
[ ] Money-saving suggestions show
[ ] Tips are relevant
[ ] Include savings amount
[ ] Updates based on selection
[ ] Help users optimize choice
```

---

## Acceptance Criteria

**PASS** if:
- ✅ All 6 delivery option checkboxes present
- ✅ Fee breakdown visible with all components
- ✅ Warnings display for applicable scenarios
- ✅ Recommendations appear with cost savings
- ✅ All calculations correct
- ✅ Modal responsive on all devices
- ✅ No console errors
- ✅ Performance acceptable

**FAIL** if:
- ❌ Delivery options missing
- ❌ Fee breakdown incomplete
- ❌ Calculations incorrect
- ❌ Console errors present
- ❌ Modal not responsive
- ❌ Performance sluggish

---

## Test Data

### Test States
- Lagos (capital: Ikeja)
- Ogun (capital: Abeokuta)
- Oyo (capital: Ibadan)
- Rivers (capital: Port Harcourt)
- Enugu (capital: Enugu)

### Test Combinations
1. Lagos → Bike → Rush only
2. Ogun → Car → Rush + Weekend
3. Oyo → Van → Weekend only
4. Rivers → Any → No Rush (should be grayed)
5. Enugu → Any → No Rush (should be grayed)

---

## Reporting Issues

If you find problems, note:
1. **What you did:** Step-by-step reproduction
2. **What happened:** Actual behavior
3. **What should happen:** Expected behavior
4. **Browser:** Chrome, Firefox, Safari, etc.
5. **Device:** Desktop, tablet, mobile
6. **Screenshot:** If visual issue
7. **Console errors:** Any error messages

---

## Sign-Off

Once all tests pass, the delivery modal is **PRODUCTION READY** ✅

**Last Updated:** November 24, 2025
**Status:** ✅ Ready for Testing
