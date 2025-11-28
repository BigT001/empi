# 📊 VAT Query Quick Reference

## Quick Database Queries

### 1. Get All Orders (with VAT)
```javascript
// All completed orders
db.orders.find({ status: "completed" }).pretty()

// Result includes:
// { subtotal: 10000, vat: 750, total: 13250, ... }
```

### 2. Sum Monthly VAT (November 2024)
```javascript
db.orders.aggregate([
  {
    $match: {
      status: "completed",
      createdAt: {
        $gte: ISODate("2024-11-01"),
        $lte: ISODate("2024-11-30")
      }
    }
  },
  {
    $group: {
      _id: null,
      totalVAT: { $sum: "$vat" },
      totalRevenue: { $sum: "$subtotal" },
      totalOrders: { $sum: 1 },
      avgVAT: { $avg: "$vat" }
    }
  }
])

// Result example:
// { totalVAT: 1500, totalRevenue: 20000, totalOrders: 2, avgVAT: 750 }
```

### 3. Daily VAT Summary
```javascript
db.orders.aggregate([
  {
    $match: { status: "completed" }
  },
  {
    $group: {
      _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
      dailyVAT: { $sum: "$vat" },
      orders: { $sum: 1 }
    }
  },
  {
    $sort: { _id: -1 }
  }
])

// Shows VAT for each day
```

### 4. Find Specific Order with VAT
```javascript
// By order number
db.orders.findOne(
  { orderNumber: "ORD-EMPI-1764592038429" },
  { orderNumber: 1, subtotal: 1, vat: 1, vatRate: 1, total: 1 }
)

// Result:
// {
//   orderNumber: "ORD-EMPI-1764592038429",
//   subtotal: 10000,
//   vat: 750,
//   vatRate: 7.5,
//   total: 13250
// }
```

### 5. Orders with High VAT
```javascript
db.orders.find(
  { vat: { $gt: 500 } }
).sort({ vat: -1 })

// Shows largest VAT transactions
```

### 6. VAT by Customer
```javascript
db.orders.aggregate([
  {
    $match: { status: "completed" }
  },
  {
    $group: {
      _id: "$email",
      totalSpent: { $sum: "$subtotal" },
      totalVATPaid: { $sum: "$vat" },
      orders: { $sum: 1 }
    }
  },
  {
    $sort: { totalSpent: -1 }
  }
])

// Shows VAT per customer
```

### 7. Verify VAT Calculation (Quality Check)
```javascript
db.orders.aggregate([
  {
    $match: { status: "completed" }
  },
  {
    $project: {
      orderNumber: 1,
      subtotal: 1,
      vat: 1,
      calculated: { $multiply: ["$subtotal", 0.075] },
      isCorrect: {
        $eq: [
          "$vat",
          { $round: [{ $multiply: ["$subtotal", 0.075] }, 2] }
        ]
      }
    }
  },
  {
    $match: { isCorrect: false }
  }
])

// Shows any orders where VAT wasn't calculated correctly
// (Should return empty result)
```

## Using in Node.js/API

### Express Route Example
```javascript
// Get VAT summary
app.get('/api/admin/vat-summary', async (req, res) => {
  try {
    const summary = await Order.aggregate([
      { $match: { status: "completed" } },
      {
        $group: {
          _id: null,
          totalVAT: { $sum: "$vat" },
          totalRevenue: { $sum: "$subtotal" }
        }
      }
    ]);

    res.json({
      success: true,
      totalVAT: summary[0]?.totalVAT || 0,
      totalRevenue: summary[0]?.totalRevenue || 0
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### Mongoose Query Example
```typescript
// Get orders with VAT for Finance Dashboard
const orders = await Order.find({ status: "completed" });

const vatSummary = {
  totalVAT: orders.reduce((sum, order) => sum + (order.vat || 0), 0),
  totalRevenue: orders.reduce((sum, order) => sum + (order.subtotal || 0), 0),
  averageVAT: (orders.reduce((sum, order) => sum + (order.vat || 0), 0)) / orders.length
};

console.log(vatSummary);
// { totalVAT: 1500, totalRevenue: 20000, averageVAT: 750 }
```

## Export VAT Data for Reporting

### MongoDB Export Command
```bash
# Export all orders with VAT to CSV
mongoexport \
  --uri="mongodb://..." \
  --collection=orders \
  --query='{ status: "completed" }' \
  --fields=orderNumber,subtotal,vat,vatRate,total,createdAt \
  --csv \
  --out=orders_with_vat.csv
```

### Python Script for VAT Report
```python
from pymongo import MongoClient
from datetime import datetime, timedelta

client = MongoClient("mongodb://...")
db = client["empi"]
orders = db["orders"]

# Get VAT for last 30 days
thirty_days_ago = datetime.now() - timedelta(days=30)

vat_report = orders.aggregate([
    {
        "$match": {
            "status": "completed",
            "createdAt": {"$gte": thirty_days_ago}
        }
    },
    {
        "$group": {
            "_id": None,
            "totalVAT": {"$sum": "$vat"},
            "totalRevenue": {"$sum": "$subtotal"},
            "orderCount": {"$sum": 1}
        }
    }
])

for report in vat_report:
    print(f"30-Day VAT Report:")
    print(f"  Total VAT: ₦{report['totalVAT']:,}")
    print(f"  Total Revenue: ₦{report['totalRevenue']:,}")
    print(f"  Orders: {report['orderCount']}")
```

## Troubleshooting

### Issue: Orders don't have VAT field
```javascript
// Add missing VAT to existing orders
db.orders.updateMany(
  { vat: { $exists: false }, status: "completed" },
  [
    {
      $set: {
        vat: { $multiply: ["$subtotal", 0.075] },
        vatRate: 7.5
      }
    }
  ]
)
```

### Issue: Need to recalculate VAT (if rate changed)
```javascript
// Recalculate VAT at 7.5%
db.orders.updateMany(
  { status: "completed" },
  [
    {
      $set: {
        vat: { $round: [{ $multiply: ["$subtotal", 0.075] }, 2] },
        vatRate: 7.5
      }
    }
  ]
)
```

## Integration Points

### Finance Dashboard
```typescript
// Already integrated in app/api/admin/finance/route.ts
const totalVAT = orders.reduce((sum, order) => sum + (order.vat || 0), 0);
```

### Invoice System
```typescript
// VAT from order is already on invoices via taxAmount field
const vat = order.vat // ₦750
const invoiceData = {
  taxAmount: vat,  // Displays as "VAT (7.5%)"
  // ... other fields
};
```

### Order Management
```typescript
// When displaying order details
const order = await Order.findById(id);
console.log(`Order: ${order.orderNumber}`);
console.log(`Subtotal: ₦${order.subtotal}`);
console.log(`VAT: ₦${order.vat}`);
console.log(`Total: ₦${order.total}`);
```

## Data Integrity

All VAT values should:
- ✅ Equal subtotal × 0.075
- ✅ Be rounded to 2 decimal places
- ✅ Be stored for every completed order
- ✅ Be queryable from MongoDB
- ✅ Be included in all aggregations
- ✅ Match Finance Dashboard calculations

---

**Last Updated**: November 27, 2025  
**VAT Rate**: 7.5%  
**Status**: ✅ Production Ready
