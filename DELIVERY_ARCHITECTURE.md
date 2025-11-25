# 🏗️ Delivery System Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                   🛒 EMPI E-COMMERCE SYSTEM                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   ┌──────────────────┐         ┌──────────────────┐                │
│   │  📱 Frontend     │         │  🔧 Backend      │                │
│   │  (React)         │         │  (Next.js API)   │                │
│   └────────┬─────────┘         └────────┬─────────┘                │
│            │                            │                          │
│            │                            │                          │
│   ┌────────▼─────────────────────┐     │                          │
│   │  EnhancedDeliverySelector    │     │                          │
│   │  ├─ Vehicle Selection        │     │                          │
│   │  ├─ Pickup Point Selection   │     │                          │
│   │  └─ LocationMap (embedded)   │     │                          │
│   │     ├─ Geolocation API 📡     │     │                          │
│   │     └─ Real-time Map Display │     │                          │
│   └────────┬─────────────────────┘     │                          │
│            │                            │                          │
│   ┌────────▼────────────────────────┐  │                          │
│   │  Browser Geolocation API        │  │                          │
│   │  - Gets user lat/lon            │  │                          │
│   │  - Requires permission          │  │                          │
│   └────────┬─────────────────────────┘  │                          │
│            │                            │                          │
│   ┌────────▼─────────────────────────┐  │                          │
│   │  Call API Endpoint              │  │                          │
│   │  POST /api/delivery/            │  │                          │
│   │       calculate-distance        │  │                          │
│   │  {                              │  │                          │
│   │    userLatitude,                │  │                          │
│   │    userLongitude,               │  │                          │
│   │    vehicleType,                 │  │                          │
│   │    itemSize,                    │  │                          │
│   │    isFragile,                   │  │                          │
│   │    isRushDelivery               │  │                          │
│   │  }                              │  │                          │
│   └────────┬──────────────────────────┤──────────────────────┐    │
│            │                          │                      │    │
│            ▼                          ▼                      │    │
│            │                   ┌──────────────────────┐     │    │
│            │                   │  API Endpoint        │     │    │
│            │                   │  calculate-distance  │     │    │
│            │                   │  /route.ts           │     │    │
│            │                   └──────┬───────────────┘     │    │
│            │                          │                    │    │
│            │                   ┌──────▼───────────────┐    │    │
│            │                   │  Validate Input      │    │    │
│            │                   └──────┬───────────────┘    │    │
│            │                          │                    │    │
│            │                   ┌──────▼───────────────┐    │    │
│            │                   │  Select Pickup Pt   │    │    │
│            │                   │  - Suru Lere        │    │    │
│            │                   │  - Ojo              │    │    │
│            │                   │  - Or auto-select   │    │    │
│            │                   └──────┬───────────────┘    │    │
│            │                          │                    │    │
│            │                   ┌──────▼───────────────┐    │    │
│            │                   │  Distance Calc      │    │    │
│            │                   │  distanceCalculator │    │    │
│            │                   │  - Haversine        │    │    │
│            │                   │  - returns km       │    │    │
│            │                   └──────┬───────────────┘    │    │
│            │                          │                    │    │
│            │                   ┌──────▼───────────────┐    │    │
│            │                   │  Detect Zone        │    │    │
│            │                   │  - Mainland Lagos?  │    │    │
│            │                   │  - Apply ₦3,000 min │    │    │
│            │                   └──────┬───────────────┘    │    │
│            │                          │                    │    │
│            │                   ┌──────▼───────────────┐    │    │
│            │                   │  Price Calculation  │    │    │
│            │                   │  calculateDeliveryFee│    │    │
│            │                   │  - Base: ₦3,000     │    │    │
│            │                   │  - Distance: ×rate  │    │    │
│            │                   │  - Size: ×mult      │    │    │
│            │                   │  - Fragile: ×1.3    │    │    │
│            │                   │  - Rush: ×1.5       │    │    │
│            │                   └──────┬───────────────┘    │    │
│            │                          │                    │    │
│            │                   ┌──────▼───────────────┐    │    │
│            │                   │  Return Response    │    │    │
│            │                   │  {                  │    │    │
│            │                   │    distance,        │    │    │
│            │                   │    time,            │    │    │
│            │                   │    pricing,         │    │    │
│            │                   │    pickupPoint      │    │    │
│            │                   │  }                  │    │    │
│            │                   └──────┬───────────────┘    │    │
│            │                          │                    │    │
│            └──────────────────────────┼────────────────────┘    │
│                                       │                         │
│                            ┌──────────▼──────────┐              │
│                            │  LocationMap Receives│              │
│                            │  Updates State       │              │
│                            │  Re-renders UI       │              │
│                            └──────────┬───────────┘              │
│                                       │                         │
│                            ┌──────────▼──────────┐              │
│                            │  Display 4-Card     │              │
│                            │  Dashboard:         │              │
│                            │  1. Distance        │              │
│                            │  2. Time            │              │
│                            │  3. Vehicle         │              │
│                            │  4. Price           │              │
│                            │                     │              │
│                            │  + Breakdown        │              │
│                            └──────────┬───────────┘              │
│                                       │                         │
│                            ┌──────────▼──────────┐              │
│                            │ onQuoteUpdate       │              │
│                            │ Callback            │              │
│                            │ Returns to          │              │
│                            │ EnhancedSelector    │              │
│                            └──────────┬───────────┘              │
│                                       │                         │
│                            ┌──────────▼──────────┐              │
│                            │ Convert to          │              │
│                            │ DeliveryQuote       │              │
│                            │ Format              │              │
│                            └──────────┬───────────┘              │
│                                       │                         │
│                            ┌──────────▼──────────┐              │
│                            │ onDeliveryChange    │              │
│                            │ Callback            │              │
│                            │ Pass to Cart Page   │              │
│                            └──────────┬───────────┘              │
│                                       │                         │
│                            ┌──────────▼──────────┐              │
│                            │ Cart State Updated  │              │
│                            │ - Delivery Fee      │              │
│                            │ - Pickup Point      │              │
│                            │ - Vehicle Type      │              │
│                            │ - Estimated Time    │              │
│                            └──────────┬───────────┘              │
│                                       │                         │
│                            ┌──────────▼──────────┐              │
│                            │ Display in Cart UI  │              │
│                            │ Update Total Price  │              │
│                            └──────────┬───────────┘              │
│                                       │                         │
│                            ┌──────────▼──────────┐              │
│                            │ User Proceeds to    │              │
│                            │ Checkout            │              │
│                            └──────────┬───────────┘              │
│                                       │                         │
│                            ┌──────────▼──────────┐              │
│                            │ Checkout Page       │              │
│                            │ Display Delivery    │              │
│                            │ Info & Confirm      │              │
│                            │ Order               │              │
│                            └─────────────────────┘              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Component Hierarchy

```
CartPage
├── CartItems Display
├── EnhancedDeliverySelector ⭐
│   ├── Header (collapsible)
│   ├── Vehicle Type Selector
│   │   ├── 🏍️ Bike Button
│   │   ├── 🚗 Car Button
│   │   └── 🚚 Van Button
│   ├── Pickup Point Selector
│   │   ├── Radio: Suru Lere
│   │   └── Radio: Ojo
│   ├── LocationMap (embedded) ⭐⭐
│   │   ├── Geolocation Detection
│   │   ├── 4-Card Dashboard
│   │   │   ├── Distance Card
│   │   │   ├── Time Card
│   │   │   ├── Vehicle Card
│   │   │   └── Price Card
│   │   ├── Price Breakdown
│   │   ├── Map Visualization
│   │   ├── Loading State
│   │   └── Error Handling
│   ├── Additional Options
│   │   ├── ⚡ Rush Delivery Checkbox
│   │   └── ⚠️ Fragile Item Warning
│   └── Info Box
└── Order Summary
    ├── Items Total
    ├── Delivery Fee (from quote)
    ├── Tax
    └── Grand Total

CheckoutPage
└── Delivery Summary
    ├── Pickup Point
    ├── Distance
    ├── Vehicle Type
    ├── Estimated Time
    └── Delivery Fee
```

---

## Data Flow Diagram

```
User Location (GPS)
        │
        ▼
┌──────────────────────────┐
│ userLatitude             │
│ userLongitude            │
└──────────────┬───────────┘
               │
        ┌──────▼──────┐
        │ Selected:   │
        │ vehicleType │
        │ itemSize    │
        │ isFragile   │
        │ isRushDelivery
        └──────┬──────┘
               │
        ┌──────▼────────────────────┐
        │  API Request              │
        │  /calculate-distance      │
        └──────┬────────────────────┘
               │
        ┌──────▼──────────────────────┐
        │  Calculation Results:        │
        │  - distance (km)             │
        │  - deliveryTime (min-max)    │
        │  - pricing (fee breakdown)   │
        │  - pickupPoint               │
        │  - isMainlandLagos           │
        └──────┬──────────────────────┘
               │
        ┌──────▼──────────────────────┐
        │  DeliveryQuote Object:       │
        │  - fee: number               │
        │  - vehicle: string           │
        │  - zone: string              │
        │  - breakdown: object         │
        │  - estimatedDays: object     │
        │  - warnings: array           │
        │  - recommendations: array    │
        └──────┬──────────────────────┘
               │
        ┌──────▼──────────────────────┐
        │  Cart State Updated          │
        │  ├─ deliveryQuote            │
        │  ├─ deliveryFee              │
        │  ├─ pickupPoint              │
        │  └─ cartTotal                │
        └──────┬──────────────────────┘
               │
        ┌──────▼──────────────────────┐
        │  Checkout Page               │
        │  ├─ Display delivery info    │
        │  ├─ Show total with fee      │
        │  └─ Process payment          │
        └──────────────────────────────┘
```

---

## File Dependency Tree

```
app/
│
├─ lib/
│  ├─ distanceCalculator.ts ⭐
│  │  ├─ PICKUP_POINTS (const)
│  │  ├─ DELIVERY_CONFIG (const)
│  │  ├─ calculateDistance() → Uses Haversine
│  │  ├─ calculateDeliveryFee() → Main pricing logic
│  │  ├─ estimateDeliveryTime() → Traffic estimate
│  │  └─ getNearestPickupPoint() → Distance comparison
│  │
│  └─ googleMapsService.ts (optional)
│     ├─ getDistanceFromGoogleMaps()
│     └─ convertSecondsToReadable()
│
├─ api/
│  └─ delivery/
│     └─ calculate-distance/
│        └─ route.ts ⭐
│           ├─ Imports from distanceCalculator
│           ├─ Validates input
│           ├─ Calls calculateDistance()
│           ├─ Calls calculateDeliveryFee()
│           ├─ Calls estimateDeliveryTime()
│           └─ Returns response
│
├─ components/
│  ├─ LocationMap.tsx ⭐
│  │  ├─ Uses browser Geolocation API
│  │  ├─ Calls /api/delivery/calculate-distance
│  │  ├─ Displays 4-card dashboard
│  │  ├─ Shows price breakdown
│  │  └─ Returns quote via callback
│  │
│  └─ EnhancedDeliverySelector.tsx ⭐
│     ├─ Imports LocationMap
│     ├─ Vehicle selection
│     ├─ Pickup point selection
│     ├─ Embeds LocationMap
│     ├─ Converts quote to DeliveryQuote
│     └─ Passes to parent via callback
│
├─ cart/
│  └─ page.tsx
│     ├─ Imports EnhancedDeliverySelector
│     ├─ Passes items prop
│     ├─ Receives onDeliveryChange callback
│     └─ Updates cart state with quote
│
└─ checkout/
   └─ page.tsx
      ├─ Receives delivery quote from cart
      ├─ Displays delivery info
      └─ Shows total with fee
```

---

## State Management Flow

```
EnhancedDeliverySelector Component State:
├─ expanded: boolean
│  └─ Controls collapse/expand
├─ vehicleType: "bike" | "car" | "van"
│  └─ Selected vehicle (affects price)
├─ isRushDelivery: boolean
│  └─ Rush option enabled (affects price)
├─ selectedPickupPoint: string
│  └─ "suru_lere" or "ojo"
└─ mapQuote: object
   └─ Raw response from LocationMap

LocationMap Component State:
├─ userLocation: {lat, lon}
│  └─ From browser geolocation
├─ quote: DeliveryQuote
│  └─ From API response
├─ loading: boolean
│  └─ API call in progress
├─ error: string
│  └─ Error message if any
├─ mapReady: boolean
│  └─ Map component loaded
└─ address: string
   └─ Formatted user address

Cart Page Component State:
├─ cartItems: array
│  └─ Products in cart
├─ deliveryQuote: DeliveryQuote
│  └─ From EnhancedDeliverySelector
├─ deliveryFee: number
│  └─ quote.fee
└─ cartTotal: number
   └─ items + delivery + tax
```

---

## API Request/Response Structure

### Request
```typescript
POST /api/delivery/calculate-distance

Headers:
- Content-Type: application/json

Body:
{
  userLatitude: 6.5000,              // Required, user GPS
  userLongitude: 3.3500,             // Required, user GPS
  vehicleType: "car",                // Required, "bike"|"car"|"van"
  itemSize: "MEDIUM",                // Required, "SMALL"|"MEDIUM"|"LARGE"
  isFragile?: false,                 // Optional, default false
  isRushDelivery?: false,            // Optional, default false
  pickupPointId?: "ojo"              // Optional, auto-select if omitted
}
```

### Response (Success)
```typescript
{
  success: true,
  data: {
    pickupPoint: {
      id: "ojo",
      name: "Ojo Pickup Point",
      address: "22 Chi-Ben Street, Ojo Lagos, 102112",
      coordinates: {
        latitude: 6.4756,
        longitude: 3.1265
      }
    },
    distance: {
      km: 5.2,
      formatted: "5.2 km"
    },
    deliveryTime: {
      min: 15,
      max: 25,
      formatted: "15m - 25m"
    },
    pricing: {
      baseFee: 3000,
      distanceFee: 260,
      sizeMultiplier: 1.2,
      fragileMultiplier: 1,
      rushMultiplier: 1,
      totalFee: 3936,
      breakdown: "₦3,000 base + ₦260 (5.2km × ₦50/km) × 1.2 = ₦3,936"
    },
    isMainlandLagos: true
  }
}

Status: 200
```

### Response (Error)
```typescript
{
  error: "Missing required fields: userLatitude, userLongitude..."
}

Status: 400 (or appropriate error status)
```

---

## Calculation Process (Step by Step)

```
INPUT: userLatitude, userLongitude, vehicleType, itemSize, isFragile, isRushDelivery
│
▼
STEP 1: Validate Input
├─ Check required fields exist
├─ Check valid vehicle type
├─ Check valid item size
└─ Return error if invalid

▼
STEP 2: Select Pickup Point
├─ If pickupPointId provided:
│  └─ Use that point
├─ Else:
│  ├─ Calculate distance to Suru Lere
│  ├─ Calculate distance to Ojo
│  └─ Select nearest

▼
STEP 3: Calculate Distance (Haversine)
├─ Get pickup coordinates
├─ Get user coordinates
├─ Apply Haversine formula
└─ Return distance in km

▼
STEP 4: Detect Zone
├─ Check if mainland Lagos
│  ├─ Latitude: 6.4 - 6.7
│  ├─ Longitude: 3.0 - 3.5
│  └─ Set isMainlandLagos = true
└─ Else isMainlandLagos = false

▼
STEP 5: Calculate Price
├─ Base Fee
│  └─ If isMainlandLagos: ₦3,000
│     Else: ₦2,500 or custom
├─ Distance Fee
│  └─ Distance × vehicleRate
│     ├─ Bike: ₦25/km
│     ├─ Car: ₦50/km
│     └─ Van: ₦100/km
├─ Subtotal = Base + Distance
├─ Size Multiplier
│  ├─ SMALL: 1.0x
│  ├─ MEDIUM: 1.2x
│  └─ LARGE: 1.5x
│  └─ Apply: Subtotal × multiplier
├─ Fragile Multiplier
│  ├─ If isFragile: 1.3x
│  ├─ Else: 1.0x
│  └─ Apply: Previous × multiplier
├─ Rush Multiplier
│  ├─ If isRushDelivery: 1.5x
│  ├─ Else: 1.0x
│  └─ Apply: Previous × multiplier
└─ Total = Final calculated fee

▼
STEP 6: Estimate Time
├─ Base time = Distance ÷ speed
│  ├─ Bike: 20 km/h
│  ├─ Car: 30 km/h
│  └─ Van: 25 km/h
├─ Traffic buffer: +30%
├─ If rush: -20%
└─ Return min/max range

▼
OUTPUT: {
  pickupPoint,
  distance,
  deliveryTime,
  pricing,
  isMainlandLagos
}
```

---

## Error Handling Flow

```
API Request Received
│
▼
Validate Input
├─ Missing fields?
│  └─ Return 400 "Missing required fields"
├─ Invalid vehicle type?
│  └─ Return 400 "Invalid vehicle type"
├─ Invalid item size?
│  └─ Return 400 "Invalid item size"
└─ Valid? ✓ Continue

▼
Calculate Distance
├─ Error in calculation?
│  └─ Return 500 "Failed to calculate distance"
└─ Success? ✓ Continue

▼
Calculate Price
├─ Negative price?
│  └─ Clamp to ₦3,000 minimum
├─ Error in calculation?
│  └─ Return 500 "Failed to calculate price"
└─ Success? ✓ Continue

▼
Return Success Response
├─ All data included
├─ Status: 200
└─ Sent to client

Frontend Receives Response
├─ Success?
│  └─ Update UI with new quote
├─ Error?
│  ├─ Display error message
│  ├─ Log to console
│  └─ Allow retry
└─ Network error?
   ├─ Show "Connection error"
   └─ Suggest retry
```

---

This architecture ensures:
✅ Real-time GPS calculations
✅ Accurate pricing with multipliers
✅ Error handling at every step
✅ Mobile-optimized UX
✅ Uber-like user experience

