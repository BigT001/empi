# Weekly Data Validation System

## Overview

This system provides automated weekly data consistency checks and auto-repair capabilities for your MongoDB database. It ensures data integrity across all collections (orders, invoices, expenses) and prevents common issues from accumulating.

## Components

### 1. **weekly-data-validation.js** ✓
Main validation script that performs comprehensive checks without making changes.

**Checks Performed:**
- ✅ Collection existence and status
- ✅ Document counts per collection
- ✅ Revenue consistency (orders vs invoices)
- ✅ Order status validation
- ✅ Expense tracking and VAT calculations
- ✅ Invoice-order synchronization
- ✅ Data quality and completeness
- ✅ Duplicate order numbers
- ✅ Final statistics and summary

**Output:**
- Console report with detailed metrics
- Color-coded results (✅ good, ⚠️ warning, ❌ error)
- Summary of findings

**Example Output:**
```
📊 2. DOCUMENT COUNTS

   Online Orders (UnifiedOrder): 5
   Offline Orders (Order.isOffline): 2
   Expenses: 8
   Invoices: 7
   ...

💰 3. REVENUE CONSISTENCY

   Online Orders Total: ₦15,000,000
   Offline Orders Total: ₦500,000
   Combined Orders: ₦15,500,000
   Invoices Total: ₦15,500,000
   ✅ Revenue matches between orders and invoices
```

### 2. **repair-data-consistency.js** 🔧
Auto-repair script that fixes common issues after detection.

**Repair Capabilities:**
- 🔧 Fix VAT calculation mismatches (recalculates 7.5% VAT)
- 🔧 Generate missing order numbers
- 🔧 Create orphaned invoices for orders without them
- 🔧 Delete orphaned invoices for non-existent orders
- 🔧 Fix invalid date formats
- 🔧 Validate order numbers uniqueness

**Modes:**
- **Report Mode** (default): Lists issues without making changes
- **Auto-Fix Mode** (--fix): Automatically repairs detected issues

**Usage:**
```bash
# Report mode - see issues without fixing
npm run repair

# Auto-fix mode - repair issues automatically
npm run repair:fix
```

### 3. **validation-config.json** ⚙️
Configuration file defining validation rules and alerting behavior.

**Contents:**
- Validation schedule (weekly, Sunday 02:00 AM WAT)
- All check configurations
- Alerting rules and severity levels
- Auto-repair rules
- Notification settings

### 4. **setup-scheduled-tasks.bat** ⏰
Windows Task Scheduler setup script.

**Creates Two Scheduled Tasks:**
1. **Weekly Data Validation** - Every Sunday at 02:00 AM
2. **Weekly Data Repair** - Every Monday at 03:00 AM

**Requirements:**
- Windows OS
- Administrator privileges
- Must be run as Administrator

## Installation & Setup

### Step 1: Verify Files Exist
```bash
# These should already be created:
# - weekly-data-validation.js
# - repair-data-consistency.js
# - validation-config.json
# - setup-scheduled-tasks.bat
```

### Step 2: Create Log Directories
```bash
mkdir logs
mkdir validation-reports
```

### Step 3: Update package.json
Add these scripts to your `package.json`:
```json
{
  "scripts": {
    "validate": "node weekly-data-validation.js",
    "repair": "node repair-data-consistency.js",
    "repair:fix": "node repair-data-consistency.js --fix",
    "setup-scheduler": "setup-scheduled-tasks.bat"
  }
}
```

### Step 4: Setup Windows Scheduled Tasks (Optional)
```bash
# Run as Administrator
setup-scheduled-tasks.bat
```

## Usage

### Manual Validation
```bash
# View current data consistency
npm run validate

# Example output will show:
# - All collections status
# - Document counts
# - Revenue consistency
# - Status of all orders
# - Expense summaries
# - Invoice-order sync status
# - Data quality metrics
```

### Manual Repair (Report Mode)
```bash
# See what issues need fixing without making changes
npm run repair

# Example output:
# Expense ABC123: VAT mismatch (expected ₦15000, got ₦14999)
# Order ORD-456: No matching invoice
```

### Manual Repair (Auto-Fix Mode)
```bash
# Automatically fix detected issues
npm run repair:fix

# Example output:
# ✅ Fixed VAT for expense ABC123
# ✅ Created invoice for order ORD-456
```

## Validation Checks Explained

### 1. Collection Status
**What it checks:** All required collections exist in the database.

**Collections verified:**
- `unifiedorders` - Online orders
- `orders` - Offline orders (with isOffline flag)
- `expenses` - All business expenses
- `invoices` - Generated invoices
- `cautionfeetransactions` - Caution fee tracking
- `customorders` - Custom costume orders
- `buyers` - Customer profiles
- `products` - Product catalog
- `admins` - Admin accounts

**Why it matters:** Missing collections indicate database structure problems.

### 2. Document Counts
**What it checks:** Number of documents in each collection.

**Tracked metrics:**
```
Online Orders:   [count from unifiedorders]
Offline Orders:  [count from orders with isOffline=true]
Expenses:        [count from expenses]
Invoices:        [count from invoices]
Custom Orders:   [count from customorders]
Buyers:          [count from buyers]
Products:        [count from products]
Admins:          [count from admins]
```

**Why it matters:** Unusual counts may indicate deletion issues or data loss.

### 3. Revenue Consistency
**What it checks:** Total revenue from orders matches invoice totals.

**Calculation:**
```
Online Revenue  = sum(unifiedorders.total)
Offline Revenue = sum(orders.total where isOffline=true)
Invoice Total   = sum(invoices.totalAmount)

Expected: Online Revenue + Offline Revenue = Invoice Total
```

**Tolerance:** 0.1% (₦1 per ₦1000)

**Why it matters:** Discrepancies indicate missing invoices or calculation errors.

### 4. Order Status Validation
**What it checks:** All orders have valid status values.

**Valid statuses:**
- pending, confirmed, processing
- shipped, delivered, completed
- cancelled, refunded, returned

**Why it matters:** Invalid statuses prevent proper order tracking and reporting.

### 5. Expense Validation
**What it checks:**
- Expense amounts are positive
- VAT calculations are correct (7.5% of amount)
- Expense dates are valid

**VAT Calculation:**
```
If isVATApplicable = true:
  Expected VAT = amount × 0.075
  (Should match expense.vat field)
```

**Why it matters:** Incorrect VAT prevents accurate tax deduction claims.

### 6. Invoice-Order Sync
**What it checks:** Every invoice has a corresponding order and vice versa.

**Sync verification:**
```
For each invoice: Check that an order exists with matching orderNumber
For each order: Check that an invoice exists with matching orderNumber
```

**Issues detected:**
- Orphaned invoices (no matching order)
- Orphaned orders (no matching invoice)

**Why it matters:** Mismatches cause financial reporting discrepancies.

### 7. Data Quality
**What it checks:** Required fields are present in all records.

**Required fields:**
- Buyers: email, fullName, phone
- Orders: orderNumber, total, status, createdAt
- Expenses: amount, category, description

**Also checks for:** Duplicate order numbers

**Why it matters:** Missing data prevents proper order processing and customer communication.

## Auto-Repair Rules

The system can automatically fix certain issues:

### Auto-Repaired Issues (No Approval Needed)
1. **VAT Calculation Mismatches**
   - Detects: expense.vat ≠ (expense.amount × 0.075)
   - Action: Recalculates and updates VAT
   - Reason: Simple calculation error, safe to fix

2. **Missing Order Numbers**
   - Detects: orders without orderNumber field
   - Action: Generates unique order numbers (OFF-xxxxx for offline, ORD-xxxxx for online)
   - Reason: Essential for order tracking

3. **Invalid Date Formats**
   - Detects: createdAt field not in valid Date format
   - Action: Parses and converts to valid Date
   - Reason: Date parsing is safe and necessary

### Issues Requiring Manual Approval
1. **Duplicate Order Numbers**
   - Requires: Admin to review and manually decide which to keep
   - Not auto-fixed: Could cause data loss

2. **Orphaned Documents**
   - Requires: Admin confirmation before deletion
   - Not auto-fixed: Irreversible action

## Log Files

### Location
```
logs/
  ├── validation-20250122-023045.log
  ├── validation-20250129-023012.log
  └── repair-20250124-030015.log
```

### Format
```
[Timestamp] [Level] [Component] Message
[2025-01-22T02:30:45Z] INFO Weekly Data Validation Started
[2025-01-22T02:30:47Z] CHECK Collection Status: 9/9 collections found
[2025-01-22T02:30:48Z] METRIC Document Count: 47 orders, 8 expenses
```

### Log Levels
- **INFO** - Normal operation messages
- **WARN** - Detected issues that may need attention
- **ERROR** - Critical issues preventing validation
- **METRIC** - Statistics and measurements

## Scheduled Tasks Details

### Task 1: Weekly Data Validation
```
Name:        EMPI\Weekly Data Validation
Schedule:    Every Sunday at 02:00 AM
Frequency:   Weekly
Command:     node weekly-data-validation.js
Log Output:  logs/validation-[date]-[time].log
Purpose:     Comprehensive consistency verification
Duration:    ~30-60 seconds
```

**Why Sunday at 02:00 AM?**
- Low traffic time (minimal user activity)
- Ensures fresh metrics for Monday morning review
- Clear week-to-week boundaries for reporting

### Task 2: Weekly Data Repair
```
Name:        EMPI\Weekly Data Repair
Schedule:    Every Monday at 03:00 AM
Frequency:   Weekly
Command:     node repair-data-consistency.js --fix
Log Output:  logs/repair-[date]-[time].log
Purpose:     Auto-fix issues detected by validation
Duration:    ~30-60 seconds
```

**Why Monday at 03:00 AM?**
- Runs after Sunday validation
- Auto-fixes based on Sunday's findings
- Gives Sunday evening for admin review if needed
- Prepares clean database for the week

## Monitoring & Alerts

### Manual Review Process

**Weekly (Every Monday):**
1. Check validation logs from Sunday morning
2. Review any detected issues
3. If auto-repair ran, verify results in repair logs
4. If issues remain, investigate root causes

**When Issues Are Found:**
```bash
# Check validation report
cat logs/validation-*.log

# Check if repairs were applied
cat logs/repair-*.log

# If issues persist, manually investigate
npm run repair  # See issues without fixing
```

### Key Metrics to Monitor

**From Validation Report:**
- Revenue consistency ✅ or ⚠️
- Order status validity ✅ or ⚠️
- Invoice-order sync ✅ or ⚠️
- VAT calculation accuracy ✅ or ⚠️

**Red Flags:**
- ⚠️ Revenue discrepancy > 0.1%
- ⚠️ Orphaned orders or invoices
- ⚠️ Duplicate order numbers
- ⚠️ Invalid order statuses

## Troubleshooting

### Issue: Tasks Not Running
**Solution:**
1. Open Task Scheduler (taskschd.msc)
2. Check if tasks exist under EMPI folder
3. Right-click task → Run to test manually
4. Check task history for errors

### Issue: Permissions Error
**Solution:**
1. Run setup-scheduled-tasks.bat as Administrator
2. Ensure node.js is in PATH

### Issue: Script Crashes
**Solution:**
1. Check logs directory for error messages
2. Verify MongoDB connection string is current
3. Run npm run validate to test connectivity
4. Check database.js file for connection issues

### Issue: Repair Won't Auto-Fix
**Solution:**
1. Verify you're using --fix flag
2. Check logs for which issues need manual approval
3. Review issue details in repair-data-consistency.js

## Performance Considerations

### Execution Time
- Validation: ~30-60 seconds
- Repair: ~30-60 seconds
- Both: ~2-3 seconds total database interaction time

### Database Load
- Minimal impact on production database
- Uses `.lean()` for read-only queries (no hydration)
- Repair operations batch updates efficiently

### Recommended Timing
- Run during low-traffic hours (02:00-04:00 AM)
- Separate validation (Sunday) and repair (Monday) by 25 hours
- Adjust times if you have different traffic patterns

## Advanced Customization

### Modify Validation Schedule
Edit `setup-scheduled-tasks.bat`:
```batch
REM Change /st (start time) parameter
/st 04:30  REM Runs at 04:30 AM instead of 02:00 AM

REM Change /d (day) parameter
/d MON     REM Runs on Monday instead of Sunday
```

### Adjust Tolerance Levels
Edit `validation-config.json`:
```json
{
  "validationChecks": [
    {
      "name": "Revenue Consistency",
      "tolerancePercentage": 0.5  // Change from 0.1% to 0.5%
    }
  ]
}
```

### Add Custom Validation
Edit `weekly-data-validation.js` to add new check section:
```javascript
// Add after existing checks
console.log('Custom Check Name\n');
// Your custom validation logic
```

## Best Practices

1. **Review Logs Weekly**
   - Check validation reports every Monday
   - Address any persistent issues immediately

2. **Test Auto-Repair**
   - First run in report mode: `npm run repair`
   - Review what would be fixed
   - Then run auto-fix: `npm run repair:fix`

3. **Backup Before Large Repairs**
   - For manual approval items, backup database first
   - Keep backup for 7 days after repair

4. **Document Anomalies**
   - Log any unusual patterns or recurring issues
   - Use logs to identify systemic problems

5. **Regular Updates**
   - Update validation rules as business logic changes
   - Add new collections to validation when added
   - Review alerting rules quarterly

## Support & Maintenance

### Monthly Maintenance Checklist
- [ ] Review all validation reports from past month
- [ ] Check repair logs for patterns
- [ ] Verify no orphaned documents accumulating
- [ ] Confirm revenue calculations remain consistent
- [ ] Test manual repair process

### Quarterly Review
- [ ] Update validation config based on business changes
- [ ] Review and adjust scheduled task times
- [ ] Audit log file sizes and cleanup
- [ ] Update documentation with new patterns found

### Annual Review
- [ ] Comprehensive database audit
- [ ] Review all auto-repair rules for effectiveness
- [ ] Plan for database optimization
- [ ] Update disaster recovery procedures

## Related Documentation

- Finance API: [Finance API Documentation](./FINANCE_API_COMPLETE_FIX.md)
- Admin Notifications: [Admin Notifications](./ADMIN_NOTIFICATIONS_INTEGRATION_GUIDE.md)
- Database Structure: [Complete Order Analysis](./COMPLETE_ORDER_SYSTEM_ANALYSIS_DOCUMENTATION_INDEX.md)
- Caution Fees: [Caution Fee Implementation](./CAUTION_FEE_IMPLEMENTATION_CHECKLIST.md)
