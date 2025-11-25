# Delivery System Integration Map

## Project Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    🛒 CART PAGE (/app/cart/page.tsx)           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  Cart Items Display                                     │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  📍 EnhancedDeliverySelector Component                   │  │
│  │  ├─ Vehicle Selection (Bike/Car/Van)                   │  │
│  │  ├─ Pickup Point Selection (Suru Lere/Ojo)            │  │
│  │  ├─ LocationMap (Embedded)                            │  │
│  │  │  ├─ Browser Geolocation 📡                         │  │
│  │  │  ├─ Real-time Map Display                          │  │
│  │  │  └─ 4-Card Dashboard                               │  │
│  │  ├─ Rush Delivery Toggle                              │  │
│  │  └─ onDeliveryChange Callback → Cart State            │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  Delivery Quote ➜ {fee: ₦XXXX, vehicle: CAR, breakdown: {...}} │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│               🛍️ CHECKOUT PAGE (/app/checkout/page.tsx)        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  Order Summary                                          │  │
│  │  ├─ Items Total                                        │  │
│  │  ├─ Delivery Fee (from cart)  ┌─────────────────┐    │  │
│  │  │                             │ Pickup: Suru    │    │  │
│  │  │                             │ Distance: 5.2km │    │  │
│  │  │                             │ Time: 15-25m    │    │  │
│  │  ├─ Tax (10%)                 │ Fee: ₦3,936     │    │  │
│  │  └─ Grand Total               └─────────────────┘    │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│  [Proceed to Payment]                                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow

```
User Browsing
     │
     ▼
🛒 CART PAGE
     │
     ├─→ [Select Vehicle Type: Car]
     ├─→ [Select Pickup Point: Ojo]
     ├─→ [Check: Fragile Item]
     ├─→ [Check: Rush Delivery]
     │
     ▼
📍 EnhancedDeliverySelector
     │
     ├─→ Browser Geolocation API
     │   │ ✅ User allows location
     │   └─→ Get latitude, longitude
     │
     ├─→ Call API: /api/delivery/calculate-distance
     │   ├─ userLatitude: 6.5000
     │   ├─ userLongitude: 3.3500
     │   ├─ vehicleType: "car"
     │   ├─ itemSize: "MEDIUM"
     │   ├─ isFragile: true
     │   └─ isRushDelivery: true
     │
     ▼
🔧 API: /api/delivery/calculate-distance/route.ts
     │
     ├─→ Get nearest pickup point (Ojo)
     │   └─ Ojo: 6.4756°N, 3.1265°E
     │
     ├─→ Calculate distance (Haversine)
     │   └─ User (6.5000, 3.3500) → Ojo (6.4756, 3.1265)
     │   └─ Distance: 5.2 km
     │
     ├─→ Determine mainland Lagos
     │   └─ ✅ Yes (within 6.4-6.7°N, 3.0-3.5°E)
     │   └─ Apply ₦3,000 minimum
     │
     ├─→ Calculate delivery fee
     │   ├─ Base: ₦3,000
     │   ├─ Distance: 5.2km × ₦50/km (car) = ₦260
     │   ├─ Subtotal: ₦3,260
     │   ├─ Size multiplier: 1.2x (medium) = ₦3,912
     │   ├─ Fragile: 1.3x (fragile) = ₦5,086
     │   ├─ Rush: 1.5x (rush) = ₦7,629
     │   └─ Total: ₦7,629
     │
     ├─→ Estimate delivery time
     │   ├─ Base: 5.2km ÷ 25km/h (car) = 12 min
     │   ├─ Traffic buffer: +30% = 16 min
     │   ├─ Rush multiplier: -20% = 13 min (faster)
     │   └─ Range: 13-18 minutes
     │
     └─→ Return API Response
            {
              pickupPoint: {
                id: "ojo",
                name: "Ojo Pickup",
                address: "22 Chi-Ben Street, Ojo Lagos, 102112",
                coordinates: {latitude: 6.4756, longitude: 3.1265}
              },
              distance: {
                km: 5.2,
                formatted: "5.2 km"
              },
              deliveryTime: {
                min: 13,
                max: 18,
                formatted: "13m - 18m"
              },
              pricing: {
                baseFee: 3000,
                distanceFee: 260,
                sizeMultiplier: 1.2,
                fragileMultiplier: 1.3,
                rushMultiplier: 1.5,
                totalFee: 7629,
                breakdown: "..."
              },
              isMainlandLagos: true
            }

     ▼
📊 LocationMap Component
     │
     └─→ Display 4-Card Dashboard:
         ├─ Card 1: Distance: 5.2 km
         ├─ Card 2: Estimated Time: 13m - 18m
         ├─ Card 3: Vehicle Type: 🚗 Car
         └─ Card 4: Total Price: ₦7,629
         
         Price Breakdown:
         ├─ Base Fee: ₦3,000
         ├─ Distance: ₦260
         ├─ Size (Medium): ×1.2
         ├─ Fragile: ×1.3
         ├─ Rush Delivery: ×1.5
         └─ Total: ₦7,629

     ▼
🎯 EnhancedDeliverySelector converts to DeliveryQuote
     │
     └─→ {
           fee: 7629,
           vehicle: "CAR",
           zone: "intra_lagos",
           breakdown: {
             zone: "intra_lagos",
             zoneName: "Ojo Pickup",
             requiredVehicle: "CAR",
             baseDeliveryFee: 3000,
             vehicleFee: 260,
             sizeFee: 0,
             subtotal: 3260,
             modifiers: [
               {name: "Fragile", multiplier: 1.3},
               {name: "Rush", multiplier: 1.5}
             ],
             total: 7629,
             estimatedDays: {min: 0.01, max: 0.02},
             breakdown: {...}
           },
           estimatedDays: {min: 0.01, max: 0.02},
           warnings: [],
           recommendations: []
         }

     ▼
🛒 Cart State Updated
     │
     ├─→ deliveryQuote = {...}
     ├─→ deliveryFee = 7629
     ├─→ pickupPoint = "Ojo"
     └─→ Total = Items + Delivery Fee

     ▼
🛍️ CHECKOUT PAGE
     │
     └─→ Display:
         ├─ Items Total: ₦50,000
         ├─ Delivery Fee: ₦7,629
         │  (From Ojo in 13-18 mins)
         ├─ Tax (10%): ₦5,763
         └─ Grand Total: ₦63,392
         
         [Proceed to Payment]
```

## Component Files Structure

```
app/
├── lib/
│   ├── distanceCalculator.ts ⭐
│   │   ├─ PICKUP_POINTS
│   │   ├─ DELIVERY_CONFIG
│   │   ├─ calculateDistance(lat1, lon1, lat2, lon2)
│   │   ├─ calculateDeliveryFee({...})
│   │   ├─ estimateDeliveryTime(km, vehicleType)
│   │   ├─ getNearestPickupPoint(lat, lon)
│   │   └─ Formatters
│   │
│   └── googleMapsService.ts (Optional)
│       ├─ getDistanceFromGoogleMaps(origin, destination)
│       └─ convertSecondsToReadable(seconds)
│
├── api/
│   └── delivery/
│       └── calculate-distance/
│           └── route.ts ⭐
│               └─ POST handler
│
├── components/
│   ├── LocationMap.tsx ⭐
│   │   ├─ State: userLocation, quote, loading, error
│   │   ├─ useEffect for geolocation
│   │   ├─ useEffect for API calls
│   │   └─ 4-card display + price breakdown
│   │
│   └── EnhancedDeliverySelector.tsx ⭐
│       ├─ State: vehicleType, isRushDelivery, selectedPickupPoint
│       ├─ Embedded LocationMap
│       ├─ Vehicle selection (Bike/Car/Van)
│       ├─ Pickup selection (Suru Lere/Ojo)
│       └─ Converts to DeliveryQuote
│
├── cart/
│   └── page.tsx
│       ├─ OLD: <DeliverySelector />
│       └─ NEW: <EnhancedDeliverySelector /> ← REPLACE HERE
│
└── checkout/
    └── page.tsx
        ├─ Display delivery info from cart
        └─ Show pickup point + delivery fee + time
```

## API Endpoint Reference

### Calculate Delivery Distance & Fee

**Endpoint:** `POST /api/delivery/calculate-distance`

**Request:**
```json
{
  "userLatitude": 6.5000,
  "userLongitude": 3.3500,
  "vehicleType": "car",
  "itemSize": "MEDIUM",
  "isFragile": true,
  "isRushDelivery": true,
  "pickupPointId": "ojo" // optional, auto-select if omitted
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "pickupPoint": {
      "id": "ojo",
      "name": "Ojo Pickup Point",
      "address": "22 Chi-Ben Street, Ojo Lagos, 102112",
      "coordinates": {
        "latitude": 6.4756,
        "longitude": 3.1265
      }
    },
    "distance": {
      "km": 5.2,
      "formatted": "5.2 km"
    },
    "deliveryTime": {
      "min": 13,
      "max": 18,
      "formatted": "13m - 18m"
    },
    "pricing": {
      "baseFee": 3000,
      "distanceFee": 260,
      "sizeMultiplier": 1.2,
      "fragileMultiplier": 1.3,
      "rushMultiplier": 1.5,
      "totalFee": 7629,
      "breakdown": "₦3,000 base + ₦260 (5.2km × ₦50/km) × 1.2 (size) × 1.3 (fragile) × 1.5 (rush) = ₦7,629"
    },
    "isMainlandLagos": true
  }
}
```

## State Management Flow

```
EnhancedDeliverySelector
├─ vehicleType: "car" ← User selects
├─ isRushDelivery: true ← User checks box
├─ selectedPickupPoint: "ojo" ← User selects
│
├─ Passes to LocationMap:
│  ├─ vehicleType={vehicleType}
│  ├─ isFragile={hasFragileItems}
│  ├─ isRushDelivery={isRushDelivery}
│  └─ selectedPickupPoint={selectedPickupPoint}
│
├─ LocationMap calls API with these params
│  └─ Returns quote object
│
├─ LocationMap calls onQuoteUpdate callback
│  └─ EnhancedDeliverySelector receives quote
│
└─ EnhancedDeliverySelector converts to DeliveryQuote
   └─ Calls onDeliveryChange with DeliveryQuote
      └─ Cart page updates state
         └─ Stores deliveryQuote for checkout
```

## Testing Coordinates

Use these coordinates to test different scenarios:

### Mainland Lagos (Downtown)
- Latitude: 6.5244
- Longitude: 3.3662
- Expected: ✅ Mainland, ₦3,000 minimum applies
- Location: Ikeja area

### Mainland Lagos (Lekki)
- Latitude: 6.4650
- Longitude: 3.3900
- Expected: ✅ Mainland, ₦3,000 minimum applies
- Location: Lekki Phase 1

### Lagos Island
- Latitude: 6.4480
- Longitude: 3.4690
- Expected: ✅ Mainland (boundary), price calculated

### Ojo Area (Pickup Point)
- Latitude: 6.4756
- Longitude: 3.1265
- Expected: ⚠️ Same location, distance ~0km, minimum fee

### Suru Lere Area (Pickup Point)
- Latitude: 6.5244
- Longitude: 3.3662
- Expected: ⚠️ Same location, distance ~0km, minimum fee

---

**Key Integration Points:**
1. ✅ Replace `/app/cart/page.tsx` line with DeliverySelector
2. ✅ Verify cart state receives deliveryQuote object
3. ✅ Pass deliveryQuote to checkout page
4. ✅ Test with real GPS coordinates
