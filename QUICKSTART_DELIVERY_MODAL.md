# 🚀 Quick Start Guide - Google Maps Delivery Modal

Get the new delivery system up and running in 10 minutes!

---

## ⚡ 5-Step Quick Setup

### Step 1: Get Google Maps API Key (2 min)
```bash
# Go to: https://console.cloud.google.com/
# 1. Create new project
# 2. Search for "Maps JavaScript API"
# 3. Enable it
# 4. Go to Credentials → Create API Key
# 5. Copy the key
```

### Step 2: Add to Environment (1 min)
Create/edit `.env.local`:
```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=YOUR_API_KEY_HERE
```

### Step 3: Seed Database (2 min)
```bash
npx ts-node scripts/seed-nigerian-states.ts
```

Expected output:
```
✅ Successfully seeded 36 Nigerian states
States added:
  - Lagos (LA)
  - Ogun (OG)
  ... 34 more states
```

### Step 4: Update Cart Page (2 min)
In `app/cart/page.tsx`:

**OLD:**
```tsx
import { EnhancedDeliverySelector } from "../components/EnhancedDeliverySelector";
```

**NEW:**
```tsx
import { EnhancedDeliverySelector } from "../components/EnhancedDeliverySelectorNew";
```

### Step 5: Restart Server (1 min)
```bash
npm run dev
```

---

## 🎯 What You Get

### Modal Features:
✅ Full-screen modal (not crowded)  
✅ Left side: Form (State, Vehicle, Address)  
✅ Right side: Google Map with markers  
✅ Real-time distance calculation  
✅ Live fee calculation  
✅ Professional UI with gradients  

### Map Features:
✅ Green marker = Pickup location  
✅ Blue marker = Your delivery location  
✅ Interactive (zoom/pan)  
✅ Distance shown in km  
✅ Time estimated in minutes  
✅ Fee calculated automatically  

### All 36 States:
✅ Lagos, Ogun, Oyo, Osun, Ondo, Ekiti  
✅ Kogi, Kwara, Abuja, Nassarawa, Niger, Plateau  
✅ Enugu, Anambra, Ebonyi, Imo, Abia, Cross River  
✅ Rivers, Bayelsa, Delta, Edo, Akwa Ibom  
✅ Jigawa, Kano, Katsina, Kebbi, Sokoto, Zamfara  
✅ Adamawa, Taraba, Gombe, Yobe, Borno  

---

## 📸 What It Looks Like

### User sees this on cart:
```
┌──────────────────────────────────────┐
│  Click here to select delivery ▼     │
│  "🚗 Real-Time Delivery"             │
└──────────────────────────────────────┘
           ↓ User clicks
           ↓
```

### Modal opens:
```
┌─────────────────────────────────────────────────────┐
│ ✕ Real-Time Delivery      [Select delivery details] │
├─────────────────────────────────────────────────────┤
│                                                     │
│  STATE:                   🗺️ GOOGLE MAP           │
│  ┌────────────────────┐  ┌──────────────────┐    │
│  │ Lagos          ▼   │  │ 🟢 Pickup        │    │
│  └────────────────────┘  │        ↓          │    │
│                          │        │ 🔵 You   │    │
│  VEHICLE:               │                    │    │
│  ┌────┬────┬────┐      │ Distance: 5.2 km   │    │
│  │ 🏍 │ 🚗 │ 🚐 │      │ Time: 15m - 25m     │    │
│  └────┴────┴────┘      │ Fee: ₦3,500         │    │
│                          └──────────────────┘    │
│  LOCATION:                                      │
│  ◯ GPS                                          │
│  ◯ Manual Address                               │
│  ┌──────────────────────┐                      │
│  │ Your address here... │                      │
│  └──────────────────────┘                      │
│                                                 │
│          [Cancel] [Confirm Delivery]            │
│                                                 │
└─────────────────────────────────────────────────────┘
```

### After selecting:
```
Selected Delivery Info:
┌────────────────────────────────────┐
│ State: Lagos                       │
│ Vehicle: Car                       │
│ Distance: 5.2 km                   │
│ Est. Time: 15m - 25m               │
│ Delivery Fee: ₦3,500               │
└────────────────────────────────────┘
     ↓
  Added to cart total!
```

---

## 🧪 Test It Now

1. Go to Cart page
2. Click "Real-Time Delivery" button
3. Modal opens
4. Select a state (try Lagos first)
5. Choose vehicle type
6. Watch map update with markers
7. See quote calculate
8. Click "Confirm Delivery"
9. See selected info appear on cart

---

## 🔧 Files You Need to Know

| File | Purpose |
|------|---------|
| `/app/lib/models/NigerianState.ts` | MongoDB schema for states |
| `/scripts/seed-nigerian-states.ts` | Populates database with 36 states |
| `/app/api/delivery/states/route.ts` | Endpoint that returns all states |
| `/app/api/delivery/calculate/route.ts` | Calculates distance & fee |
| `/app/components/DeliveryModal.tsx` | The full modal component |
| `/app/components/EnhancedDeliverySelectorNew.tsx` | Button that opens modal |

---

## ⚙️ Configuration

### Pricing (in API route):
```
Bike:  ₦1,500 base + ₦100/km
Car:   ₦2,500 base + ₦200/km
Van:   ₦3,500 base + ₦300/km
```

### Speed Estimates:
```
Bike: 15-30 km/h
Car:  20-40 km/h
Van:  30-50 km/h
```

### Map Zoom:
```
Default: 13 (street level)
```

---

## 🐛 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| Map shows gray box | Check Google Maps API key in `.env.local` |
| States not in dropdown | Run seed script: `npx ts-node scripts/seed-nigerian-states.ts` |
| Modal won't open | Check browser console for errors |
| Distance wrong | Verify state coordinates in database |
| Fee seems high | Check vehicle type and pricing formula |

---

## 📊 What Changes

### Database:
- New collection: `nigerian_states`
- 36 documents (one per state)
- Each with coordinates

### API:
- New: GET `/api/delivery/states`
- Updated: POST `/api/delivery/calculate` (now handles coordinates)

### Components:
- New: `DeliveryModal.tsx`
- New: `EnhancedDeliverySelectorNew.tsx`
- Updated: Cart page imports

### Packages:
- New: `@react-google-maps/api`

---

## ✅ Verification Checklist

After setup:
- [ ] `.env.local` has Google Maps API key
- [ ] Seed script ran successfully (36 states)
- [ ] Cart page imports new component
- [ ] Dev server running (`npm run dev`)
- [ ] Click delivery button opens modal
- [ ] Modal has form on left, map on right
- [ ] All states load in dropdown
- [ ] Map shows green and blue markers
- [ ] Quote calculates and updates
- [ ] Can confirm delivery
- [ ] Selected info shows in cart

---

## 🎓 How It Works

```
1. User clicks "Real-Time Delivery" on cart
   ↓
2. Modal opens and fetches 36 states from database
   ↓
3. User selects state (loads coordinates from DB)
   ↓
4. User chooses vehicle type
   ↓
5. User picks GPS or manual address
   ↓
6. Modal gets user's location (GPS or text → coordinates)
   ↓
7. API calculates distance using Haversine formula
   ↓
8. API calculates estimated time based on distance
   ↓
9. API calculates fee based on vehicle + distance
   ↓
10. Map displays with markers and quote
   ↓
11. User confirms delivery
   ↓
12. Modal closes, delivery shows in cart
   ↓
13. Fee added to cart total
```

---

## 📞 Need Help?

### Error: "Google Maps API key not configured"
- Missing `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` in `.env.local`
- Restart dev server after adding

### Error: "No states found"
- Seed script didn't run
- Run: `npx ts-node scripts/seed-nigerian-states.ts`

### Map shows blank
- API key invalid
- Browser console shows error
- Check Permissions/Quotas in Google Cloud

### Modal won't close after confirming
- Check browser console for errors
- Verify `onConfirm` handler working

---

## 🎉 You're All Set!

Your delivery system now has:
- ✅ Real Google Maps
- ✅ Modal popup for space
- ✅ All 36 Nigerian states
- ✅ Professional UI
- ✅ Live calculations

Enjoy! 🚀

---

**Need to customize?** Check `GOOGLE_MAPS_IMPLEMENTATION.md` for detailed docs.
