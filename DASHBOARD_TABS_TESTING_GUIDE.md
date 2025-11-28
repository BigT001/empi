# Dashboard Tabs - Quick Start Testing Guide 🧪

## 🚀 Quick Start

### 1. Start the Dev Server
```bash
npm run dev
```

### 2. Navigate to Dashboard
- Go to `http://localhost:3000/admin/dashboard`
- Make sure you're logged in as admin
- You should see 5 tabs: Overview | Users | Orders | Products | Pending

---

## ✅ Testing Checklist

### Users Tab Test Cases

**Test 1: Tab Loads & Shows Data**
- [ ] Click "Users" tab
- [ ] Page loads without errors
- [ ] Shows "Registered Users" header with count
- [ ] Table displays all users from database
- [ ] Each user shows: Name, Email, Phone, Orders, Member Since, Last Active

**Test 2: Search Functionality**
- [ ] Click search bar
- [ ] Type a user's name → Results filter correctly
- [ ] Type an email → Results filter correctly
- [ ] Type a phone number → Results filter correctly
- [ ] Clear search → All users show again

**Test 3: Sorting**
- [ ] Click "Sort by" dropdown
- [ ] Select "Name" → List sorts alphabetically by name
- [ ] Select "Email" → List sorts alphabetically by email
- [ ] Select "Joined Date" → List sorts by date
- [ ] Select "Orders Count" → List sorts by order count
- [ ] Click sort direction button → Toggles ascending/descending

**Test 4: Expandable Rows**
- [ ] Click "View" button on any user row
- [ ] Row expands to show:
  - [ ] Email, Phone, Member Duration (in days)
  - [ ] Recent Orders section with up to 5 orders
  - [ ] Each order shows: Order #, Date, Total, Status
- [ ] Click "Hide" button → Row collapses

**Test 5: Actions**
- [ ] Hover over action buttons (View, Reset, Delete)
- [ ] Click "Reset" → Confirmation modal appears
- [ ] Confirm reset → Modal shows new password
- [ ] Click "Delete" → Confirmation modal appears
- [ ] Confirm delete → User is removed from list

---

### Orders Tab Test Cases

**Test 1: Tab Loads & Shows Data**
- [ ] Click "Orders" tab
- [ ] Page loads without errors
- [ ] Shows "Recent Orders" header with total count
- [ ] Table displays orders with: Order #, Customer, Items, Total, Date, Status

**Test 2: Status Filter Tabs**
- [ ] View "All Orders" tab (shows all with count)
- [ ] Click "Confirmed" → Shows only confirmed orders
- [ ] Click "Pending" → Shows only pending orders
- [ ] Click "Cancelled" → Shows only cancelled orders
- [ ] Click "All Orders" → Shows all again
- [ ] Each tab shows correct count in parentheses

**Test 3: Search Functionality**
- [ ] Click search bar
- [ ] Type order number → Filters matching orders
- [ ] Type email → Filters orders for that customer
- [ ] Type customer name → Filters matching orders
- [ ] Search shows result count at bottom

**Test 4: Status Color Coding**
- [ ] Confirmed orders show 🟢 green status badge
- [ ] Pending orders show 🟡 yellow status badge
- [ ] Cancelled orders show 🔴 red status badge
- [ ] Status text is capitalized (e.g., "Confirmed")

**Test 5: Data Accuracy**
- [ ] Click any order to verify data
- [ ] Order number matches database
- [ ] Customer name is correct
- [ ] Item count matches (from items array)
- [ ] Total amount is correct (formatted as ₦X,XXX)
- [ ] Date is properly formatted

---

### Products Tab Test Cases

**Test 1: Tab Loads & Shows Data**
- [ ] Click "Products" tab
- [ ] Page loads without errors
- [ ] Shows "Products Catalog" header with total count
- [ ] Displays product cards in grid layout
- [ ] Each card shows: Image, Name, Category, Sell Price, Rent Price

**Test 2: Category Filter Tabs**
- [ ] View "All Products" tab (shows all with count)
- [ ] See list of category tabs
- [ ] Click any category → Shows only products in that category
- [ ] Each tab shows correct count
- [ ] Click "All Products" → Shows all again

**Test 3: Search Functionality**
- [ ] Click search bar
- [ ] Type product name → Filters matching products
- [ ] Type category name → Filters products in that category
- [ ] Search shows result count at bottom

**Test 4: Product Display**
- [ ] Product image displays correctly (or fallback icon)
- [ ] Product name shows (max 2 lines, truncated if needed)
- [ ] Category badge is visible and colored
- [ ] Product badge shows if available
- [ ] Sell price displays in GREEN
- [ ] Rent price displays in BLUE (if available, else hidden)
- [ ] Prices formatted as ₦X,XXX

**Test 5: Responsive Grid**
- [ ] On mobile: 1 product per row
- [ ] On tablet: 2 products per row
- [ ] On desktop: 3 products per row
- [ ] On ultra-wide: 4 products per row
- [ ] Cards have hover effects

---

### Pending Tab Test Cases

**Test 1: Tab Loads & Shows Data**
- [ ] Click "Pending" tab
- [ ] Page loads without errors
- [ ] Shows "Pending / Unpaid Orders" header
- [ ] Summary stats show: Total Pending Amount & Order Count
- [ ] Displays pending order cards

**Test 2: Summary Stats**
- [ ] Total Pending Amount is calculated correctly
- [ ] Amount formatted as ₦X,XXX
- [ ] Order count matches number of pending orders
- [ ] Stats update if orders are added

**Test 3: Urgency Color System**
- [ ] Orders 7+ days old show 🔴 RED badge
- [ ] Orders 3-7 days old show 🟠 ORANGE badge
- [ ] Orders < 3 days old show 🟡 YELLOW badge
- [ ] Text shows: "Today", "1 day old", or "X days old"

**Test 4: Sort Options**
- [ ] Click "Sort by" dropdown
- [ ] Select "Newest First" → Sorts by newest date first
- [ ] Select "Oldest First" → Sorts by oldest date first
- [ ] Select "Highest Amount" → Sorts by amount descending

**Test 5: Search Functionality**
- [ ] Click search bar
- [ ] Type order number → Filters matching orders
- [ ] Type email → Filters orders for that customer
- [ ] Type customer name → Filters matching orders
- [ ] Search shows result count at bottom

**Test 6: Order Card Details**
- [ ] Order number displays correctly (monospace font)
- [ ] Urgency badge shows age
- [ ] Customer name and email visible
- [ ] Order date formatted correctly
- [ ] Total amount large and bold
- [ ] Status badge shows (yellow for pending/unpaid)
- [ ] Item count visible

---

## 🐛 Error Testing

### Test Error States:

**Disable Network & Reload:**
- [ ] Users tab shows error message
- [ ] Orders tab shows error message
- [ ] Products tab shows error message
- [ ] Pending tab shows error message
- [ ] Each error shows "Try again" button
- [ ] Clicking "Try again" retries the fetch

**Slow Network:**
- [ ] Loading spinner shows while fetching
- [ ] Spinner is animated (rotating)
- [ ] Loading message appears below spinner
- [ ] Spinner persists until data loads

---

## 📱 Mobile Testing

Test each tab on mobile device or browser responsive mode (< 768px):

- [ ] Users: Table scrolls horizontally
- [ ] Orders: Table scrolls horizontally
- [ ] Products: Grid shows 1 column
- [ ] Pending: Cards stack vertically
- [ ] Search bar is accessible
- [ ] Filter tabs scroll horizontally
- [ ] All buttons are tap-friendly (large enough)
- [ ] Text is readable (no overflow)

---

## 🎨 Visual Testing

### Colors & Styling:

**Users Tab (Purple)**
- [ ] Header is purple gradient
- [ ] Active filter tab is purple
- [ ] Icons are purple

**Orders Tab (Orange)**
- [ ] Header is orange gradient
- [ ] Active filter tab is orange
- [ ] Icons are orange

**Products Tab (Green)**
- [ ] Header is green gradient
- [ ] Active filter tab is green
- [ ] Icons are green

**Pending Tab (Red)**
- [ ] Header is red gradient
- [ ] Active filter tab is red
- [ ] Icons are red

### Consistent Elements:
- [ ] All tabs have gradient headers
- [ ] All tabs have search bars in headers
- [ ] All tabs have proper spacing/padding
- [ ] All icons are from Lucide React
- [ ] All text is properly formatted
- [ ] All borders and shadows match
- [ ] Hover effects work smoothly

---

## 🔧 Performance Testing

**Measure Load Time:**
- [ ] Open DevTools Network tab
- [ ] Switch to Users tab
- [ ] Note how long it takes to load
- [ ] Repeat for other tabs
- [ ] Load times should be < 2 seconds

**Monitor Bundle Size:**
- [ ] Each panel is lazy-loaded
- [ ] Switching tabs shouldn't reload
- [ ] No console errors or warnings

---

## 📊 Data Accuracy Testing

### Users Tab:
- [ ] User count matches database `buyers` collection count
- [ ] Order count per user is accurate
- [ ] Last login is correct (or "Never" if not logged in)

### Orders Tab:
- [ ] Order count matches database `orders` collection
- [ ] Status filtering shows correct orders
- [ ] Item count matches order items array length
- [ ] Totals are calculated correctly

### Products Tab:
- [ ] Product count matches database `products` collection
- [ ] Category filters work correctly
- [ ] Images load from correct URLs
- [ ] Prices are displayed correctly

### Pending Tab:
- [ ] Shows only orders with status 'pending', 'unpaid', or 'processing'
- [ ] Total pending amount is sum of all pending totals
- [ ] Age calculations are correct

---

## ✨ Polish & UX Testing

- [ ] No typos in headers, labels, or messages
- [ ] All buttons are clickable and respond
- [ ] All inputs (search, dropdowns) work smoothly
- [ ] Hover states are visible on all interactive elements
- [ ] Loading spinners are smooth
- [ ] Animations are smooth (no stuttering)
- [ ] Empty states have friendly messages with icons
- [ ] Error messages are clear and helpful
- [ ] Dates are formatted consistently
- [ ] Currency is formatted consistently (₦ format)

---

## 🎯 Final Checklist

Before considering complete:

- [ ] All 4 tabs load without errors
- [ ] Search works on all tabs
- [ ] Filters/Sort work on all tabs
- [ ] Data is accurate and real
- [ ] Mobile responsive
- [ ] Error states display properly
- [ ] Loading states display properly
- [ ] Empty states display properly
- [ ] UI is polished and professional
- [ ] No console errors or warnings
- [ ] Performance is good (< 2s load)
- [ ] All features tested

---

## 🚀 Deployment Checklist

Once all tests pass:

- [ ] Commit changes: `git add -A && git commit -m "Polish all dashboard tabs with enhanced UI and features"`
- [ ] Push to main: `git push origin main`
- [ ] Deploy to Vercel (auto-deploy on push)
- [ ] Test on production URL
- [ ] Monitor Vercel logs for any errors
- [ ] Verify all tabs work in production

---

## 📞 Troubleshooting

| Issue | Solution |
|-------|----------|
| Tabs not loading | Check network tab, verify API endpoints exist |
| Data not showing | Check MongoDB connection, verify collections exist |
| Errors in console | Check browser console for specific error messages |
| Images not loading | Check product imageUrl fields in database |
| Search not working | Ensure filter logic is correct in component |
| Sort not working | Check sort options and comparators |
| Mobile layout broken | Verify Tailwind responsive classes are correct |

---

## 📝 Notes

- All components use `useMemo` to prevent unnecessary re-renders
- All data fetches are cleaned up with mounted flag
- Error handling includes user-friendly messages
- Loading states provide good UX
- All TypeScript types are properly defined
- Icons from Lucide React for consistency

---

**Estimated Testing Time: 30-45 minutes per full test cycle**

Happy testing! 🎉
