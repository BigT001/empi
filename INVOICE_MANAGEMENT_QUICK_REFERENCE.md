# Invoice Management System - Quick Reference

## 🚀 Quick Start

### Accessing the Invoice Page
- **URL:** `http://localhost:3000/admin/invoices`
- **Auth:** Admin login required (automatically redirected if not authenticated)
- **Responsive:** Auto-switches to mobile view on screens < 768px width

---

## 📊 Tab 1: Automatic Invoices

### What It Does
Displays all invoices automatically generated from customer orders.

### Key Features

**Statistics Dashboard**
- **Total Revenue** - Sum of all invoice amounts in selected currency
- **Total Orders** - Number of invoices
- **Avg Order Value** - Average amount per invoice

**Invoice Management**
- View detailed invoice modal with:
  - Customer information
  - Invoice metadata (invoice #, order #, date)
  - Items table with product details
  - Order summary with totals
- Print invoices directly to printer or PDF
- Download invoices as HTML files
- Delete individual invoices
- Clear all invoices at once (with confirmation)

### How Invoices Get Here
1. Customer completes purchase at checkout
2. Order data is automatically converted to invoice format
3. Invoice is saved to localStorage via `invoiceStorage.ts`
4. Shows up automatically on this tab

---

## ✍️ Tab 2: Manual Invoices

### What It Does
Allows admin to create custom invoices from scratch.

### Step-by-Step Guide

**Step 1: Enter Customer Information**
```
Customer Name: [Required] - The person/company receiving invoice
Email: [Required] - For sending invoice (validation required)
Phone: [Optional] - Contact number
```

**Step 2: Configure Invoice Details**
```
Invoice Number: [Optional] - Auto-generated if left blank (INV-{timestamp})
Order Number: [Optional] - Link to existing order
Currency: [Select] - NGN / USD / GBP / EUR
Tax Rate: [Optional] - Default 7.5%, adjust as needed
Due Date: [Required] - Auto-set to 30 days from today
```

**Step 3: Add Line Items**
- Click **"Add Item"** button
- Enter for each item:
  - **Product Name** - What's being invoiced
  - **Qty** - Quantity (must be ≥ 1)
  - **Price** - Unit price

- System automatically calculates:
  - Total per item = Qty × Price
  - Subtotal = Sum of all items
  - Tax = Subtotal × Tax Rate
  - **Grand Total** = Subtotal + Tax

**Step 4: Review Invoice**
- Click **"Preview"** to see how invoice will look
- Modal shows professional invoice layout
- Review all information before saving

**Step 5: Save Invoice**
- Click **"Save Invoice"** to store in localStorage
- Success message confirms save
- Form automatically clears for next invoice
- Saved invoice appears on Automatic Invoices tab

### Form Validation
- ✅ Customer name required
- ✅ Email required (must be valid email format)
- ✅ At least one item required
- ✅ All prices must be positive numbers
- ✅ Quantities must be positive integers

---

## 🎯 Common Tasks

### Print an Invoice
```
1. Go to "Automatic Invoices" tab
2. Find the invoice in the list
3. Click "Print" button
4. Browser print dialog opens
5. Select printer or "Print to PDF"
6. Click "Print"
```

### Download an Invoice
```
1. Go to "Automatic Invoices" tab
2. Click "Download" button next to invoice
3. Browser downloads file as "invoice-{invoiceNumber}.html"
4. Open in browser or email to customer
```

### Create Custom Invoice for Client
```
1. Go to "Manual Invoices" tab
2. Fill in customer information
3. Add line items for products/services
4. Preview to check format
5. Click "Save Invoice"
6. Appears on "Automatic Invoices" tab for future management
```

### Delete an Invoice
```
1. Go to "Automatic Invoices" tab
2. Click "Delete" button
3. Confirm deletion
4. Invoice removed from list
```

### Clear All Invoices
```
1. Go to "Automatic Invoices" tab
2. Click "Clear All" button at top
3. Confirm deletion (cannot be undone)
4. All invoices cleared
```

---

## 💾 Data Storage

### Where Data Lives
- **Storage Location:** Browser's `localStorage`
- **Key:** `EMPI_ADMIN_INVOICES`
- **Format:** JSON array of invoice objects
- **Persistence:** Survives browser refresh, persists across sessions

### What Gets Saved
- All automatic invoices from customer orders
- All manually created invoices
- Both stored in same location for unified management

### Data Backup
To backup invoices:
```javascript
// In browser console
console.log(localStorage.getItem('EMPI_ADMIN_INVOICES'))
// Copy output and save to file
```

---

## 🔧 Advanced Features

### Bulk Operations
- **Clear All**: Removes all invoices at once (use with caution!)
- Confirmation dialogs prevent accidental deletion

### Multi-Currency Support
Manual invoices support 4 currencies:
- **NGN** (Nigerian Naira) - ₦
- **USD** (US Dollar) - $
- **GBP** (British Pound) - £
- **EUR** (Euro) - €

Amounts automatically format with correct symbol.

### Customizable Tax Rates
- Default: 7.5%
- Adjustable per invoice
- Applies to subtotal
- Shown in invoice total breakdown

### Invoice Templates
Both automatic and manual invoices use same professional template:
- Company header with EMPI branding
- Customer information section
- Detailed items table
- Order summary with line-by-line totals
- Professional footer

---

## 📱 Mobile Experience

On screens < 768px:
- Desktop invoice management hidden
- Mobile invoice view activated automatically
- Simplified UI optimized for touch
- Same features, mobile-friendly layout

---

## ⚠️ Important Notes

### Data Persistence
- Invoices stored locally, not synced to server
- Each browser/device has separate invoice storage
- Clearing browser cache/localStorage will delete invoices
- Consider regular backups for important invoices

### Before Deleting Invoices
- Ensure you have copies/PDFs if needed
- Delete action is permanent and cannot be undone
- No recovery option available

### PDF Export
- Currently exports as HTML
- Can be printed to PDF from browser
- Future enhancement: Direct PDF export with branding

---

## 🐛 Troubleshooting

### Invoice Not Appearing
- **Check:** Are you on the correct tab (Automatic vs Manual)?
- **Check:** Did the invoice save successfully (confirmation message)?
- **Try:** Refresh page (F5)
- **Try:** Check browser localStorage (`Ctrl+Shift+I` → Application → Storage)

### Print Dialog Not Opening
- **Browser issue:** Pop-ups might be blocked
- **Solution:** Allow pop-ups for this site in browser settings
- **Alternative:** Download and open in new tab

### Download Not Working
- **Check:** Browser download settings
- **Try:** Different browser
- **Note:** File saved with name `invoice-{invoiceNumber}.html`

### Customer Information Not Saving
- **Check:** All required fields filled (name, email)
- **Check:** Valid email format
- **Try:** Remove extra spaces in email

### Tax Calculation Wrong
- **Check:** Tax rate field (default 7.5%)
- **Example:** $100 subtotal + 7.5% tax = $107.50 total
- **Adjust:** Change tax rate before adding items if needed

---

## 📞 Support Features

**Built-in Features:**
- Form validation with error messages
- Confirmation dialogs for destructive actions
- Success messages after saving
- Preview before final save
- Clear error feedback

**For Bugs/Issues:**
- Check browser console (F12 → Console)
- Look for red error messages
- Share console errors with development team

---

## Future Enhancements Planned

- [ ] Direct PDF export (not just print)
- [ ] Email invoices to customers
- [ ] Invoice templates customization
- [ ] Email delivery tracking
- [ ] Invoice search/filter by date
- [ ] Paid/unpaid status tracking
- [ ] Database storage option
- [ ] Invoice numbering sequences
- [ ] Custom branding upload
- [ ] Multi-page invoice support

---

## 🎨 UI Color Guide

**Tab Colors:**
- **Automatic Invoices:** Green/Lime (revenue, orders)
- **Manual Invoices:** Blue (creation, new content)

**Action Buttons:**
- **View:** Blue (inspect details)
- **Print:** Purple (print to document)
- **Download:** Green (save file)
- **Delete:** Red (remove item)
- **Save:** Green (confirm action)
- **Preview:** Blue (check before save)

---

## 🚀 Tips & Tricks

1. **Bulk Create Invoices**
   - Switch to Manual tab
   - Create first invoice
   - Use browser back button to repeat process faster

2. **Invoice Numbering**
   - Auto-generated based on timestamp
   - Change manually if needed before save
   - Auto numbers prevent duplicates

3. **Quick Copy Invoice**
   - Create one invoice
   - Note the format and details
   - Create similar invoices for other customers
   - Manual tab is perfect for recurring customers

4. **Regular Backups**
   - Periodically print invoices to PDF
   - Export localStorage data regularly
   - Keep copies in cloud storage

5. **Customer Communication**
   - Download HTML invoice
   - Send via email
   - Customers can print or save
   - Professional format suitable for business use

---

**Last Updated:** January 2025
**Version:** 1.0 - Invoice Management System
**Status:** ✅ Production Ready
