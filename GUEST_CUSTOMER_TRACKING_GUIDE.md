# 👥 GUEST CUSTOMER TRACKING SYSTEM - IMPLEMENTATION GUIDE

**Status:** Framework Ready for Enhancement  
**Date:** November 27, 2025  
**Purpose:** Track and manage guest customers (users who purchased without signing up)

---

## 📊 CUSTOMER SEGMENTATION

### Current Dashboard Metrics

```
Total Customers = 3
├─ Registered Customers = 3 (signed up, have credentials in database)
└─ Guest Customers = 0 (bought without signing up, no account)
```

### How It Works

**Registered Customer:**
- User signs up on the platform
- Creates account with email/password
- `Order.buyerId` is populated with their user ID
- We have their full credentials in Buyer collection

**Guest Customer:**
- User goes directly to checkout
- Completes purchase with email, phone, name, address
- `Order.buyerId` is NULL or undefined
- We have order details but NO account

---

## 🔍 DETECTION METHOD

### In `mobile-dashboard.tsx`

```typescript
orders.forEach((order: any) => {
  if (order.buyerId) {
    // ✅ This is a REGISTERED customer
    uniqueRegisteredEmails.add(order.email);
  } else {
    // 👤 This is a GUEST customer
    uniqueGuestEmails.add(order.email);
  }
});
```

### Logic
- **Has buyerId?** → Registered
- **No buyerId?** → Guest

---

## 📈 NEXT STEP: BUILD GUEST CUSTOMER TRACKING

### What We'll Build

Create a dedicated database collection to store guest customer profiles:

```typescript
// GuestCustomer Model
interface IGuestCustomer extends Document {
  // Personal Info
  email: string;
  phone: string;
  fullName: string;
  firstName: string;
  lastName: string;
  
  // Address
  address: string;
  busStop?: string;
  city: string;
  state: string;
  zipCode?: string;
  country: string;
  
  // Purchase History
  totalOrders: number;
  totalSpent: number;
  lastPurchaseDate: Date;
  orderIds: string[]; // References to Order documents
  
  // Engagement
  createdAt: Date;
  updatedAt: Date;
  lastOrderDate: Date;
}
```

### Benefits

1. **Unified Guest Profile**
   - Track all purchases by email
   - See complete purchase history
   - Identify repeat guest customers

2. **Marketing**
   - Identify high-value guests
   - Send follow-up emails (with consent)
   - Offer special incentives to convert to registered users

3. **Analytics**
   - Guest vs Registered purchase patterns
   - Average order value by type
   - Conversion metrics

4. **Customer Service**
   - Look up order by email
   - Provide support without account
   - Build customer profile over time

---

## 🛠️ IMPLEMENTATION STEPS

### Step 1: Create GuestCustomer Model

```typescript
// lib/models/GuestCustomer.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IGuestCustomer extends Document {
  email: string;
  phone: string;
  fullName: string;
  firstName: string;
  lastName: string;
  address: string;
  busStop?: string;
  city: string;
  state: string;
  zipCode?: string;
  country: string;
  totalOrders: number;
  totalSpent: number;
  lastPurchaseDate: Date;
  orderIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

const guestCustomerSchema = new Schema<IGuestCustomer>(
  {
    email: { type: String, required: true, unique: true, lowercase: true },
    phone: { type: String, required: true },
    fullName: { type: String, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    address: String,
    busStop: String,
    city: { type: String, required: true },
    state: { type: String, required: true },
    zipCode: String,
    country: { type: String, default: 'Nigeria' },
    totalOrders: { type: Number, default: 1 },
    totalSpent: { type: Number, default: 0 },
    lastPurchaseDate: { type: Date, default: Date.now },
    orderIds: [{ type: Schema.Types.ObjectId, ref: 'Order' }],
  },
  { timestamps: true }
);

// Indexes for fast queries
guestCustomerSchema.index({ email: 1 });
guestCustomerSchema.index({ phone: 1 });
guestCustomerSchema.index({ lastPurchaseDate: -1 });

export default mongoose.models.GuestCustomer ||
  mongoose.model<IGuestCustomer>('GuestCustomer', guestCustomerSchema);
```

### Step 2: Create API Endpoint to Save Guest Customer

```typescript
// app/api/guest-customers/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import GuestCustomer from '@/lib/models/GuestCustomer';
import { serializeDoc } from '@/lib/serializer';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    
    const {
      email,
      phone,
      fullName,
      firstName,
      lastName,
      address,
      busStop,
      city,
      state,
      zipCode,
      orderId,
      orderTotal
    } = body;

    // Check if guest customer already exists
    let guestCustomer = await GuestCustomer.findOne({ email: email.toLowerCase() });

    if (guestCustomer) {
      // Update existing guest customer
      guestCustomer.totalOrders += 1;
      guestCustomer.totalSpent += orderTotal || 0;
      guestCustomer.lastPurchaseDate = new Date();
      if (orderId && !guestCustomer.orderIds.includes(orderId)) {
        guestCustomer.orderIds.push(orderId);
      }
      await guestCustomer.save();
      
      console.log(`✅ Updated guest customer: ${email}`);
    } else {
      // Create new guest customer
      guestCustomer = new GuestCustomer({
        email: email.toLowerCase(),
        phone,
        fullName,
        firstName,
        lastName,
        address,
        busStop,
        city,
        state,
        zipCode,
        totalOrders: 1,
        totalSpent: orderTotal || 0,
        lastPurchaseDate: new Date(),
        orderIds: orderId ? [orderId] : [],
      });
      await guestCustomer.save();
      
      console.log(`✅ Created guest customer: ${email}`);
    }

    return NextResponse.json({
      success: true,
      guestCustomer: serializeDoc(guestCustomer),
    }, { status: 201 });
  } catch (error) {
    console.error('Error saving guest customer:', error);
    return NextResponse.json(
      { error: 'Failed to save guest customer' },
      { status: 500 }
    );
  }
}

// GET guest customers list
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const guestCustomers = await GuestCustomer.find()
      .sort({ lastPurchaseDate: -1 })
      .lean();
    
    return NextResponse.json({
      success: true,
      guestCustomers,
      total: guestCustomers.length,
    });
  } catch (error) {
    console.error('Error fetching guest customers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch guest customers' },
      { status: 500 }
    );
  }
}
```

### Step 3: Call Guest Customer API on Order Creation

In `app/api/orders/route.ts`, after creating an order:

```typescript
// After saving order, check if guest customer
if (!order.buyerId) {
  // This is a guest customer - save to guest customer collection
  try {
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/guest-customers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: order.email,
        phone: order.phone,
        fullName: `${order.firstName} ${order.lastName}`,
        firstName: order.firstName,
        lastName: order.lastName,
        address: order.address,
        busStop: order.busStop,
        city: order.city,
        state: order.state,
        zipCode: order.zipCode,
        orderId: order._id,
        orderTotal: order.total,
      }),
    });
  } catch (error) {
    console.error('Failed to save guest customer:', error);
  }
}
```

### Step 4: Create Guest Customers Admin Page

```typescript
// app/admin/guests/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { Users, Mail, Phone, MapPin } from 'lucide-react';

export default function GuestCustomersPage() {
  const [guests, setGuests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGuestCustomers();
  }, []);

  const loadGuestCustomers = async () => {
    try {
      const response = await fetch('/api/guest-customers');
      const data = await response.json();
      setGuests(data.guestCustomers || []);
    } catch (error) {
      console.error('Failed to load guests:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Guest Customers</h1>
        <p className="text-gray-600 mt-1">
          Customers who purchased without signing up
        </p>
      </div>

      <div className="bg-white rounded-lg shadow">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold">Name</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Email</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Phone</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Orders</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Total Spent</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Last Order</th>
            </tr>
          </thead>
          <tbody>
            {guests.map((guest) => (
              <tr key={guest._id} className="border-b hover:bg-gray-50">
                <td className="px-6 py-4">{guest.fullName}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{guest.email}</td>
                <td className="px-6 py-4 text-sm">{guest.phone}</td>
                <td className="px-6 py-4">{guest.totalOrders}</td>
                <td className="px-6 py-4 font-semibold">
                  ₦{guest.totalSpent.toLocaleString()}
                </td>
                <td className="px-6 py-4 text-sm">
                  {new Date(guest.lastPurchaseDate).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-lime-50 border border-lime-200 rounded-lg p-4">
        <p className="text-sm text-lime-900">
          <strong>{guests.length}</strong> guest customers total
        </p>
      </div>
    </div>
  );
}
```

---

## 📋 DATABASE STRUCTURE

### Guest Customer Collection

```json
{
  "_id": "ObjectId",
  "email": "john@example.com",
  "phone": "08012345678",
  "fullName": "John Doe",
  "firstName": "John",
  "lastName": "Doe",
  "address": "123 Main St",
  "city": "Lagos",
  "state": "Lagos",
  "country": "Nigeria",
  "totalOrders": 3,
  "totalSpent": 125000,
  "lastPurchaseDate": "2025-11-27T10:30:00Z",
  "orderIds": ["orderId1", "orderId2", "orderId3"],
  "createdAt": "2025-11-20T08:00:00Z",
  "updatedAt": "2025-11-27T10:30:00Z"
}
```

---

## 🎯 CURRENT STATUS

### Dashboard Now Shows

```
┌─────────────────────────────────┐
│  TOTAL CUSTOMERS      = 3       │
├─────────────────────────────────┤
│  ✅ Registered        = 3       │
│  👤 Guest            = 0       │
└─────────────────────────────────┘
```

### Next Steps to Build

1. ✅ Dashboard correctly segments customers
2. ⬜ Create GuestCustomer model
3. ⬜ Create guest-customers API
4. ⬜ Hook API to order creation
5. ⬜ Create guest customers admin page
6. ⬜ Add guest tracking to dashboard

---

## 🔗 DATA RELATIONSHIPS

```
Order (with buyerId = NULL)
  ↓
Guest Customer Profile
  ├─ Stores all guest order data
  ├─ Tracks purchase history
  ├─ Counts total spent
  └─ References order documents
```

---

## 📊 INSIGHTS WE'LL GET

Once fully implemented:

- Total guests vs registered ratio
- Guest purchase patterns
- Repeat guest customers
- Average guest order value
- Guest customer lifetime value
- Which guests are high-value targets for conversion
- Geographic distribution of guests
- Most common guest cities/states

---

## ✨ BENEFITS

1. **Better Analytics**
   - Understand guest behavior
   - Identify conversion opportunities

2. **Marketing**
   - Reach out to repeat guests
   - Send personalized offers
   - Encourage sign-up

3. **Customer Service**
   - Quick lookup by email
   - Track their purchase history
   - Personalize support

4. **Business Intelligence**
   - Revenue from guests vs registered
   - Guest retention rates
   - Growth trends

---

## 🚀 READY FOR NEXT PHASE

Current dashboard correctly identifies:
- ✅ Total unique customers
- ✅ Registered customers
- ✅ Guest customers

Next: Build the guest customer tracking system to store and manage guest profiles!

---

**Status:** Framework Complete, Ready for Implementation  
**Next Action:** Build GuestCustomer model and API  
**Timeline:** Can be implemented in next iteration
