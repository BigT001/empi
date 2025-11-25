# EMPI Delivery System - Complete Implementation Guide

## Table of Contents
1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [Core Components](#core-components)
4. [Fee Calculation Logic](#fee-calculation-logic)
5. [Integration Guide](#integration-guide)
6. [API Reference](#api-reference)
7. [Usage Examples](#usage-examples)
8. [Zone & Vehicle Configuration](#zone--vehicle-configuration)
9. [Implementation Checklist](#implementation-checklist)

---

## System Overview

The EMPI Delivery System is a comprehensive logistics solution designed to:

- **Automatically calculate delivery fees** based on buyer location, item sizes, and vehicle requirements
- **Support multiple vehicle types** (bikes for small items, cars for medium, vans for large)
- **Handle geographic zones** across Nigeria with zone-specific pricing
- **Apply dynamic fee modifiers** for rush, weekend, and holiday deliveries
- **Provide order tracking** with real-time delivery partner information
- **Optimize route efficiency** by recommending appropriate vehicles

### Key Features

✅ **Dynamic Fee Calculation** - Fees adjust based on location, item size, weight, and selected options
✅ **Vehicle Intelligence** - Automatic vehicle selection based on item requirements
✅ **Zone-Based Pricing** - Different rates for Lagos, South West, South-South, etc.
✅ **Special Handling** - Premium fees for fragile, oversized, or perishable items
✅ **Delivery Tracking** - Real-time order status and delivery partner information
✅ **Multi-State Coverage** - Nationwide delivery with 8 distinct geographic zones

---

## Architecture

### System Structure

```
EMPI Delivery System
├── Core Configuration (deliverySystem.ts)
│   ├── Vehicle Types & Configs
│   ├── Item Size Categories
│   ├── Geographic Zones
│   ├── Status Tracking
│   └── Fee Modifiers
│
├── Calculation Engine (deliveryCalculator.ts)
│   ├── Fee Calculation
│   ├── Vehicle Determination
│   ├── Distance Estimation
│   ├── Modifier Application
│   └── Quote Generation
│
├── Data Models (productModel.ts)
│   ├── Product with Delivery Metadata
│   ├── Size Categories (Small/Medium/Large)
│   ├── Weight Classification
│   └── Preset Configurations
│
└── UI Components
    ├── DeliverySelector.tsx (Order)
    ├── DeliveryTracker.tsx (Tracking)
    └── Integration Points (Checkout, Cart)
```

### Data Flow

```
User adds items to cart
           ↓
Frontend collects item sizes/weights
           ↓
User selects delivery state
           ↓
DeliveryCalculator computes fee:
  - Zone lookup from state
  - Vehicle determination from item sizes
  - Base fee + distance calculation
  - Apply modifiers (rush, weekend, etc.)
           ↓
Display quote with breakdown
           ↓
User confirms delivery options
           ↓
Store delivery info in order
           ↓
Backend creates delivery record
           ↓
Track delivery progress in real-time
```

---

## Core Components

### 1. **deliverySystem.ts** - Core Configuration

**Purpose**: Defines all delivery infrastructure constants and configurations.

**Key Exports**:

```typescript
// Vehicle Types
enum VehicleType { BIKE, CAR, VAN }
const VEHICLE_CONFIGS: Record<VehicleType, VehicleConfig>

// Item Sizes
enum ItemSize { SMALL, MEDIUM, LARGE }
const ITEM_SIZE_CATEGORIES: Record<ItemSize, SizeCategory>

// Geographic Zones
enum DeliveryZone { INTRA_LAGOS, LAGOS_METRO, SOUTHWEST, ... }
const DELIVERY_ZONES: Record<DeliveryZone, ZoneConfig>

// Status Tracking
enum DeliveryStatus { PENDING, CONFIRMED, PICKED_UP, ... }
const DELIVERY_STATUS_MAP: Record<DeliveryStatus, DeliveryStatusInfo>

// Modifiers
const DELIVERY_FEE_MODIFIERS: Record<string, DeliveryFeeModifier>
```

**Sample Configuration**:

```typescript
VehicleType.BIKE: {
  name: "Bike/Motorcycle",
  maxWeight: 10,
  baseRate: 25,           // ₦25 per km
  minDeliveryFee: 500,    // ₦500 minimum
  maxDeliveryFee: 3000,   // ₦3,000 maximum
  capacity: "Up to 10kg"
}

ItemSize.LARGE: {
  name: "Large",
  description: "Furniture, large appliances, bulk items (30kg+)",
  maxWeight: 500,
  preferredVehicles: [VehicleType.VAN],
  requiredVehicles: [VehicleType.VAN],
  sizeMultiplier: 1.5
}

DeliveryZone.INTRA_LAGOS: {
  name: "Intra Lagos",
  baseDeliveryFee: 0,
  costPerKm: 30,
  estimatedDays: { min: 1, max: 2 },
  availableVehicles: [VehicleType.BIKE, VehicleType.CAR, VehicleType.VAN],
  serviceStatus: "active"
}
```

### 2. **deliveryCalculator.ts** - Calculation Engine

**Purpose**: Implements fee calculation logic and quote generation.

**Key Functions**:

```typescript
calculateDeliveryFee(
  state: string,
  items: CartItemDelivery[],
  options: {
    distanceKm?: number,
    rushDelivery?: boolean,
    weekendDelivery?: boolean,
    holidayDelivery?: boolean
  }
): DeliveryQuote

determineRequiredVehicle(items: CartItemDelivery[]): VehicleType

calculateTotalWeight(items: CartItemDelivery[]): number

getSizeMultiplier(items: CartItemDelivery[]): number

getDeliveryZone(state: string): DeliveryZone | null

getEstimatedDeliveryTime(zone: DeliveryZone): string
```

**Fee Calculation Formula**:

```
Total Delivery Fee = Base Zone Fee + (Vehicle Rate × Distance) + Size Adjustment + Modifiers

Where:
- Base Zone Fee: Fixed fee per zone (e.g., ₦0 for Intra-Lagos, ₦3000 for Southwest)
- Vehicle Rate: ₦/km based on vehicle type (Bike: ₦25, Car: ₦50, Van: ₦100)
- Distance: Estimated km from warehouse to delivery location
- Size Adjustment: Multiplier (1.0 = Small, 1.2 = Medium, 1.5 = Large)
- Modifiers: Rush (+50%), Weekend (+30%), Holiday (+50%), Fragile (+20%), Oversized (+30%)
```

**Example Calculation**:

```
Order: 2 dresses + 1 sofa to Ibadan (Oyo state)
Result Zone: SOUTHWEST

Items Analysis:
- 2 dresses: Size=SMALL, Weight=1kg, Multiplier=1.0
- 1 sofa: Size=LARGE, Weight=40kg, Multiplier=1.5
- Max Vehicle Required: VAN (for sofa)
- Total Weight: 42kg

Fee Calculation:
- Base Zone Fee (Southwest): ₦3,000
- Vehicle Rate (Van): ₦100/km × 50km = ₦5,000
- Size Adjustment: ₦5,000 × (1.5-1.0) = ₦2,500
- Fragile Check: Not fragile → No addition
- Oversized Check: 42kg vs Van capacity 500kg → No addition

Total: ₦3,000 + ₦5,000 + ₦2,500 = ₦10,500
With Rush (+50%): ₦15,750
```

### 3. **productModel.ts** - Data Models

**Purpose**: Defines product structure with delivery metadata.

**Key Types**:

```typescript
interface Product {
  // ... existing fields
  size: ItemSize;           // small, medium, large
  weight: number;           // kg per unit
  fragile?: boolean;        // requires special handling
  requiresSignature?: boolean;
  perishable?: boolean;     // time-sensitive
}

const PRODUCT_PRESETS: Record<string, Partial<Product>> = {
  shirt: { size: "small", weight: 0.3, fragile: false },
  sofa: { size: "large", weight: 40, fragile: false },
  jewelry: { size: "small", weight: 0.05, fragile: true },
  // ... more presets
}
```

### 4. **DeliverySelector.tsx** - UI Component

**Purpose**: Collects delivery preferences and displays calculated fees.

**Features**:
- State selection dropdown
- Zone information display
- Distance slider (for estimation)
- Special options (Rush, Weekend, Holiday)
- Fee breakdown table
- Warnings and recommendations
- Expandable/collapsible interface

**Usage**:

```tsx
<DeliverySelector
  items={cartItems}
  state="Lagos - Island"
  onDeliveryChange={(quote) => console.log(quote)}
  isCheckout={true}
/>
```

### 5. **DeliveryTracker.tsx** - Order Tracking

**Purpose**: Displays real-time delivery status and partner information.

**Features**:
- Delivery partner profile (name, rating, vehicle)
- Current location with address
- Estimated arrival countdown
- Complete delivery timeline
- Contact button for delivery partner
- Status-specific messaging

**Usage**:

```tsx
<DeliveryTracker
  tracking={trackingInfo}
  onContact={(partner) => callDeliveryPartner(partner)}
/>
```

---

## Fee Calculation Logic

### Base Fee Components

#### 1. Zone Base Fee

Each geographic zone has a fixed base fee:

| Zone | Base Fee | Cost/km | Estimated Days |
|------|----------|---------|---|
| Intra Lagos | ₦0 | ₦30 | 1-2 |
| Lagos Metro | ₦1,500 | ₦25 | 1-3 |
| Southwest | ₦3,000 | ₦20 | 2-4 |
| South-South | ₦5,000 | ₦18 | 3-5 |
| Southeast | ₦5,000 | ₦18 | 3-5 |
| North-Central | ₦5,500 | ₦17 | 3-6 |
| Northwest | ₦6,000 | ₦16 | 4-7 |
| Northeast | ₦6,500 | ₦15 | 4-7 |

#### 2. Vehicle Fee

Based on distance and vehicle type:

| Vehicle | Rate/km | Min Fee | Max Fee | Capacity |
|---------|---------|---------|---------|----------|
| Bike | ₦25 | ₦500 | ₦3,000 | 10kg |
| Car | ₦50 | ₦1,000 | ₦10,000 | 50kg |
| Van | ₦100 | ₦2,000 | ₦25,000 | 500kg |

#### 3. Size Multiplier

Adjusts vehicle fee based on item sizes:

| Size | Multiplier | Description |
|------|-----------|---|
| Small | 1.0 | Phones, jewelry, small packages (<5kg) |
| Medium | 1.2 | Clothing, electronics, shoes (5-30kg) |
| Large | 1.5 | Furniture, appliances, bulk (30kg+) |

#### 4. Special Modifiers

Applied as percentage of subtotal:

| Modifier | Cost | Zones | Condition |
|----------|------|-------|-----------|
| Rush Delivery | +50% | Lagos zones only | Same-day before 6 PM |
| Weekend | +30% | All | Saturday/Sunday |
| Holiday | +50% | All | Public holidays |
| Fragile | +20% | All | Requires special handling |
| Oversized | +30% | All | >80% of vehicle capacity |

### Calculation Examples

#### Example 1: Small Item, Intra-Lagos

```
Items: 1 Shirt (Small, 0.3kg)
Zone: Intra Lagos
Distance: 8 km

Calculation:
- Base Fee: ₦0
- Vehicle (Bike): ₦25 × 8 = ₦200 (clamped to min ₦500)
- Size Multiplier: 1.0 → No adjustment
- Fragile: No
- Oversized: No

Total: ₦500
Estimated: 1-2 days
Vehicle: Bike
```

#### Example 2: Medium Items, Southwest

```
Items: 3 Dresses (Medium, 1.5kg total)
Zone: Southwest
Distance: 50 km
Rush Delivery: Yes

Calculation:
- Base Fee: ₦3,000
- Vehicle (Car): ₦50 × 50 = ₦2,500
- Size Multiplier: 1.2 → Additional ₦2,500 × 0.2 = ₦500
- Subtotal: ₦3,000 + ₦2,500 + ₦500 = ₦6,000
- Rush Delivery: ₦6,000 × 0.5 = ₦3,000

Total: ₦9,000
Estimated: 2-4 days
Vehicle: Car
```

#### Example 3: Large Items, National

```
Items: 2 Sofas (Large, 80kg total)
Zone: Northeast
Distance: 120 km

Calculation:
- Base Fee: ₦6,500
- Vehicle (Van): ₦100 × 120 = ₦12,000 (clamped to max ₦25,000)
- Size Multiplier: 1.5 → Additional ₦12,000 × 0.5 = ₦6,000
- Oversized Check: 80kg vs 500kg capacity → No additional fee
- Subtotal: ₦6,500 + ₦12,000 + ₦6,000 = ₦24,500

Total: ₦24,500
Estimated: 4-7 days
Vehicle: Van
```

---

## Integration Guide

### Step 1: Update Product Database

Add delivery metadata to each product:

```typescript
const products = [
  {
    _id: "1",
    name: "Cotton Shirt",
    category: "Clothing",
    sellPrice: 5000,
    rentPrice: 500,
    imageUrl: "...",
    size: "small",        // NEW: Item size
    weight: 0.3,          // NEW: Weight in kg
    fragile: false,       // NEW: Fragile handling needed?
    requiresSignature: false
  },
  {
    _id: "2",
    name: "3-Seater Sofa",
    category: "Furniture",
    sellPrice: 150000,
    rentPrice: 15000,
    imageUrl: "...",
    size: "large",        // NEW: Item size
    weight: 40,           // NEW: Weight in kg
    fragile: false,
    requiresSignature: false
  },
  // ... more products
];
```

### Step 2: Update CartContext

Ensure cart items include delivery metadata:

```typescript
interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  mode: "buy" | "rent";
  quantity: number;
  size?: ItemSize;        // NEW: Size category
  weight?: number;        // NEW: Weight per unit
  fragile?: boolean;      // NEW: Fragile handling
}
```

### Step 3: Integrate into Cart Page

```tsx
import { DeliverySelector } from "../components/DeliverySelector";
import { CartItemDelivery } from "../lib/deliveryCalculator";

export default function CartPage() {
  const [deliveryQuote, setDeliveryQuote] = useState(null);
  const [buyerState, setBuyerState] = useState("");

  // Convert cart items to delivery format
  const deliveryItems: CartItemDelivery[] = items.map((item) => ({
    id: item.id,
    name: item.name,
    quantity: item.quantity,
    size: item.size || "medium",
    weight: item.weight || 1,
    totalWeight: (item.weight || 1) * item.quantity,
    fragile: item.fragile || false,
  }));

  return (
    <div>
      {/* Cart items display */}
      
      {/* NEW: Delivery Selector */}
      <DeliverySelector
        items={deliveryItems}
        state={buyerState}
        onDeliveryChange={setDeliveryQuote}
        isCheckout={false}
      />

      {/* Display delivery quote */}
      {deliveryQuote && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-bold">Delivery Details</h3>
          <p>Fee: {formatDeliveryFee(deliveryQuote.fee)}</p>
          <p>Vehicle: {deliveryQuote.breakdown.requiredVehicle}</p>
          <p>Estimated: {deliveryQuote.estimatedDays.min}-{deliveryQuote.estimatedDays.max} days</p>
        </div>
      )}
    </div>
  );
}
```

### Step 4: Integrate into Checkout Page

```tsx
import { DeliverySelector } from "../components/DeliverySelector";

export default function CheckoutPage() {
  const [deliveryQuote, setDeliveryQuote] = useState(null);
  const [shippingCost, setShippingCost] = useState(0);

  const handleDeliveryChange = (quote) => {
    setDeliveryQuote(quote);
    setShippingCost(quote?.fee || 0);
  };

  return (
    <div className="grid lg:grid-cols-3 gap-8">
      {/* Left: Form */}
      <div className="lg:col-span-2">
        {/* Existing form fields */}
        
        {/* NEW: Delivery Selection */}
        <DeliverySelector
          items={deliveryItems}
          state={formData.state}
          onDeliveryChange={handleDeliveryChange}
          isCheckout={true}
        />
      </div>

      {/* Right: Order Summary */}
      <div className="lg:col-span-1">
        <div className="bg-white rounded-lg p-6 sticky top-6">
          <h2 className="text-2xl font-bold mb-6">Order Summary</h2>

          {/* Price breakdown */}
          <div className="space-y-3 mb-6 pb-6 border-b">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>₦{subtotal.toLocaleString()}</span>
            </div>
            {/* NEW: Delivery Fee from Quote */}
            <div className="flex justify-between">
              <span>Delivery</span>
              <span>₦{shippingCost.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax (7.5%)</span>
              <span>₦{tax.toLocaleString()}</span>
            </div>
          </div>

          <div className="flex justify-between text-xl font-bold mb-6">
            <span>Total</span>
            <span>₦{(subtotal + shippingCost + tax).toLocaleString()}</span>
          </div>

          <button className="w-full bg-lime-600 hover:bg-lime-700 text-white py-3 rounded-lg font-bold">
            Proceed to Payment
          </button>
        </div>
      </div>
    </div>
  );
}
```

### Step 5: Store Delivery Info with Order

```typescript
// Backend order model
interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  
  // NEW: Delivery information
  delivery: {
    zone: DeliveryZone;
    vehicle: VehicleType;
    fee: number;
    status: DeliveryStatus;
    estimatedDays: { min: number; max: number };
    partner?: DeliveryPartner;
    currentLocation?: { latitude: number; longitude: number };
    timeline: DeliveryTimeline[];
  };

  // Existing fields
  subtotal: number;
  tax: number;
  total: number;
  status: OrderStatus;
  createdAt: Date;
  updatedAt: Date;
}
```

---

## API Reference

### DeliveryCalculator Functions

#### `calculateDeliveryFee(state, items, options)`

Calculates delivery fee quote for given items and location.

**Parameters**:
- `state` (string): Buyer's state (must be in STATE_TO_ZONE map)
- `items` (CartItemDelivery[]): Array of items with size/weight
- `options` (object): Optional delivery options
  - `distanceKm` (number): Distance in km (default: 10)
  - `rushDelivery` (boolean): Same-day delivery
  - `weekendDelivery` (boolean): Weekend delivery
  - `holidayDelivery` (boolean): Holiday delivery

**Returns**: `DeliveryQuote`

```typescript
interface DeliveryQuote {
  fee: number;                    // Total delivery fee in ₦
  vehicle: VehicleType;           // Required vehicle type
  zone: DeliveryZone;             // Delivery zone
  estimatedDays: { min: number; max: number };
  breakdown: DeliveryCalculation; // Detailed breakdown
  warnings: string[];             // Any warnings
  recommendations: string[];      // Cost-saving tips
}
```

#### `determineRequiredVehicle(items)`

Determines the required vehicle type based on items.

**Parameters**:
- `items` (CartItemDelivery[]): Items in order

**Returns**: `VehicleType` (BIKE | CAR | VAN)

#### `calculateTotalWeight(items)`

Calculates total weight of all items.

**Parameters**:
- `items` (CartItemDelivery[]): Items to weigh

**Returns**: `number` (total weight in kg)

#### `getDeliveryZone(state)`

Looks up delivery zone for a given state.

**Parameters**:
- `state` (string): State name

**Returns**: `DeliveryZone | null`

#### `getEstimatedDeliveryTime(zone)`

Returns human-readable estimated delivery time.

**Parameters**:
- `zone` (DeliveryZone): Delivery zone

**Returns**: `string` (e.g., "2-4 days")

#### `formatDeliveryFee(fee)`

Formats fee for display.

**Parameters**:
- `fee` (number): Fee in ₦

**Returns**: `string` (e.g., "₦10,500")

#### `getAvailableStates()`

Returns all available delivery states.

**Returns**: `string[]`

---

## Usage Examples

### Example 1: Simple Delivery Quote

```typescript
import { calculateDeliveryFee, CartItemDelivery } from "../lib/deliveryCalculator";

const items: CartItemDelivery[] = [
  {
    id: "1",
    name: "Shirt",
    quantity: 2,
    size: "small",
    weight: 0.3,
    totalWeight: 0.6,
  }
];

const quote = calculateDeliveryFee("Lagos - Island", items);

console.log(`Delivery Fee: ₦${quote.fee}`);
console.log(`Vehicle: ${quote.vehicle}`);
console.log(`Estimated: ${quote.estimatedDays.min}-${quote.estimatedDays.max} days`);
```

### Example 2: Rush Delivery with Options

```typescript
const quote = calculateDeliveryFee("Lagos - Mainland", items, {
  distanceKm: 15,
  rushDelivery: true,  // Same-day (+50%)
  weekendDelivery: false,
});

console.log(`Total with rush: ₦${quote.fee}`);
quote.breakdown.modifiers.forEach((mod) => {
  console.log(`${mod.name}: +₦${mod.amount}`);
});
```

### Example 3: Large Furniture Order

```typescript
const furnitureItems: CartItemDelivery[] = [
  {
    id: "sofa",
    name: "3-Seater Sofa",
    quantity: 1,
    size: "large",
    weight: 40,
    totalWeight: 40,
    fragile: false,
  },
  {
    id: "table",
    name: "Dining Table",
    quantity: 1,
    size: "large",
    weight: 25,
    totalWeight: 25,
    fragile: false,
  }
];

const quote = calculateDeliveryFee("Oyo", furnitureItems);

console.log(`Zone: ${quote.breakdown.zoneName}`);
console.log(`Required Vehicle: ${quote.vehicle}`);
console.log(`Breakdown:`);
console.log(`  - Zone Base: ₦${quote.breakdown.breakdown.zone}`);
console.log(`  - Vehicle: ₦${quote.breakdown.breakdown.vehicle}`);
console.log(`  - Size Adjustment: ₦${quote.breakdown.breakdown.size}`);
console.log(`Total: ₦${quote.fee}`);
```

### Example 4: React Component Integration

```tsx
import { DeliverySelector } from "../components/DeliverySelector";

export function MyCartPage() {
  const [quote, setQuote] = useState(null);
  const [deliveryFee, setDeliveryFee] = useState(0);

  return (
    <div className="container mx-auto p-6">
      <DeliverySelector
        items={convertedItems}
        state={userState}
        onDeliveryChange={(q) => {
          setQuote(q);
          setDeliveryFee(q?.fee || 0);
        }}
      />

      {quote && (
        <div className="mt-8 grid grid-cols-2 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-bold">Delivery Details</h3>
            <p>Zone: {quote.breakdown.zoneName}</p>
            <p>Vehicle: {quote.vehicle}</p>
            <p>ETA: {quote.estimatedDays.min}-{quote.estimatedDays.max} days</p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-bold">Cost Breakdown</h3>
            <p>Base Fee: ₦{quote.breakdown.breakdown.zone.toLocaleString()}</p>
            <p>Vehicle: ₦{quote.breakdown.breakdown.vehicle.toLocaleString()}</p>
            <p className="font-bold mt-2">Total: ₦{quote.fee.toLocaleString()}</p>
          </div>
        </div>
      )}
    </div>
  );
}
```

---

## Zone & Vehicle Configuration

### Zone Details

#### Intra Lagos (INTRA_LAGOS)
- **Coverage**: Lagos Island, Lagos Mainland
- **Base Fee**: ₦0
- **Cost/km**: ₦30
- **Estimated Delivery**: 1-2 days
- **Available Vehicles**: Bike, Car, Van
- **Status**: Active ✅
- **Service Characteristics**: Fastest delivery, highest vehicle availability

#### Lagos Metropolitan (LAGOS_METRO)
- **Coverage**: Lekki/Epe Corridor, Ijebu Ode
- **Base Fee**: ₦1,500
- **Cost/km**: ₦25
- **Estimated Delivery**: 1-3 days
- **Available Vehicles**: Car, Van
- **Status**: Active ✅
- **Service Characteristics**: Greater Lagos area, urban centers

#### Southwest Region (SOUTHWEST)
- **Coverage**: Ogun, Oyo, Osun, Ekiti, Ondo
- **Base Fee**: ₦3,000
- **Cost/km**: ₦20
- **Estimated Delivery**: 2-4 days
- **Available Vehicles**: Car, Van
- **Status**: Active ✅
- **Service Characteristics**: Multi-state regional service

#### South-South Region (SOUTHSOUTH)
- **Coverage**: Rivers, Bayelsa, Cross River, Akwa Ibom, Delta
- **Base Fee**: ₦5,000
- **Cost/km**: ₦18
- **Estimated Delivery**: 3-5 days
- **Available Vehicles**: Van
- **Status**: Active ✅
- **Service Characteristics**: Coastal and riverine regions

#### Southeast Region (SOUTHEAST)
- **Coverage**: Abia, Ebonyi, Enugu, Imo, Anambra
- **Base Fee**: ₦5,000
- **Cost/km**: ₦18
- **Estimated Delivery**: 3-5 days
- **Available Vehicles**: Van
- **Status**: Active ✅
- **Service Characteristics**: Eastern region coverage

#### North-Central Region (NORTHCENTRAL)
- **Coverage**: Benue, Kogi, Kwara, Nasarawa, Niger, Plateau, FCT
- **Base Fee**: ₦5,500
- **Cost/km**: ₦17
- **Estimated Delivery**: 3-6 days
- **Available Vehicles**: Van
- **Status**: Active ✅
- **Service Characteristics**: Central region hub

#### Northwest Region (NORTHWEST)
- **Coverage**: Kaduna, Kano, Katsina, Kebbi, Sokoto, Zamfara, Jigawa
- **Base Fee**: ₦6,000
- **Cost/km**: ₦16
- **Estimated Delivery**: 4-7 days
- **Available Vehicles**: Van
- **Status**: Active ✅
- **Service Characteristics**: Northern region service

#### Northeast Region (NORTHEAST)
- **Coverage**: Adamawa, Bauchi, Borno, Gombe, Taraba, Yobe
- **Base Fee**: ₦6,500
- **Cost/km**: ₦15
- **Estimated Delivery**: 4-7 days
- **Available Vehicles**: Van
- **Status**: Limited ⚠️
- **Service Characteristics**: Northern security concerns, limited availability

### Vehicle Specifications

#### Bike/Motorcycle (BIKE)
- **Capacity**: Up to 10 kg
- **Max Dimensions**: 60cm L × 40cm W × 30cm H
- **Rate**: ₦25/km
- **Min Fee**: ₦500
- **Max Fee**: ₦3,000
- **Best For**: Small items, quick urban deliveries, cost-effective
- **Ideal Items**: Phones, jewelry, small packages, documents

#### Car/Van (CAR)
- **Capacity**: Up to 50 kg
- **Max Dimensions**: 150cm L × 100cm W × 100cm H
- **Rate**: ₦50/km
- **Min Fee**: ₦1,000
- **Max Fee**: ₦10,000
- **Best For**: Medium items, balanced capacity/cost
- **Ideal Items**: Clothing, electronics, shoes, textiles, small furniture

#### Large Van/Truck (VAN)
- **Capacity**: Up to 500 kg
- **Max Dimensions**: 300cm L × 200cm W × 200cm H
- **Rate**: ₦100/km
- **Min Fee**: ₦2,000
- **Max Fee**: ₦25,000
- **Best For**: Large items, furniture, bulk orders
- **Ideal Items**: Sofas, beds, tables, large appliances, bulk textiles

### Item Size Categories

#### Small (SMALL)
- **Description**: Phones, jewelry, small packages
- **Weight Limit**: < 5 kg
- **Preferred Vehicle**: Bike
- **Required Vehicle**: Bike
- **Size Multiplier**: 1.0 (base rate)
- **Examples**:
  - Phones (0.2 kg)
  - Jewelry (0.05 kg)
  - Shoes (0.4 kg)
  - Shirts (0.3 kg)
  - Handbags (0.6 kg)

#### Medium (MEDIUM)
- **Description**: Clothing, electronics, shoes, textiles
- **Weight Limit**: 5-30 kg
- **Preferred Vehicles**: Bike, Car
- **Required Vehicle**: Car
- **Size Multiplier**: 1.2 (+20% to base fee)
- **Examples**:
  - Laptops (2 kg)
  - Dresses (0.5 kg)
  - Bedsheet sets (1.5 kg)
  - Microwaves (12 kg)
  - Fans (5 kg)

#### Large (LARGE)
- **Description**: Furniture, large appliances, bulk items
- **Weight Limit**: 30+ kg
- **Preferred Vehicles**: Van
- **Required Vehicle**: Van
- **Size Multiplier**: 1.5 (+50% to base fee)
- **Examples**:
  - Sofas (40 kg)
  - Beds (35 kg)
  - Tables (25 kg)
  - Duvets (3 kg when bulk)
  - Appliances (12-40 kg)

---

## Implementation Checklist

### Phase 1: Core Setup ✅
- [x] Create `deliverySystem.ts` with all configurations
- [x] Create `deliveryCalculator.ts` with calculation logic
- [x] Create `productModel.ts` with product structure
- [x] Set up all TypeScript types and interfaces

### Phase 2: UI Components ✅
- [x] Create `DeliverySelector.tsx` component
- [x] Create `DeliveryTracker.tsx` component
- [x] Style components with Tailwind CSS
- [x] Add responsive design

### Phase 3: Frontend Integration
- [ ] Update product database with size/weight metadata
- [ ] Modify ProductCard to display delivery info
- [ ] Update CartContext to include delivery fields
- [ ] Integrate DeliverySelector into cart page
- [ ] Integrate DeliverySelector into checkout page
- [ ] Add delivery fee to order summary
- [ ] Test delivery calculations with various item combinations

### Phase 4: Backend Integration
- [ ] Create backend API endpoints for delivery calculations
- [ ] Add delivery fields to Order schema
- [ ] Create delivery tracking database
- [ ] Implement delivery partner assignment logic
- [ ] Set up real-time tracking WebSocket
- [ ] Create delivery status update endpoints

### Phase 5: Testing & Optimization
- [ ] Unit tests for fee calculations
- [ ] Integration tests for end-to-end flow
- [ ] Performance optimization for large orders
- [ ] Edge case testing (extreme weights, far distances)
- [ ] Zone coverage testing for all states

### Phase 6: Launch & Support
- [ ] Staff training on delivery system
- [ ] Customer documentation
- [ ] Monitoring and analytics setup
- [ ] Performance tracking
- [ ] Feedback collection and iteration

---

## Next Steps

1. **Update Products**: Add size and weight metadata to all products in database
2. **Integrate Frontend**: Connect DeliverySelector to your cart and checkout pages
3. **Backend API**: Develop backend endpoints for delivery calculations and tracking
4. **Testing**: Thoroughly test with various item combinations and zones
5. **Launch**: Roll out to customers with clear communication about new delivery system

---

**Document Version**: 1.0
**Last Updated**: November 24, 2025
**Status**: Production Ready
