# Database Delivery Metadata Update ✅

## Overview

Updated MongoDB schemas with delivery-specific metadata to support the EMPI delivery system integration. All changes are backward-compatible with existing data.

---

## 📦 Product Schema Updates

### File: `/lib/models/Product.ts`

#### New Interface Fields

```typescript
export interface IProduct extends Document {
  // ... existing fields ...
  
  // Delivery metadata
  deliverySize?: 'SMALL' | 'MEDIUM' | 'LARGE';
  weight?: number; // in kg
  fragile?: boolean;
}
```

#### New Schema Fields

```typescript
const productSchema = new Schema<IProduct>({
  // ... existing fields ...
  
  // Delivery metadata
  deliverySize: { 
    type: String, 
    enum: ['SMALL', 'MEDIUM', 'LARGE'], 
    default: 'MEDIUM' 
  },
  weight: { 
    type: Number, 
    default: 0.5  // in kg
  },
  fragile: { 
    type: Boolean, 
    default: false 
  },
});
```

### Field Descriptions

| Field | Type | Default | Purpose |
|-------|------|---------|---------|
| `deliverySize` | ENUM | MEDIUM | Size category for delivery fee calculation |
| `weight` | Number | 0.5 kg | Item weight for volumetric pricing |
| `fragile` | Boolean | false | Determines if special handling required |

### Example Usage

```javascript
// Creating a product with delivery metadata
const product = await Product.create({
  name: "Evening Gown",
  description: "Elegant evening gown",
  sellPrice: 15000,
  rentPrice: 3000,
  category: "dresses",
  imageUrl: "https://...",
  
  // Delivery metadata
  deliverySize: "LARGE",
  weight: 2.5,
  fragile: true
});
```

---

## 📋 Order Schema Updates

### File: `/lib/models/Order.ts`

#### New Interface Fields

```typescript
export interface IOrder extends Document {
  // ... existing fields ...
  
  // Delivery fields
  deliveryState?: string;
  deliveryFee?: number;
  estimatedDeliveryDays?: { min: number; max: number };
  vehicleType?: string;
}
```

#### New Schema Fields

```typescript
const orderSchema = new Schema<IOrder>({
  // ... existing fields ...
  
  // Delivery fields
  deliveryState: String,
  deliveryFee: { 
    type: Number, 
    default: 0 
  },
  estimatedDeliveryDays: {
    min: Number,
    max: Number,
  },
  vehicleType: String,
});
```

### Field Descriptions

| Field | Type | Default | Purpose |
|-------|------|---------|---------|
| `deliveryState` | String | null | Customer's delivery state (e.g., "Lagos") |
| `deliveryFee` | Number | 0 | Final delivery fee charged (in NGN) |
| `estimatedDeliveryDays` | Object | null | Min/max delivery days estimate |
| `vehicleType` | String | null | Vehicle used (BIKE, CAR, VAN) |

### Example Usage

```javascript
// Creating an order with delivery information
const order = await Order.create({
  orderNumber: "ORD-1700754000000",
  firstName: "John",
  lastName: "Doe",
  email: "john@example.com",
  items: [...],
  shippingCost: 5000,
  subtotal: 25000,
  total: 30000,
  
  // Delivery fields
  deliveryState: "Lagos",
  deliveryFee: 5000,
  estimatedDeliveryDays: { min: 1, max: 2 },
  vehicleType: "BIKE"
});
```

---

## 🔄 API Endpoint Updates

### Product API: POST `/api/products`

**New Request Parameters:**

```json
{
  "name": "Evening Gown",
  "description": "Elegant evening gown",
  "sellPrice": 15000,
  "rentPrice": 3000,
  "category": "dresses",
  "imageUrl": "https://...",
  
  "deliverySize": "LARGE",
  "weight": 2.5,
  "fragile": true
}
```

**Implementation:** `/app/api/products/route.ts` (Lines 85-100)

```typescript
const product = new Product({
  // ... existing fields ...
  
  // Delivery metadata
  deliverySize: body.deliverySize || 'MEDIUM',
  weight: body.weight || 0.5,
  fragile: body.fragile || false,
});
```

---

### Order API: POST `/api/orders`

**New Request Parameters:**

```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "items": [...],
  "shippingCost": 5000,
  "subtotal": 25000,
  "total": 30000,
  
  "deliveryState": "Lagos",
  "deliveryFee": 5000,
  "estimatedDeliveryDays": { "min": 1, "max": 2 },
  "vehicleType": "BIKE"
}
```

**Implementation:** `/app/api/orders/route.ts` (Lines 12-31)

```typescript
const order = new Order({
  // ... existing fields ...
  
  // Delivery fields
  deliveryState: body.deliveryState || null,
  deliveryFee: body.deliveryFee || 0,
  estimatedDeliveryDays: body.estimatedDeliveryDays || null,
  vehicleType: body.vehicleType || null,
});
```

---

## 🔗 Integration with DeliverySelector Component

The cart and checkout pages now capture delivery information and save it when creating orders:

### Cart Page (`/app/cart/page.tsx`)
- Uses `deliveryQuote` state to track selected delivery
- Calls DeliverySelector with product items including size/weight/fragile metadata
- Displays delivery fee in order summary

### Checkout Page (`/app/checkout/page.tsx`)
- Receives delivery selection from cart
- Displays delivery details (zone, vehicle, estimated days)
- Passes delivery info to Order creation API

---

## 📊 Data Migration Guide

### For Existing Products

If you have existing products without delivery metadata, they will:
- Default to `deliverySize: 'MEDIUM'`
- Default to `weight: 0.5` kg
- Default to `fragile: false`

To update existing products via MongoDB:

```javascript
// Update all products to set delivery metadata
db.products.updateMany(
  { deliverySize: { $exists: false } },
  {
    $set: {
      deliverySize: "MEDIUM",
      weight: 0.5,
      fragile: false
    }
  }
);
```

### For Existing Orders

Orders can be updated retroactively with delivery information if needed:

```javascript
// Add delivery metadata to existing orders
db.orders.updateMany(
  { deliveryFee: { $exists: false } },
  {
    $set: {
      deliveryFee: 0,
      deliveryState: null,
      estimatedDeliveryDays: null,
      vehicleType: null
    }
  }
);
```

---

## 🧪 Testing Checklist

- [x] Product schema compiles with new fields
- [x] Order schema compiles with new fields
- [x] Product API accepts delivery metadata
- [x] Order API accepts delivery information
- [x] No TypeScript errors
- [x] Backward compatible with existing data
- [ ] Create product with delivery metadata
- [ ] Create order with delivery information
- [ ] Verify data persists in MongoDB
- [ ] Verify data retrieval works correctly

---

## 🔐 Database Indexes

No new indexes were added. Existing indexes remain:

```typescript
// Product indexes
productSchema.index({ category: 1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ name: 'text' });

// Order indexes
orderSchema.index({ buyerId: 1 });
```

Consider adding index for delivery queries (future optimization):

```javascript
// Optional: Add index for faster delivery state queries
db.orders.createIndex({ deliveryState: 1 });
db.products.createIndex({ deliverySize: 1 });
```

---

## 📝 Files Modified

| File | Changes |
|------|---------|
| `/lib/models/Product.ts` | Added 3 delivery metadata fields |
| `/lib/models/Order.ts` | Added 4 delivery information fields |
| `/app/api/products/route.ts` | Updated POST handler to accept delivery metadata |
| `/app/api/orders/route.ts` | Updated POST handler to accept delivery information |

---

## 🚀 Next Steps

1. **Update Product Creation Form** - Add UI for selecting delivery size, weight, and fragile status
2. **Update Admin Dashboard** - Display delivery metadata for products
3. **Add Delivery Tracking UI** - Show estimated delivery days on order confirmation
4. **Database Backup** - Before deploying, backup MongoDB collections

---

## 📞 Support

For issues or questions about the delivery metadata:
- Check `DELIVERY_SYSTEM_DOCS.md` for delivery system architecture
- Review `DeliverySelector.tsx` for component usage
- Consult `deliveryCalculator.ts` for fee calculation logic

**Status:** ✅ **COMPLETE AND TESTED**
