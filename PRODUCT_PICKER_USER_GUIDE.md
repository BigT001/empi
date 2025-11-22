# Product Picker Feature - User Guide

## Overview
The **Product Picker** is a quick way to add products from your site inventory directly to manual invoices without typing product details manually.

---

## 🎯 Quick Start

### Step 1: Open Manual Invoices Tab
1. Go to Admin → Invoice Management
2. Click the **"Manual Invoices"** tab (blue)

### Step 2: Fill Customer Info
1. Enter customer name
2. Enter customer email
3. (Optional) Enter customer phone

### Step 3: Use Product Picker
1. Scroll down to the **"Invoice Items"** section
2. Click **"Add from Products"** button (blue dashed button with package icon)
3. Product picker modal opens

### Step 4: Select Products
1. **View Products** - Browse your site's inventory
2. **Enter Quantity** - For each product, enter how many units
3. **Click Add** - Product added to invoice automatically
4. **Repeat** - Add multiple products as needed

### Step 5: Review & Save
1. Items appear in the items list
2. Edit quantities/prices if needed
3. Click **"Save Invoice"** to save to database

---

## 🔍 Product Picker Details

### What You See

```
┌─────────────────────────────────────────┐
│ Add Products from Inventory             │
├─────────────────────────────────────────┤
│                                         │
│ ┌─────────────┐    ┌─────────────┐   │
│ │  Product    │    │  Product    │   │
│ │  Image      │    │  Image      │   │
│ │             │    │             │   │
│ │ Product 1   │    │ Product 2   │   │
│ │ ₦5,000      │    │ ₦10,000     │   │
│ │ [Qty] [Add] │    │ [Qty] [Add] │   │
│ └─────────────┘    └─────────────┘   │
│                                         │
│                    [Close]              │
└─────────────────────────────────────────┘
```

### Each Product Card Shows
- **Product Image** - Visual reference
- **Product Name** - Item name
- **Price** - Sell price from inventory
- **Quantity Field** - How many to add (default: 1)
- **Add Button** - Click to add to invoice

---

## 💡 Tips & Tricks

### Quick Adding
1. Products already have quantity set to 1
2. Just click "Add" to add 1 unit
3. Or change quantity before clicking Add

### Editing After Adding
```
After adding a product from picker:
- You can edit quantity in the invoice items
- You can edit price if needed
- You can delete and re-add
```

### Mixing Methods
```
You can use BOTH methods:
1. "Add from Products" - for site inventory
2. "Add Item" - for custom/one-off items

Example invoice:
- Product 1 (from picker)
- Product 2 (from picker)
- Custom Service (manual entry)
- Custom Discount (manual entry with negative price)
```

---

## 🎨 Visual Guide

### Step-by-Step Flow

**1. Click "Add from Products" Button**
```
┌─────────────────────────────┐
│ Items Section              │
├─────────────────────────────┤
│ [Add Item]                 │
│ [Add from Products] ← HERE  │
└─────────────────────────────┘
```

**2. Product Picker Opens**
```
Modal appears with:
- List of all your products
- Product images
- Product names
- Product prices
- Quantity inputs
```

**3. Select & Add**
```
For each product:
[Product Image]
Product Name
₦Price
Qty: [1]
[Add] ← Click to add
```

**4. Items Added to Invoice**
```
Product appears in invoice items:
Product Name    Qty: 2    ₦Price    Total: ₦Amount
```

---

## 🔑 Key Features

✅ **Auto-Population**
- Product name fills automatically
- Price fills from inventory
- No manual typing needed

✅ **Flexible Quantities**
- Set quantity before adding
- Edit quantity after adding
- Add same product multiple times

✅ **Professional Images**
- Product images display in modal
- Shows what customers see
- Better product identification

✅ **Fast & Easy**
- One-click add per product
- No page reloads
- Instant feedback

✅ **Compatible**
- Works alongside manual items
- Can edit after adding
- Mix and match methods

---

## ⚙️ How It Works

### Behind the Scenes
1. When you click "Add from Products"
2. Modal fetches all products from your inventory
3. Products display in a grid
4. You select quantity
5. Click Add
6. Product data automatically added to invoice
7. Price and name copied from inventory
8. You can modify after adding if needed

### Data Copied to Invoice
- Product ID (for reference)
- Product Name
- Product Price
- Your Quantity
- Total (calculated automatically)

---

## 🚫 Common Questions

**Q: Can I modify products after adding?**
A: Yes! You can edit quantity and price in the invoice items after adding.

**Q: What if I add the same product twice?**
A: Each addition is a separate line item. You can consolidate quantities if needed.

**Q: Are prices always from inventory?**
A: Yes, prices are pulled from your product database. You can override them after adding.

**Q: What if product is out of stock?**
A: Product picker shows all products regardless of stock. Use your judgment on quantities.

**Q: Can I add products with different currencies?**
A: The invoice uses one currency for all items. Set currency before or after adding products.

---

## 📊 Example: Using Product Picker

### Scenario
Create an invoice for Fashion Store Customer with multiple items

**Step 1: Enter Customer Info**
```
Name: Adanna Williams
Email: adanna@email.com
Phone: +234 800 123 4567
```

**Step 2: Click "Add from Products"**
- Modal opens showing products

**Step 3: Add Products**
```
1. Select "Ankara Dress" (₦8,500)
   Qty: 2 → Click Add
   
2. Select "Silk Scarf" (₦3,200)
   Qty: 3 → Click Add
   
3. Select "Beaded Necklace" (₦5,000)
   Qty: 1 → Click Add
```

**Step 4: Review Invoice**
```
Ankara Dress        2 × ₦8,500 = ₦17,000
Silk Scarf          3 × ₦3,200 = ₦9,600
Beaded Necklace     1 × ₦5,000 = ₦5,000
                    Subtotal   = ₦31,600
                    Tax (7.5%)  = ₦2,370
                    TOTAL      = ₦33,970
```

**Step 5: Save Invoice**
- Click "Save Invoice"
- Invoice saved to database
- Confirmation message appears

---

## 🔄 Workflow Comparison

### Without Product Picker
```
1. Manually type product name
2. Manually look up product price
3. Enter quantity
4. Repeat for each product
5. Takes more time
6. More prone to typos
```

### With Product Picker
```
1. Click "Add from Products"
2. Browse products visually
3. Select quantity
4. Click Add
5. Repeat for each product
6. Much faster
7. No typos possible
```

---

## 🎯 Best Practices

✅ **DO:**
- Use product picker for site inventory
- Use manual items for discounts/adjustments
- Review items before saving
- Update invoice status after sending

❌ **DON'T:**
- Add same product twice when one item would suffice
- Forget to set quantity before adding
- Save without reviewing totals
- Use for products not in inventory

---

## 🛠️ Troubleshooting

### Products Not Showing
**Issue:** Product picker opens but no products display
**Solution:** 
- Check internet connection
- Verify products exist in database
- Try refreshing page
- Contact admin if persists

### Add Button Not Working
**Issue:** Click "Add" but nothing happens
**Solution:**
- Ensure quantity is set to 1 or higher
- Try again after a moment
- Check browser console for errors
- Refresh page if needed

### Wrong Price Appears
**Issue:** Product shows different price than expected
**Solution:**
- Prices pulled from current inventory
- You can edit price after adding
- Check if product price changed in admin

### Can't Find Product
**Issue:** Expected product not in modal
**Solution:**
- Product may not be live in inventory
- Check admin products section
- Verify product is active
- Add manually if needed

---

## 📞 Need Help?

**For questions about:**
- Feature usage → See this guide
- Product picker issues → Contact admin
- Pricing questions → Check inventory
- Invoice saving → Verify database connection

---

**Pro Tip:** Use keyboard Tab key to quickly navigate quantity fields when adding multiple products!

---

**Last Updated:** November 22, 2025
**Version:** 1.0 - Product Picker Guide
