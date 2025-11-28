# 💰 VAT Field Structure & Database Design

## Field Architecture

### Current Implementation

```typescript
// Order Model (in API)
{
  reference: string;
  buyerId?: string; // Optional for registered users
  customer: {
    name: string;
    email: string;
    phone: string;
  };
  items: CartItem[];
  pricing: {
    subtotal: number;      // Amount before VAT and shipping
    tax: number;           // ← VAT amount (7.5% of subtotal)
    shipping: number;      // Shipping cost
    total: number;         // Subtotal + VAT + Shipping
  };
  status: "completed" | "pending" | "cancelled";
  createdAt: string;
}

// Invoice Model (in MongoDB)
{
  invoiceNumber: string;
  orderNumber: string;
  buyerId?: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  
  items: InvoiceItem[];
  
  subtotal: number;          // Amount before VAT and shipping
  shippingCost: number;      // Shipping amount
  taxAmount: number;         // ← VAT amount (7.5% of subtotal)
  totalAmount: number;       // Subtotal + VAT + Shipping
  
  taxRate: number;           // Always 7.5% for VAT
  
  invoiceDate: Date;
  dueDate: Date;
  status: "paid" | "pending";
}
```

## Field Mapping Guide

| Field Name | Current Value | Represents | Used For |
|------------|---|---|---|
| `tax` | 7.5% of subtotal | **VAT Amount** | Order pricing breakdown |
| `taxAmount` | 7.5% of subtotal | **VAT Amount** | Invoice pricing breakdown |
| `taxRate` | 7.5 | **VAT Rate (%)** | Reference for remittance calculations |

## Calculation Example

### Scenario: Customer purchases ₦10,000 in items

```
Subtotal (ex-VAT): ₦10,000
VAT (7.5%):        ₦750      ← tax / taxAmount field
Shipping:          ₦2,500    ← shippingCost field
─────────────────────
Total:             ₦13,250
```

**Order Pricing Object:**
```javascript
pricing: {
  subtotal: 10000,
  tax: 750,           // VAT Amount
  shipping: 2500,
  total: 13250
}
```

**Invoice Document:**
```javascript
{
  subtotal: 10000,
  taxAmount: 750,     // VAT Amount
  taxRate: 7.5,       // VAT Rate percentage
  shippingCost: 2500,
  totalAmount: 13250
}
```

## Display Format

### On Checkout Page
```
Subtotal:        ₦10,000
Shipping:        ₦2,500
VAT (7.5%):      ₦750      ← Calculated from tax field
─────────────────
Total Amount:    ₦13,250
```

### On Invoice
```
Subtotal:        ₦10,000
Shipping:        ₦2,500
VAT (7.5%):      ₦750      ← From taxAmount field
─────────────────
Total Amount:    ₦13,250
```

## For Finance Dashboard

The Finance Dashboard uses the comprehensive tax system but references the same VAT amount:

```typescript
// From checkout/orders
const vatAmount = subtotal * 0.075;  // 7.5%

// In Finance Dashboard
taxBreakdown.vat = {
  rate: 7.5,
  totalSalesExVAT: subtotal,
  outputVAT: subtotal * 0.075,       // ← Same as vatAmount
  inputVAT: estimatedExpenses * 0.075,
  vatPayable: outputVAT - inputVAT
}
```

## Monthly VAT Remittance Tracking

### Data Collection
```javascript
// All transactions with VAT in the month
const monthlyTransactions = [
  { subtotal: 10000, vat: 750 },
  { subtotal: 5000, vat: 375 },
  { subtotal: 8000, vat: 600 },
  // ... more transactions
];

// Calculate monthly VAT
const totalOutputVAT = monthlyTransactions.reduce((sum, t) => sum + t.vat, 0);
```

### Required for FIRS Monthly Report (21st of next month)
- **Output VAT**: Sum of all `taxAmount` fields from that month
- **Input VAT**: Sum of supplier/operational cost VAT (from expenses)
- **VAT Payable**: Output VAT - Input VAT

## Migration Path (Future Enhancement)

If you want to rename fields for clarity:

```javascript
// Current
db.invoices.find({ taxAmount: { $gt: 0 } })

// After migration (hypothetical)
db.invoices.find({ vatAmount: { $gt: 0 } })
```

**Recommendation**: Keep current field names for now to avoid:
- Database migration complexity
- Breaking existing code
- Compatibility issues with existing invoices

## API Endpoints Affected

### POST /api/orders
- Creates order with `pricing.tax` field
- Tax is calculated as: `subtotal * 0.075`

### POST /api/invoices
- Creates invoice with `taxAmount` field
- Tax rate stored in `taxRate` field

### GET /api/admin/finance
- Aggregates all `taxAmount` values from invoices
- Calculates Output VAT, Input VAT, VAT Payable
- Generates monthly VAT estimates

## Key Points for Development

✅ **Field Naming Convention**
- Order-level: `pricing.tax` → Represents VAT amount
- Invoice-level: `taxAmount` → Represents VAT amount
- Tax percentage: `taxRate` → Always 7.5%

✅ **Calculation Consistency**
- All tax calculations use: `amount * 0.075`
- No need to store tax rate in every document
- `taxRate: 7.5` is reference data only

✅ **Display Consistency**
- UI shows: "VAT (7.5%)" everywhere
- Database stores: numeric amounts in `tax`/`taxAmount` fields
- Reports use: aggregated sums for compliance

## Troubleshooting

### Issue: Old invoices still show "Tax"
**Solution**: This is normal for invoices created before this update. New invoices will show "VAT".

### Issue: Need to query VAT amounts
```javascript
// Find all invoices with VAT
db.invoices.find({ taxAmount: { $gt: 0 } })

// Sum VAT for a period
db.invoices.aggregate([
  { $match: { invoiceDate: { $gte: startDate, $lte: endDate } } },
  { $group: { _id: null, totalVAT: { $sum: '$taxAmount' } } }
])
```

### Issue: Export orders with VAT breakdown
```javascript
// Get orders with detailed pricing
db.orders.aggregate([
  { $lookup: {
      from: "invoices",
      localField: "_id",
      foreignField: "orderNumber",
      as: "invoices"
  } },
  { $project: {
      subtotal: 1,
      vat: "$pricing.tax",
      shipping: "$pricing.shipping",
      total: "$pricing.total"
  } }
])
```

---

**Last Updated**: November 27, 2025  
**Status**: ✅ Complete and Production Ready
