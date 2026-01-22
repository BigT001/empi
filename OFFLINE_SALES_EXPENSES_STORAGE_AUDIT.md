# OFFLINE SALES & EXPENSES - COMPLETE DATA STORAGE AUDIT

## 📊 WHERE IS EVERYTHING STORED?

### **1. OFFLINE SALES (Manual Orders)**

#### **Storage Location:**
- **Collection**: `orders` 
- **Model**: [lib/models/Order.ts](lib/models/Order.ts)
- **Identifier**: `isOffline: true` flag

#### **Creation Endpoint:**
- **POST** `/api/admin/offline-orders`
- **File**: [app/api/admin/offline-orders/route.ts](app/api/admin/offline-orders/route.ts)
- **Frontend**: [app/admin/offline-order-form.tsx](app/admin/offline-order-form.tsx)

#### **What Gets Stored:**
```javascript
{
  _id: ObjectId,
  orderNumber: "OFF-1705933184000-ABC123XYZ",  // Unique offline order ID
  
  // Customer Info
  firstName: string,
  lastName: string,
  email: string,
  phone: string,
  address: string,
  city: string,
  
  // Item Details
  itemDescription: string,           // e.g., "Blue Lace Gown - Rental"
  requiredQuantity: number,
  
  // Pricing
  subtotal: number,                 // Amount before VAT
  vat: number,                      // 7.5% VAT
  total: number,                    // subtotal + vat
  
  // Type (Sale or Rental)
  mode: "buy" | "rent",             // Determined from type
  type: "sale" | "rental",          // Input type
  
  // Status Tracking
  status: "pending" | "completed",
  paymentStatus: "paid" | "pending",
  paymentMethod: "cash" | "transfer" | "other",
  
  // CRITICAL FLAG
  isOffline: true,                  // ⭐ This marks it as offline
  
  // Timeline
  createdAt: Date,
  updatedAt: Date,
}
```

#### **Query From:**
```javascript
// Fetch all offline sales
const offlineOrders = await Order.find({ isOffline: true });

// Fetch by status
const completedOffline = await Order.find({ 
  isOffline: true, 
  status: "completed" 
});

// Fetch by date range
const recentOffline = await Order.find({
  isOffline: true,
  createdAt: { $gte: startDate, $lte: endDate }
});
```

#### **API Endpoints:**
```
GET    /api/admin/offline-orders              - Fetch all offline sales
GET    /api/admin/offline-orders?status=paid  - Filter by status
POST   /api/admin/offline-orders              - Create new offline order
PATCH  /api/admin/offline-orders/:id          - Update offline order
DELETE /api/admin/offline-orders/:id          - Delete offline order
```

---

### **2. DAILY EXPENSES (Manual Expenses)**

#### **Storage Location:**
- **Collection**: `expenses`
- **Model**: [lib/models/Expense.ts](lib/models/Expense.ts)
- **Identifier**: `isOffline: true` flag

#### **Creation Endpoint:**
- **POST** `/api/admin/offline-expenses`
- **File**: [app/api/admin/offline-expenses/route.ts](app/api/admin/offline-expenses/route.ts)
- **Frontend**: [app/admin/expense-form.tsx](app/admin/expense-form.tsx)

#### **What Gets Stored:**
```javascript
{
  _id: ObjectId,
  
  // Expense Details
  description: string,               // e.g., "Fabric purchase - Blue lace"
  category: string,                  // 'supplies' | 'inventory' | 'utilities' | 'rent' | 'equipment' | 'services' | 'delivery' | 'transport' | 'packaging' | 'office-supplies' | 'other'
  vendorName: string,                // Supplier name
  receiptNumber: string,             // e.g., "OFF-EXP-1705933184000-ABC123XYZ"
  
  // Financial
  amount: number,                    // Expense amount (before VAT)
  vat: number,                       // VAT amount (Input VAT - deductible)
  vatRate: number,                   // 7.5% (Input VAT rate)
  total: number,                     // amount + vat
  isVATApplicable: boolean,          // Whether VAT applies
  
  // Payment & Status
  paymentMethod: "cash" | "bank_transfer" | "cheque" | "card",
  status: "paid" | "pending" | "verified",  // Offline = "verified"
  
  // Notes & Tracking
  notes: string,                     // Additional notes
  
  // CRITICAL FLAG
  isOffline: true,                   // ⭐ This marks it as offline expense
  
  // Timeline
  date: Date,                        // Date of expense
  createdAt: Date,
  updatedAt: Date,
}
```

#### **Query From:**
```javascript
// Fetch all offline expenses
const offlineExpenses = await Expense.find({ isOffline: true });

// Fetch by category
const suppliesExpenses = await Expense.find({ 
  isOffline: true, 
  category: "supplies" 
});

// Fetch by date range
const monthlyExpenses = await Expense.find({
  isOffline: true,
  date: { $gte: startDate, $lte: endDate }
});

// Fetch expenses by VAT applicability
const vatExpenses = await Expense.find({
  isOffline: true,
  isVATApplicable: true
});
```

#### **API Endpoints:**
```
GET    /api/admin/offline-expenses              - Fetch all expenses
GET    /api/admin/offline-expenses?category=   - Filter by category
POST   /api/admin/offline-expenses              - Create new expense
PATCH  /api/admin/offline-expenses/:id          - Update expense
DELETE /api/admin/offline-expenses/:id          - Delete expense
```

---

### **3. DAILY TRANSACTIONS (General Expenses)**

#### **Storage Location:**
- **Collection**: `expenses`
- **Model**: [lib/models/Expense.ts](lib/models/Expense.ts)
- **Identifier**: Can be `isOffline: true` OR `isOffline: false` (online)

#### **Creation Endpoint:**
- **POST** `/api/expenses`
- **File**: [app/api/expenses/route.ts](app/api/expenses/route.ts)

#### **Query From:**
```javascript
// Fetch all expenses (online + offline)
const allExpenses = await Expense.find({});

// Fetch only offline expenses
const offlineExpenses = await Expense.find({ isOffline: true });

// Fetch only online expenses
const onlineExpenses = await Expense.find({ isOffline: false });

// Fetch with date filtering
const dateRangeExpenses = await Expense.find({
  date: { $gte: startDate, $lte: endDate }
});
```

#### **API Endpoints:**
```
GET    /api/expenses                   - Fetch all expenses
GET    /api/expenses?isOffline=true    - Fetch offline only
GET    /api/expenses?category=supplies - Filter by category
POST   /api/expenses                   - Create expense
PATCH  /api/expenses/:id               - Update expense
DELETE /api/expenses/:id               - Delete expense
```

---

## 📍 HOW FRONTEND QUERIES THESE

### **Transaction History Page**
- **File**: [app/admin/transaction-history.tsx](app/admin/transaction-history.tsx)
- **Queries**:
  ```typescript
  // Fetch offline sales
  fetch("/api/admin/offline-orders")
  
  // Delete offline sale
  fetch(`/api/admin/offline-orders/${saleId}`, { method: 'DELETE' })
  ```

### **Offline Sales & Rentals Tab**
- **File**: [app/admin/offline-orders-table.tsx](app/admin/offline-orders-table.tsx)
- **Queries**:
  ```typescript
  fetch(`/api/admin/offline-orders?status=${status}&mode=${mode}`)
  ```

### **Daily Expenses Tab**
- **File**: [app/admin/finance/page.tsx](app/admin/finance/page.tsx) (Daily Expenses tab)
- **Queries**:
  ```typescript
  fetch("/api/admin/offline-expenses")
  ```

### **Dashboard Analytics**
- **File**: [app/api/admin/analytics/route.ts](app/api/admin/analytics/route.ts)
- **Queries**:
  ```typescript
  // Identifies offline orders
  const isOfflineOrder = Boolean(order.isOffline || order.orderType === 'offline');
  
  // Calculates offline revenue separately
  if (isOfflineOrder) {
    offlineSalesRevenue += orderTotal;
  }
  ```

---

## 🗂️ COLLECTION STRUCTURE

### **orders Collection** (has both online & offline)
```
{
  isOffline: true  → OFFLINE SALES
  isOffline: false → ONLINE SALES (UnifiedOrders)
}
```

### **expenses Collection** (has both online & offline)
```
{
  isOffline: true  → OFFLINE/MANUAL EXPENSES
  isOffline: false → ONLINE EXPENSES
}
```

---

## 💡 KEY INSIGHTS (Senior Developer Notes)

### **Architecture Issues:**
1. ⚠️ **Offline sales stored in `orders` collection** - Not in `unifiedorders`
   - Problem: They won't be queried when you consolidated to UnifiedOrder only!
   - Solution: Need to update Finance API to also query `orders` with `isOffline: true`

2. ⚠️ **Expenses in separate collection** - Good isolation
   - Allows separate querying
   - Doesn't pollute order data
   - Properly indexed for date/category

3. ✅ **Using `isOffline` flag** - Good design
   - Easy to filter
   - Can query same collection for different types
   - Indexes are in place

### **Current Problem:**
Since you consolidated Finance API to **only query UnifiedOrder**, it will:
- ✅ Get online sales (from unifiedorders)
- ❌ Miss offline sales (from orders with isOffline=true)
- ❌ Miss expenses (from expenses collection)

---

## 🔧 RECOMMENDED FIX

Update Finance API to also query offline sources:

```typescript
// In app/api/admin/finance/route.ts
const allUnifiedOrders = await UnifiedOrder.find({}).lean();

// ADD THIS: Query offline orders
const offlineOrders = await Order.find({ isOffline: true }).lean();

// ADD THIS: Query expenses
const allExpenses = await Expense.find({}).lean();

// Combine: online + offline orders
const mergedOrders = [...allUnifiedOrders, ...offlineOrders];

// Use: allExpenses for expense calculations
```

---

## 📈 DASHBOARD BREAKDOWN

**Your Dashboard Currently Shows:**
```
├─ Online Sales: ₦0 (from UnifiedOrders only)
├─ Online Rentals: ₦0
├─ Offline Sales: ??? (not queried from Finance API)
├─ Daily Expenses: ??? (from /api/admin/offline-expenses separately)
└─ Caution Fees: ₦0
```

**Should Show:**
```
├─ Online Sales: X (UnifiedOrders)
├─ Online Rentals: Y (UnifiedOrders)
├─ Offline Sales: Z (orders.isOffline=true)
├─ Daily Expenses: W (expenses.isOffline=true)
└─ Caution Fees: V
```

---

## ✨ SUMMARY TABLE

| Item | Collection | Identifier | Query | API |
|------|-----------|-----------|-------|-----|
| **Offline Sales** | `orders` | `isOffline: true` | `Order.find({isOffline: true})` | `/api/admin/offline-orders` |
| **Online Sales** | `unifiedorders` | No flag needed | `UnifiedOrder.find({})` | `/api/orders/unified` |
| **Offline Expenses** | `expenses` | `isOffline: true` | `Expense.find({isOffline: true})` | `/api/admin/offline-expenses` |
| **Online Expenses** | `expenses` | `isOffline: false` | `Expense.find({isOffline: false})` | `/api/expenses` |
| **Daily Transactions** | `expenses` | Any | `Expense.find({})` | `/api/expenses` |

---

**Status**: All data properly segregated, but Finance API needs updating to include offline sources.
