# Database Schema Quick Reference 🚀

## Product Schema

### MongoDB Collection: `products`

```javascript
{
  _id: ObjectId,
  name: String,                    // "Evening Gown"
  description: String,             // Full description
  sellPrice: Number,               // 15000 (NGN)
  rentPrice: Number,               // 3000 (NGN)
  category: String,                // "dresses"
  badge: String,                   // Optional
  imageUrl: String,                // Main image URL
  imageUrls: [String],             // Additional images
  sizes: String,                   // "S,M,L,XL"
  color: String,                   // "Red"
  material: String,                // "Silk"
  condition: String,               // "New"
  careInstructions: String,        // Care details
  
  // ✨ NEW: Delivery Metadata
  deliverySize: String,            // "SMALL" | "MEDIUM" | "LARGE"
  weight: Number,                  // 0.5 to 5 kg
  fragile: Boolean,                // true | false
  
  createdAt: Date,
  updatedAt: Date
}
```

### Default Values

```javascript
{
  deliverySize: "MEDIUM",
  weight: 0.5,
  fragile: false
}
```

### Sample Product Document

```javascript
{
  _id: ObjectId("507f1f77bcf86cd799439011"),
  name: "Evening Gown - Emerald",
  description: "Stunning emerald evening gown perfect for formal events",
  sellPrice: 25000,
  rentPrice: 5000,
  category: "dresses",
  badge: "Premium",
  imageUrl: "https://cdn.example.com/gown1.jpg",
  imageUrls: ["https://cdn.example.com/gown1.jpg", "https://cdn.example.com/gown2.jpg"],
  sizes: "S,M,L,XL",
  color: "Emerald",
  material: "Pure Silk",
  condition: "New",
  careInstructions: "Dry clean only",
  
  // Delivery metadata
  deliverySize: "LARGE",
  weight: 2.5,
  fragile: true,
  
  createdAt: ISODate("2025-11-24T10:00:00Z"),
  updatedAt: ISODate("2025-11-24T10:00:00Z")
}
```

---

## Order Schema

### MongoDB Collection: `orders`

```javascript
{
  _id: ObjectId,
  buyerId: ObjectId,               // Reference to Buyer
  orderNumber: String,             // "ORD-1700754000000"
  
  // Customer Info
  firstName: String,               // "John"
  lastName: String,                // "Doe"
  email: String,                   // "john@example.com"
  phone: String,                   // Optional
  address: String,                 // Delivery address
  busStop: String,                 // Landmark
  city: String,                    // "Lagos"
  state: String,                   // "Lagos"
  zipCode: String,                 // Postal code
  country: String,                 // "Nigeria"
  
  // Order Items
  items: [
    {
      productId: String,           // Reference to Product
      name: String,
      quantity: Number,
      price: Number,
      rentPrice: Number,
      mode: String,                // "buy" | "rent"
      selectedSize: String,
      rentalDays: Number
    }
  ],
  
  // Pricing
  shippingType: String,            // "empi" | "self"
  shippingCost: Number,            // 0 or delivery fee
  subtotal: Number,                // Items total
  total: Number,                   // Grand total
  
  // Fulfillment
  paymentMethod: String,           // "paystack", "transfer", etc
  status: String,                  // "confirmed", "processing", etc
  
  // ✨ NEW: Delivery Information
  deliveryState: String,           // "Lagos"
  deliveryFee: Number,             // 5000
  estimatedDeliveryDays: {
    min: Number,                   // 1
    max: Number                    // 2
  },
  vehicleType: String,             // "BIKE" | "CAR" | "VAN"
  
  createdAt: Date,
  updatedAt: Date
}
```

### Default Values

```javascript
{
  shippingCost: 0,
  deliveryFee: 0,
  deliveryState: null,
  estimatedDeliveryDays: null,
  vehicleType: null
}
```

### Sample Order Document

```javascript
{
  _id: ObjectId("507f1f77bcf86cd799439012"),
  buyerId: ObjectId("507f1f77bcf86cd799439013"),
  orderNumber: "ORD-1700754000000",
  
  firstName: "John",
  lastName: "Doe",
  email: "john@example.com",
  phone: "08012345678",
  address: "123 Lekki Way",
  busStop: "Lekki Phase 1",
  city: "Lagos",
  state: "Lagos",
  zipCode: "106104",
  country: "Nigeria",
  
  items: [
    {
      productId: "507f1f77bcf86cd799439011",
      name: "Evening Gown - Emerald",
      quantity: 1,
      price: 25000,
      rentPrice: 5000,
      mode: "rent",
      selectedSize: "M",
      rentalDays: 3
    }
  ],
  
  shippingType: "empi",
  shippingCost: 5000,
  subtotal: 25000,
  total: 30000,
  
  paymentMethod: "paystack",
  status: "confirmed",
  
  // Delivery info
  deliveryState: "Lagos",
  deliveryFee: 5000,
  estimatedDeliveryDays: { min: 1, max: 2 },
  vehicleType: "BIKE",
  
  createdAt: ISODate("2025-11-24T10:00:00Z"),
  updatedAt: ISODate("2025-11-24T10:00:00Z")
}
```

---

## 📡 API Request/Response Examples

### Create Product with Delivery Metadata

**Request:**
```bash
POST /api/products
Content-Type: application/json

{
  "name": "Evening Gown",
  "description": "Elegant evening gown",
  "sellPrice": 25000,
  "rentPrice": 5000,
  "category": "dresses",
  "imageUrl": "https://cdn.example.com/gown.jpg",
  "deliverySize": "LARGE",
  "weight": 2.5,
  "fragile": true
}
```

**Response:**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "id": "507f1f77bcf86cd799439011",
  "name": "Evening Gown",
  "description": "Elegant evening gown",
  "sellPrice": 25000,
  "rentPrice": 5000,
  "category": "dresses",
  "imageUrl": "https://cdn.example.com/gown.jpg",
  "deliverySize": "LARGE",
  "weight": 2.5,
  "fragile": true,
  "createdAt": "2025-11-24T10:00:00Z",
  "updatedAt": "2025-11-24T10:00:00Z"
}
```

---

### Create Order with Delivery Information

**Request:**
```bash
POST /api/orders
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "phone": "08012345678",
  "address": "123 Lekki Way",
  "city": "Lagos",
  "state": "Lagos",
  "country": "Nigeria",
  "shippingType": "empi",
  "shippingCost": 5000,
  "subtotal": 25000,
  "total": 30000,
  "paymentMethod": "paystack",
  "items": [
    {
      "productId": "507f1f77bcf86cd799439011",
      "name": "Evening Gown",
      "quantity": 1,
      "price": 25000,
      "mode": "rent",
      "rentalDays": 3
    }
  ],
  "deliveryState": "Lagos",
  "deliveryFee": 5000,
  "estimatedDeliveryDays": { "min": 1, "max": 2 },
  "vehicleType": "BIKE"
}
```

**Response:**
```json
{
  "_id": "507f1f77bcf86cd799439012",
  "orderNumber": "ORD-1700754000000",
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
  "vehicleType": "BIKE",
  "createdAt": "2025-11-24T10:00:00Z",
  "updatedAt": "2025-11-24T10:00:00Z"
}
```

---

## 🔍 MongoDB Query Examples

### Find All Products with Large Size

```javascript
db.products.find({ deliverySize: "LARGE" });
```

### Find Fragile Items

```javascript
db.products.find({ fragile: true });
```

### Find Heavy Products (> 3kg)

```javascript
db.products.find({ weight: { $gt: 3 } });
```

### Find Orders Delivered by Bike

```javascript
db.orders.find({ vehicleType: "BIKE" });
```

### Find Orders for Specific State

```javascript
db.orders.find({ deliveryState: "Lagos" });
```

### Calculate Total Delivery Revenue

```javascript
db.orders.aggregate([
  {
    $group: {
      _id: null,
      totalDeliveryRevenue: { $sum: "$deliveryFee" },
      avgDeliveryFee: { $avg: "$deliveryFee" },
      orderCount: { $sum: 1 }
    }
  }
]);
```

### Get Delivery Stats by Vehicle Type

```javascript
db.orders.aggregate([
  {
    $group: {
      _id: "$vehicleType",
      count: { $sum: 1 },
      totalFee: { $sum: "$deliveryFee" }
    }
  }
]);
```

---

## 🛡️ Validation Rules

### Product Fields

| Field | Validation |
|-------|-----------|
| `deliverySize` | Must be "SMALL", "MEDIUM", or "LARGE" |
| `weight` | Must be positive number (0.1 - 10 kg) |
| `fragile` | Must be boolean |

### Order Fields

| Field | Validation |
|-------|-----------|
| `deliveryState` | Max 50 characters, optional |
| `deliveryFee` | Must be non-negative number |
| `estimatedDeliveryDays.min` | Must be positive integer |
| `estimatedDeliveryDays.max` | Must be ≥ min value |
| `vehicleType` | Must match delivery system vehicle (BIKE, CAR, VAN) |

---

## 📊 Indexing Recommendations

For optimal performance with delivery queries:

```javascript
// Product indexes
db.products.createIndex({ deliverySize: 1 });
db.products.createIndex({ weight: 1 });
db.products.createIndex({ fragile: 1 });

// Order indexes
db.orders.createIndex({ deliveryState: 1 });
db.orders.createIndex({ vehicleType: 1 });
db.orders.createIndex({ deliveryFee: 1 });
db.orders.createIndex({ estimatedDeliveryDays: 1 });
```

---

## ✅ Status

- [x] Product schema updated
- [x] Order schema updated
- [x] API endpoints updated
- [x] Backward compatible
- [x] Type safe (TypeScript)
- [x] No compilation errors
- [x] Ready for production

**Last Updated:** November 24, 2025
