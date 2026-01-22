# Data Validation System - Quick Reference Card

## 🎯 Commands

```bash
# Check database health (no changes)
npm run validate

# See issues that need fixing (no changes)
npm run repair

# Auto-fix safe issues
npm run repair:fix

# Setup Windows scheduled tasks (Admin required)
npm run setup-scheduler
```

## 📊 What Gets Validated

| Check | What It Does | Pass/Fail |
|-------|-------------|-----------|
| **Collections** | Verify all 9 required collections exist | ✅ or ⚠️ |
| **Counts** | Track # orders, expenses, invoices | 📈 Metric |
| **Revenue** | Orders total ≈ Invoices total | ✅ or ❌ |
| **Order Status** | All orders have valid status | ✅ or ⚠️ |
| **Expenses** | Amount positive, VAT = 7.5% | ✅ or 🔧 |
| **Sync** | Every order has an invoice | ✅ or ⚠️ |
| **Quality** | Required fields present | ✅ or ⚠️ |
| **Duplicates** | No duplicate order numbers | ✅ or ❌ |

## 🔧 What Gets Auto-Fixed

| Issue | What's Fixed | Safe? |
|-------|------------|-------|
| VAT mismatch | Recalculates 7.5% VAT | ✅ Yes |
| Missing order # | Generates unique ID | ✅ Yes |
| Invalid date | Converts to valid Date | ✅ Yes |
| Orphaned invoice | Deletes/creates as needed | ⚠️ Review |
| Duplicate order # | None (needs manual review) | ❌ Manual |

## 📅 Schedule

```
SUNDAY 02:00 AM ──► Validate ──► Generates Report
                                  ↓
                              Check for Issues
                                  ↓
MONDAY 03:00 AM ──► Repair ──► Auto-Fix Safe Issues
                                  ↓
                              Ready for Business Week
```

## 📁 Files & Locations

```
weekly-data-validation.js     Main validation script
repair-data-consistency.js    Auto-repair script
validation-config.json        Configuration file
DATA_VALIDATION_GUIDE.md      Full documentation (2000+ lines)
QUICK_START_VALIDATION.md     Quick start guide (600+ lines)
logs/                         Execution logs directory
validation-reports/           Detailed reports directory
```

## 🚀 Getting Started (5 Minutes)

### Step 1: Run Validation
```bash
npm run validate
```
See if your database is healthy. Takes ~1 minute.

### Step 2: Check for Issues
```bash
npm run repair
```
See what (if anything) needs fixing. Takes ~1 minute.

### Step 3: Auto-Fix (Optional)
```bash
npm run repair:fix
```
Fix issues automatically. Takes ~1 minute.

### Step 4: Setup Automation (Optional)
```bash
npm run setup-scheduler
# Run as Administrator
```
This creates automatic weekly checks. One-time setup.

## 📊 Understanding Output

### Validation Output
```
✅ All checks PASSED
```
Your database is healthy! ✓ Check again next week.

```
⚠️ Some issues found
```
Review them. Most are auto-fixable. ⚠️ Run `npm run repair:fix`

```
❌ Critical issues
```
These need manual review. Check logs and investigate.

### Repair Output

```
Issues Found: 0
✅ No issues found!
```
Everything is perfect. Nothing to fix.

```
Issues Found: 3
Applied Repairs: 3
✅ Fixed VAT for expense ABC123
✅ Generated order number for order XYZ789
✅ Created invoice for order ORD-456
```
Issues were safe to fix and were auto-repaired!

```
Issues Found: 2
Issues:
• Duplicate order number ORD-123
• Orphaned invoice INV-456
💡 Tip: Manual review required for these
```
These need you to manually look at them first.

## 🔍 Checking Results

### View Validation Report
```bash
# Last validation output
Get-Content logs/validation-*.log | Select -Last 50
```

### View Repair Log
```bash
# Last repair output
Get-Content logs/repair-*.log | Select -Last 50
```

### View All Recent Logs
```bash
# List all logs by date
Get-ChildItem logs/ | Sort CreationTime -Desc | Select -First 5
```

## ⚠️ Common Issues & Fixes

| Issue | Cause | Solution |
|-------|-------|----------|
| Script won't run | Node.js not installed | Install Node.js |
| MongoDB error | Connection failed | Check .env, verify IP whitelist |
| Auto-fix didn't work | Issue requires manual review | Check logs, manually fix |
| Tasks not scheduled | Ran without Admin | Run `npm run setup-scheduler` as Admin |
| Wrong time? | Scheduled for different timezone | Edit setup-scheduled-tasks.bat and re-run |

## 📈 Metrics to Watch

**These should be GREEN after validation:**
- ✅ All collections exist
- ✅ Revenue consistent (orders = invoices)
- ✅ All statuses valid
- ✅ VAT calculations correct
- ✅ All orders have invoices
- ✅ All invoices have orders

**These indicate problems (YELLOW/RED):**
- ⚠️ Revenue mismatch > 0.1%
- ⚠️ Invalid order statuses found
- ⚠️ VAT calculations wrong
- ⚠️ Orphaned orders or invoices
- ❌ Duplicate order numbers
- ❌ Collections missing

## 🗓️ Weekly Routine

**Every Monday Morning:**
```
1. Check logs/validation-*.log from Sunday
2. Review any issues mentioned
3. If OK, forget about it until next week
4. If issues, run npm run repair to see details
5. If safe to fix, run npm run repair:fix
```

**When Doing Data Work:**
```
Before: npm run validate  ← Record baseline
  ↓
Make changes
  ↓
After: npm run validate   ← Compare with baseline
```

**Once a Month:**
```
npm run validate  # Spot check
npm run repair    # See if issues accumulate
```

## 🔧 Configuration

### Change Validation Day/Time

Edit `setup-scheduled-tasks.bat`:
```batch
/st 04:30  ← Change time
/d MON     ← Change day (MON, TUE, etc)
```

Then run: `npm run setup-scheduler` (as Admin)

### Change Validation Rules

Edit `validation-config.json`:
```json
{
  "tolerancePercentage": 0.1  ← Change revenue tolerance
}
```

## 📞 When Things Go Wrong

| Problem | Check | Solution |
|---------|-------|----------|
| Can't connect DB | Connection string | Verify in .env file |
| Script crashes | Error message | Check logs/ folder |
| Auto-fix failed | Issue type | Might need manual review |
| Task not running | Task Scheduler | Open taskschd.msc, check EMPI folder |

## 📚 Full Documentation

- **Everything:** [DATA_VALIDATION_GUIDE.md](./DATA_VALIDATION_GUIDE.md)
- **Step-by-step:** [QUICK_START_VALIDATION.md](./QUICK_START_VALIDATION.md)
- **This card:** [VALIDATION_QUICK_REFERENCE.md](./VALIDATION_QUICK_REFERENCE.md)

## ✅ Checklist

- [ ] Run `npm run validate` to verify it works
- [ ] Check output for any issues
- [ ] Run `npm run repair` to see what could be fixed
- [ ] (Optional) Run `npm run setup-scheduler` for automation
- [ ] (Optional) Check Windows Task Scheduler to verify tasks created
- [ ] Bookmark this quick reference for future use

## 🎉 You're All Set!

Your database now has automated weekly validation and repair:
- ✅ Catches consistency issues automatically
- ✅ Auto-fixes safe problems
- ✅ Provides detailed reports
- ✅ Runs on schedule (optional)
- ✅ Easy to use and understand

**Questions?** Check [QUICK_START_VALIDATION.md](./QUICK_START_VALIDATION.md) FAQ section.
