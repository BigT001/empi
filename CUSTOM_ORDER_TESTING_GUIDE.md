# Testing the Custom Order → Profile Auto-Update Feature

## Quick Test Steps

### Prerequisites
- ✅ User logged in (benerd maxwell)
- ✅ Browser DevTools console open (F12)
- ✅ Dev server running

### Test Flow

1. **Navigate to Custom Order Form**
   - URL: `http://localhost:3000/category-custom`
   - You should see the form auto-filled with:
     - Full Name: benerd maxwell ✓
     - Email: benerd01@gmail.com ✓
     - Phone: 8108478477 ✓
     - City: Lagos, Abuja ✓
   - Empty fields should be editable: Address, State, Postal Code

2. **Edit and Fill Missing Fields**
   - Click on "Address" field and enter: "123 Main Street"
   - Click on "State" field and enter: "Lagos"
   - Click on "Postal Code" field and enter: "102101"
   - ✅ All fields should be editable with no restrictions

3. **Fill Required Order Details**
   - Step 2 (Design): Upload at least one design image
   - Step 3 (Description): Fill in costume description
   - Quantity: Set to any number

4. **Submit the Order**
   - Click "Get My Quote" button
   - Watch the console for success messages

5. **Check Console for Profile Update**

   Look for these messages (in order):
   ```
   [CustomCostumes] 📝 Form submission started
   [CustomCostumes] User logged in? true
   [CustomCostumes] Buyer ID: [ID shown]
   [CustomCostumes] 📤 Submitting custom order...
   [CustomCostumes] ✅ Order submitted successfully!
   [CustomCostumes] 👤 Updating buyer profile with form data...
   [CustomCostumes] ✅ Buyer profile updated successfully!
   [CustomCostumes] Updated buyer: {...}
   ```

6. **Verify Profile Was Updated**

   Option A - Browser Console:
   ```javascript
   // Paste this in DevTools console after successful submission
   fetch('/api/buyers/[buyerId]')
     .then(r => r.json())
     .then(d => console.log('Updated Buyer:', d))
   ```
   Replace `[buyerId]` with the actual buyer ID from the logged-in user

   Option B - Check Dashboard:
   - Go to `http://localhost:3000/dashboard`
   - Click on "Profile" tab
   - Verify that Address, State, Postal Code are now populated:
     - Address: "123 Main Street" ✓
     - State: "Lagos" ✓
     - Postal Code: "102101" ✓

## Expected Behavior

### ✅ Success Scenario
- Form auto-fills from profile
- All fields are editable
- User adds missing information (address, state, postal code)
- Order submits successfully
- Console shows "✅ Buyer profile updated successfully!"
- Dashboard profile page shows updated information
- User doesn't need to visit profile page

### ⚠️ Non-Blocking Failure Scenario
- Custom order submits successfully
- Profile update fails (unlikely, but possible)
- Console shows: "⚠️ Failed to update buyer profile, but order was submitted"
- Order still in database ✓
- User can manually update profile later if needed

### ❌ Validation Errors (Normal)
- Empty design image → "Please upload at least one design image..."
- Missing city → "Please fill in the following fields: City"
- Missing description → "Please fill in the following fields: Description"

## Network Activity Check

Open DevTools → Network tab, submit form and look for:

1. **POST request to `/api/custom-orders`**
   - Status: 201 (Created)
   - Body includes all form data, images, buyerId
   - Response includes orderNumber

2. **PATCH request to `/api/buyers/[id]`**
   - Status: 200 (OK)
   - Body: { fullName, phone, address, city, state, postalCode }
   - Response: Updated buyer object

## Database Verification

Connect to MongoDB and verify:

```javascript
// Check if buyer was updated
db.buyers.findOne({ email: 'benerd01@gmail.com' })

// Should show:
{
  _id: ObjectId(...),
  email: "benerd01@gmail.com",
  fullName: "benerd maxwell",
  phone: "8108478477",
  address: "123 Main Street",        // ← Updated
  city: "Lagos",
  state: "Lagos",                     // ← Updated
  postalCode: "102101",               // ← Updated
  isAdmin: false,
  ...
}
```

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Form fields still disabled | Clear browser cache (Ctrl+Shift+Delete) and reload |
| Profile not updating | Check browser console for error messages |
| "Buyer not found" error | Verify buyerId is correct in form data |
| Network shows 404 on PATCH | Verify buyerId in URL matches actual ID |

## Success Indicators ✅

- [ ] Form fields all editable (no opacity-75, no disabled state)
- [ ] Auto-filled data displays correctly
- [ ] Can edit pre-filled fields
- [ ] Can add empty fields
- [ ] Order submits without errors
- [ ] Console shows success messages for both order AND profile
- [ ] Dashboard shows updated address/state/postal code
- [ ] Takes ~1-2 seconds total (order + profile update)

---

**Ready to test!** 🚀
