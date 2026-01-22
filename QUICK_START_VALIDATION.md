# Quick Start: Weekly Data Validation

## TL;DR - Commands to Use

```bash
# View data consistency (no changes)
npm run validate

# See what issues need fixing (no changes)
npm run repair

# Auto-fix detected issues
npm run repair:fix

# Setup Windows scheduled tasks (Admin required)
npm run setup-scheduler
```

## Step 1: Run Your First Validation

```bash
cd c:\Users\HomePC\Desktop\empi
npm run validate
```

**You'll see output like:**
```
✅ Connected to MongoDB

🔍 WEEKLY DATA VALIDATION REPORT

📋 1. COLLECTION STATUS

   ✅ unifiedorders            - EXISTS
   ✅ orders                   - EXISTS
   ✅ expenses                 - EXISTS
   ✅ invoices                 - EXISTS
   ... (more collections)

📊 2. DOCUMENT COUNTS

   Online Orders (UnifiedOrder): 0
   Offline Orders (Order.isOffline): 0
   Expenses: 0
   Invoices: 0
   ... (more counts)

💰 3. REVENUE CONSISTENCY

   Online Orders Total: ₦0
   Offline Orders Total: ₦0
   Combined Orders: ₦0
   Invoices Total: ₦0
   ✅ Revenue matches between orders and invoices

... (rest of checks)

📋 8. SUMMARY & RECOMMENDATIONS

   ✅ ALL CHECKS PASSED - Database is healthy!

📈 9. FINAL STATISTICS

   Validation Date: 2025-01-22T10:30:45.000Z
   Total Orders: 0
   Total Revenue: ₦0
   Total Expenses: ₦0
   ... (more stats)
```

## Step 2: Check for Issues (Report Mode)

```bash
npm run repair
```

**If issues are found, you'll see:**
```
🔧 DATA CONSISTENCY REPAIR SCRIPT

Mode: 🟢 REPORT ONLY

✅ Checking VAT calculations...
   ⚠️ Found 2 VAT calculation issues

✅ Checking for missing order numbers...
   ⚠️ Found 1 orders without order numbers

...more checks...

📋 REPAIR SUMMARY

   Issues Found: 5

   Issues:
   • Expense 507a8f9c1d5e2: VAT mismatch (expected ₦15000, got ₦14999)
   • Order OFF-123456: No matching invoice
   ... (more issues)

   💡 Tip: Run with --fix flag to auto-repair these issues
```

## Step 3: Auto-Fix Issues (With Approval)

```bash
# IMPORTANT: Review the report output first (Step 2)
# Then run auto-fix if issues look safe to repair
npm run repair:fix
```

**You'll see repairs being applied:**
```
🔧 DATA CONSISTENCY REPAIR SCRIPT

Mode: 🔴 AUTO-FIX

... checking issues...

📋 REPAIR SUMMARY

   Total Issues Found: 5
   Total Repairs Applied: 5

   Applied Repairs:
   ✅ Fixed VAT for expense 507a8f9c1d5e2
   ✅ Generated order number for offline order 608a9f9c1d5e3
   ✅ Created invoice for order ORD-456
   ✅ Fixed date for order ORD-789
   ✅ Deleted orphaned invoice 709b0f9c1d5e4
```

## Step 4: Setup Automatic Weekly Validation (Optional)

**Windows Users:**

```bash
# 1. Open PowerShell as Administrator
# 2. Navigate to your workspace
cd c:\Users\HomePC\Desktop\empi

# 3. Run setup
npm run setup-scheduler
```

This creates two automatic tasks:
- **Sunday 02:00 AM** - Weekly validation check
- **Monday 03:00 AM** - Weekly auto-repair

You can view these in Windows Task Scheduler.

## What Gets Checked

### ✅ Collection Status
- Are all required collections present?
- Example: `unifiedorders`, `orders`, `expenses`, `invoices`

### ✅ Document Counts
- How many orders? expenses? invoices?
- Helps spot unexpected data loss

### ✅ Revenue Consistency
- Do order totals match invoice totals?
- Catches missing or duplicate invoices

### ✅ Order Status Validation
- Are all orders marked with valid statuses?
- Valid statuses: pending, confirmed, completed, shipped, delivered, cancelled, refunded, returned

### ✅ Expense Validation
- Are expense amounts positive?
- Is VAT calculated correctly (7.5%)?
- Are dates valid?

### ✅ Invoice-Order Sync
- Does every invoice have a matching order?
- Does every order have a matching invoice?

### ✅ Data Quality
- Do buyers have complete info (email, name, phone)?
- Do orders have required fields (orderNumber, total, status)?
- Are there duplicate order numbers?

## What Gets Auto-Fixed

### 🔧 Safe Auto-Repairs (No Approval Needed)

1. **VAT Calculation Mismatches**
   - Problem: expense.vat doesn't equal amount × 0.075
   - Fix: Recalculates VAT to correct value
   - Impact: Financial reports will be accurate

2. **Missing Order Numbers**
   - Problem: Orders without orderNumber field
   - Fix: Generates unique order numbers
   - Impact: Orders become trackable

3. **Invalid Date Formats**
   - Problem: createdAt not in valid Date format
   - Fix: Converts to valid Date
   - Impact: Date filtering works correctly

### ⚠️ Requires Manual Review (NOT Auto-Fixed)

1. **Duplicate Order Numbers**
   - Problem: Two orders with same orderNumber
   - Why not auto: Could delete wrong one
   - What to do: Check logs, manually decide which to keep

2. **Orphaned Documents**
   - Problem: Invoice without matching order
   - Why not auto: Could be intentional
   - What to do: Manually review in logs before deletion

## Understanding the Output

### Color Coding
- **✅ Green checkmark** - Everything is OK
- **⚠️ Yellow warning** - Issue found but handled
- **❌ Red X** - Critical issue (needs attention)

### Sections in Validation Report

```
1. COLLECTION STATUS        - Do all collections exist?
2. DOCUMENT COUNTS          - How much data do we have?
3. REVENUE CONSISTENCY      - Do orders match invoices?
4. ORDER STATUS VALIDATION  - Are statuses valid?
5. EXPENSE VALIDATION       - Are expenses correct?
6. INVOICE-ORDER SYNC       - Do invoices match orders?
7. DATA QUALITY             - Is data complete?
8. SUMMARY                  - Overall health
9. FINAL STATISTICS         - Key metrics
```

## Example Scenarios

### Scenario 1: Everything Is Fine
```bash
npm run validate
# Output shows all ✅ checkmarks
# Message: "ALL CHECKS PASSED - Database is healthy!"
```
**Action:** Nothing needed. Check again next week.

### Scenario 2: Minor VAT Issues Found
```bash
npm run repair
# Shows: "Found 3 VAT calculation issues"

npm run repair:fix
# Shows: "Applied 3 repairs - Fixed VAT for expenses"
```
**Action:** Safe to auto-fix. This happens when VAT was hand-entered incorrectly.

### Scenario 3: Missing Invoices Detected
```bash
npm run repair
# Shows: "Found 2 orders without invoices"

# Review the specific order numbers in the output
# Then:
npm run repair:fix
# Shows: "Created invoice for order ORD-456"
```
**Action:** Safe to auto-fix. System will generate invoices for these orders.

### Scenario 4: Duplicate Order Numbers (Not Auto-Fixed)
```bash
npm run repair
# Shows: "Found duplicate order numbers"
# Lists which order numbers appear twice
```
**Action:** Must manually investigate. Look at logs to see which orders are duplicates, then decide which to delete.

## Log Files

All validation and repair activities are logged.

**Location:** `logs/` folder in your workspace

**Example files:**
```
validation-20250122-023045.log  (from Sunday validation)
repair-20250124-030015.log      (from Monday repair)
```

**View logs:**
```bash
# View latest validation
Get-Content logs/validation-*.log | Select-Object -Last 50

# View latest repair
Get-Content logs/repair-*.log | Select-Object -Last 50
```

## Troubleshooting

### Q: Script says "ERROR: Could not connect to MongoDB"
**A:** Check your database connection:
```bash
# Verify connection string in the .env file is correct
# Check MongoDB cluster status at: https://cloud.mongodb.com/
# Ensure your IP is whitelisted in MongoDB Atlas
```

### Q: Auto-repair didn't fix my issue
**A:** Some issues require manual review:
```bash
# Check if it's in the manual review list:
npm run repair  # Look for your issue in the output

# If it shows "Issues Found: X"
# Check DATA_VALIDATION_GUIDE.md for "Issues Requiring Manual Approval"
```

### Q: Task Scheduler not working
**A:** Run setup again with Administrator privileges:
```bash
# Open PowerShell as Administrator (right-click → Run as administrator)
cd c:\Users\HomePC\Desktop\empi
npm run setup-scheduler
```

### Q: What if the database gets corrupted?
**A:** The validation and repair scripts help prevent this:
- Run `npm run validate` immediately to assess damage
- Check logs to see exactly what's wrong
- Use `npm run repair` (report mode) to see all issues first
- Consider backing up before running `npm run repair:fix`

## Weekly Routine (Recommended)

**Every Monday Morning:**
```
1. Open logs/validation-*.log from Sunday's run
2. Review any issues that were detected
3. Check if repairs were applied (look in logs/repair-*.log)
4. If serious issues found, investigate root cause
```

**When Creating Large Data Changes:**
```
1. Before: npm run validate  # Baseline
2. Make your changes
3. After: npm run validate   # Compare
4. If issues: npm run repair --report to see what changed
```

**Monthly:**
```
npm run validate  # Run manually to verify
npm run repair    # Check if any issues accumulate
```

## Files Created

```
weekly-data-validation.js      - Main validation script
repair-data-consistency.js     - Auto-repair script
validation-config.json         - Configuration
setup-scheduled-tasks.bat      - Windows scheduler setup
DATA_VALIDATION_GUIDE.md       - Detailed documentation
QUICK_START_VALIDATION.md      - This file
```

## Need Help?

- **Full Documentation:** See `DATA_VALIDATION_GUIDE.md`
- **Configuration Details:** See `validation-config.json`
- **Understanding Issues:** Check error messages in validation output
- **Testing Auto-Repair:** Always run `npm run repair` first to review changes

## Next Steps

1. ✅ Run `npm run validate` to see current state
2. ✅ Check output for any issues
3. ✅ If issues found, run `npm run repair` to review them
4. ✅ If safe to fix, run `npm run repair:fix`
5. ✅ (Optional) Run `npm run setup-scheduler` for automatic weekly checks

Happy validating! 🎉
