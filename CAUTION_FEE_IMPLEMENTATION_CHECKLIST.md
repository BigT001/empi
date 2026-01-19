# CAUTION FEE IMPLEMENTATION CHECKLIST

Use this checklist to track your progress as you expand caution fee display across your application.

---

## ✅ PHASE 1: VERIFICATION (COMPLETED)

- [x] Caution fee calculation verified in CartContext
- [x] Checkout displaying caution fee correctly
- [x] Order API receiving and storing caution fees
- [x] Dashboard showing caution fee metrics
- [x] Per-order caution fees visible in admin panel
- [x] Analytics aggregating from correct sources
- [x] Business rules enforced (rentals only, 50%, no sales)
- [x] Utility functions created and exported

**Status:** ✅ COMPLETE - System is working end-to-end

---

## 🔄 PHASE 2: CUSTOMER-FACING PAGES

### 2.1 Customer Invoice/Receipt Page
- [ ] Create or update `/app/invoice/[orderId]/page.tsx`
- [ ] Import `Order` model and `formatCurrency` utility
- [ ] Fetch order by ID from database
- [ ] Filter rental items from order
- [ ] Display caution fee amount prominently
- [ ] Add refund terms explanation
- [ ] Show collection date
- [ ] Test with sample orders
- [ ] Verify styling matches invoice theme
- [ ] Test print functionality

**Reference:** See CAUTION_FEE_PROPAGATION_GUIDE.md Section 1

### 2.2 Customer Order History Page
- [ ] Update `/app/account/orders/page.tsx`
- [ ] Add caution fee display to order list items
- [ ] Show "🔒 Caution Fee: ₦X" for rental orders
- [ ] Link to refund status (if available)
- [ ] Only show for orders with rental items
- [ ] Style to match existing order cards
- [ ] Test responsive design (mobile, tablet, desktop)
- [ ] Verify performance with many orders
- [ ] Test empty state (no orders)

**Reference:** See CAUTION_FEE_PROPAGATION_GUIDE.md Section 2

### 2.3 Customer Portal - Rental Management
- [ ] Create page showing active rentals with caution fees
- [ ] Show remaining time until return deadline
- [ ] Display caution fee amount
- [ ] Show care instructions to prevent deductions
- [ ] Add "Mark as Returned" button
- [ ] Show potential refund date
- [ ] Test with ongoing rentals

**Reference:** Design based on Section 2 template

**Progress: 2.1: ___/10 | 2.2: ___/8 | 2.3: ___/7**

---

## 🏢 PHASE 3: ADMIN PAGES

### 3.1 Admin Order Detail Page
- [ ] Update `/app/admin/orders/[orderId]/page.tsx`
- [ ] Create dedicated caution fee management section
- [ ] Import `CautionFeeTransaction` model
- [ ] Display fee amount and status
- [ ] Show rental items breakdown (fee calculation base)
- [ ] Show collection date
- [ ] Display refund status if available
- [ ] Add "Mark as Returned" button (refund)
- [ ] Add "Process Partial Refund" button (deductions)
- [ ] Add "Mark as Lost/Forfeited" button
- [ ] Show refund processing history
- [ ] Test all action buttons
- [ ] Verify permission checks (admin only)

**Reference:** See CAUTION_FEE_PROPAGATION_GUIDE.md Section 3

### 3.2 Finance/Accounting Reports Page
- [ ] Create `/app/admin/reports/caution-fees/page.tsx`
- [ ] Display summary cards (Collected, Refunded, etc.)
- [ ] Show current liability amount
- [ ] Create trend chart (optional but recommended)
- [ ] Add date range filter
- [ ] Show detailed breakdown by status
- [ ] Export to CSV functionality
- [ ] Test with various date ranges
- [ ] Performance test with large datasets

**Reference:** See CAUTION_FEE_PROPAGATION_GUIDE.md Section 4

### 3.3 Admin Caution Fee Dashboard
- [ ] Create dedicated admin page for caution fee management
- [ ] Show pending returns (requiring action)
- [ ] Show refunded items
- [ ] Show forfeited items
- [ ] Bulk action buttons (refund multiple orders)
- [ ] Search by order ID or customer name
- [ ] Filter by status
- [ ] Sort by amount, date, etc.

**Progress: 3.1: ___/13 | 3.2: ___/9 | 3.3: ___/7**

---

## 📧 PHASE 4: COMMUNICATIONS

### 4.1 Order Confirmation Email
- [ ] Update email template to include caution fee
- [ ] Show caution fee in itemized breakdown
- [ ] Explain refund terms (7-10 business days)
- [ ] Show rental items that triggered fee
- [ ] Add link to refund policy
- [ ] Test email rendering in multiple clients
- [ ] Test with orders without caution fees (no email change)

**Reference:** See CAUTION_FEE_PROPAGATION_GUIDE.md Section 5

### 4.2 Refund Notification Email
- [ ] Create template for refund processed notification
- [ ] Show original caution fee amount
- [ ] Show refund amount (if partial)
- [ ] Show reason for deduction (if applicable)
- [ ] Show refund processing date
- [ ] Link to invoice/receipt
- [ ] Provide support contact info

### 4.3 SMS/Push Notifications (Optional)
- [ ] Send notification when items need to be returned soon
- [ ] Send notification when refund is processed
- [ ] Remind about return deadline

**Progress: 4.1: ___/7 | 4.2: ___/6 | 4.3: ___/3**

---

## 🎨 PHASE 5: COMPONENTS & UTILITIES

### 5.1 Reusable CautionFeeSection Component
- [ ] Create `/app/admin/components/CautionFeeSection.tsx`
- [ ] Make configurable (display-only vs. with actions)
- [ ] Add customizable styling
- [ ] Include all metrics
- [ ] Export for use across app
- [ ] Create Storybook story (if using Storybook)
- [ ] Test in multiple contexts

**Reference:** See CAUTION_FEE_PROPAGATION_GUIDE.md Section 7

### 5.2 Caution Fee Status Badge Component
- [ ] Create badge component for different statuses
- [ ] pending_return → Yellow
- [ ] refunded → Green
- [ ] partially_refunded → Orange
- [ ] forfeited → Red
- [ ] Reusable across pages

### 5.3 Caution Fee Info Tooltip
- [ ] Create tooltip explaining what caution fee is
- [ ] Show calculation basis
- [ ] Show refund timeline
- [ ] Add on hover to fee displays

**Progress: 5.1: ___/7 | 5.2: ___/5 | 5.3: ___/4**

---

## 🗄️ PHASE 6: DATABASE & BACKEND

### 6.1 Database Optimization
- [ ] Add index on `Order.cautionFee` field
- [ ] Add index on `CautionFeeTransaction.status`
- [ ] Add compound index for analytics queries
- [ ] Test query performance
- [ ] Monitor database size

### 6.2 API Endpoints
- [ ] Create `GET /api/caution-fees/summary` (for dashboard)
- [ ] Create `GET /api/caution-fees/history` (for reports)
- [ ] Create `POST /api/caution-fees/[id]/refund` (process refund)
- [ ] Add pagination to list endpoints
- [ ] Add authentication/authorization checks
- [ ] Add rate limiting

### 6.3 Data Validation
- [ ] Validate caution fee calculations server-side
- [ ] Validate refund amounts don't exceed collected
- [ ] Validate status transitions
- [ ] Add audit logging
- [ ] Test edge cases

**Progress: 6.1: ___/5 | 6.2: ___/6 | 6.3: ___/5**

---

## 🧪 PHASE 7: TESTING

### 7.1 Unit Tests
- [ ] Test `calculateCautionFeeAmount()` function
- [ ] Test `validateCautionFeeForOrder()` function
- [ ] Test calculation logic (50%, only rentals)
- [ ] Test edge cases (zero items, negative, etc.)
- [ ] Test utility functions with various inputs

### 7.2 Integration Tests
- [ ] Test checkout → order creation flow
- [ ] Test order → analytics aggregation
- [ ] Test refund processing
- [ ] Test API endpoints
- [ ] Test database transactions

### 7.3 E2E Tests
- [ ] Customer creates order with rentals (includes caution fee)
- [ ] Customer sees caution fee in invoice
- [ ] Admin processes refund
- [ ] Customer sees refund notification
- [ ] Dashboard metrics update correctly

### 7.4 Manual Testing
- [ ] Test with various rental combinations
- [ ] Test sales-only orders (no caution fee)
- [ ] Test mixed orders (rentals + sales)
- [ ] Test bulk operations
- [ ] Test on different devices/browsers

**Progress: 7.1: ___/5 | 7.2: ___/5 | 7.3: ___/5 | 7.4: ___/5**

---

## 📱 PHASE 8: MOBILE & RESPONSIVE

### 8.1 Mobile Invoice
- [ ] View invoice on mobile
- [ ] Caution fee displays clearly
- [ ] Print functionality works
- [ ] No layout breaks

### 8.2 Mobile Admin
- [ ] Admin pages work on tablet
- [ ] Caution fee section responsive
- [ ] Action buttons accessible
- [ ] Dashboard charts readable

### 8.3 Responsive Design
- [ ] Test breakpoints (sm, md, lg, xl)
- [ ] Verify on various screen sizes
- [ ] Test orientation changes
- [ ] Test zoom levels

**Progress: 8.1: ___/4 | 8.2: ___/4 | 8.3: ___/3**

---

## 🚀 PHASE 9: DEPLOYMENT

### 9.1 Pre-Deployment
- [ ] All tests passing
- [ ] No console errors
- [ ] Performance acceptable
- [ ] Security review complete
- [ ] Accessibility audit passed

### 9.2 Deployment Plan
- [ ] Feature flag ready (if needed)
- [ ] Gradual rollout strategy (% of users)
- [ ] Rollback plan prepared
- [ ] Monitoring set up
- [ ] Alerts configured

### 9.3 Documentation
- [ ] Admin guide updated
- [ ] Customer help articles created
- [ ] API documentation updated
- [ ] Support team trained
- [ ] FAQ created

### 9.4 Post-Deployment
- [ ] Monitor error rates
- [ ] Track caution fee metrics
- [ ] Gather user feedback
- [ ] Fix any issues quickly
- [ ] Document learnings

**Progress: 9.1: ___/5 | 9.2: ___/5 | 9.3: ___/4 | 9.4: ___/4**

---

## 📊 COMPLETION TRACKING

```
PHASE 1: Verification              ███████████████████ 100% ✅
PHASE 2: Customer Pages            [___________] 0%
PHASE 3: Admin Pages               [___________] 0%
PHASE 4: Communications            [___________] 0%
PHASE 5: Components                [___________] 0%
PHASE 6: Database                  [___________] 0%
PHASE 7: Testing                   [___________] 0%
PHASE 8: Mobile                    [___________] 0%
PHASE 9: Deployment                [___________] 0%

OVERALL COMPLETION: 11% ██░░░░░░░░░░░░░░░░░░
```

---

## 📋 PRIORITY QUICK-START GUIDE

**If you have limited time, implement in this order:**

1. **WEEK 1** (Priority: CRITICAL)
   - [ ] Customer Invoice Page (Section 2.1)
   - [ ] Customer Order History (Section 2.2)
   - Effort: 3-4 hours
   - Impact: High - Increases customer transparency

2. **WEEK 2** (Priority: HIGH)
   - [ ] Order Confirmation Email (Section 4.1)
   - [ ] Admin Order Detail (Section 3.1)
   - Effort: 4-5 hours
   - Impact: High - Operational necessity

3. **WEEK 3** (Priority: MEDIUM)
   - [ ] Finance Reports Page (Section 3.2)
   - [ ] CautionFeeSection Component (Section 5.1)
   - Effort: 3-4 hours
   - Impact: Medium - Financial tracking

4. **WEEK 4+** (Priority: NICE-TO-HAVE)
   - [ ] Remaining components
   - [ ] Advanced features
   - [ ] Optimizations

---

## 🎯 SUCCESS CRITERIA

You've successfully implemented caution fees when:

- ✅ Customers see caution fees in checkout
- ✅ Customers see caution fees on invoices
- ✅ Customers see caution fees in order history
- ✅ Admins can see and manage caution fees
- ✅ Dashboard shows correct metrics
- ✅ Emails include caution fee information
- ✅ Refund process is automated
- ✅ All tests passing
- ✅ Mobile responsive
- ✅ No performance issues

---

## 📞 REFERENCE DOCUMENTS

- [CAUTION_FEE_VERIFICATION_REPORT.md](CAUTION_FEE_VERIFICATION_REPORT.md) - Detailed verification
- [CAUTION_FEE_PROPAGATION_GUIDE.md](CAUTION_FEE_PROPAGATION_GUIDE.md) - Implementation code
- [CAUTION_FEE_SUMMARY.md](CAUTION_FEE_SUMMARY.md) - Overview & next steps

---

**Last Updated:** 2024
**Status:** In Progress 🚀
**Questions?** Refer to the propagation guide for code examples
