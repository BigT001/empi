# Visual Architecture: Custom Order Profile Auto-Update

## System Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER JOURNEY                             │
└─────────────────────────────────────────────────────────────────┘

1. USER LOGS IN
   │
   ├─ BuyerContext provides: { id, name, email, phone, city }
   │
   └─ Navigate to Custom Order Form (/category-custom)

2. FORM PAGE LOADS
   │
   ├─ useEffect triggers
   │
   ├─ Auto-fills from buyer context:
   │  ├─ fullName ✓
   │  ├─ email ✓
   │  ├─ phone ✓
   │  ├─ city ✓
   │  ├─ address (empty) ⬜
   │  ├─ state (empty) ⬜
   │  └─ postalCode (empty) ⬜
   │
   └─ Display "Auto-filled" badge

3. USER INTERACTS WITH FORM
   │
   ├─ Can EDIT auto-filled fields ✅ (now editable!)
   │  ├─ fullName → change to "New Name"
   │  ├─ email → change to "new@email.com"
   │  └─ etc...
   │
   ├─ Can ADD missing fields ✅ (now editable!)
   │  ├─ address → "123 Main Street"
   │  ├─ state → "Lagos"
   │  └─ postalCode → "102101"
   │
   └─ All onChange handlers work normally

4. USER UPLOADS DESIGN
   │
   ├─ Select image(s)
   ├─ Add description
   ├─ Set quantity/date
   │
   └─ Click "Get My Quote" button

5. FORM SUBMISSION
   │
   ├─ Validation checks
   │
   └─ Two parallel operations:

        OPERATION A: Save Custom Order
        ├─ POST /api/custom-orders
        ├─ Send FormData with:
        │  ├─ Form fields (all 10 fields)
        │  ├─ Design images (files)
        │  └─ buyerId (from context)
        ├─ Server saves to CustomOrder collection
        └─ Returns: { orderNumber, _id, ... }

        OPERATION B: Update Buyer Profile ⭐ NEW
        ├─ PATCH /api/buyers/{buyerId}
        ├─ Send JSON with:
        │  ├─ fullName
        │  ├─ phone
        │  ├─ address
        │  ├─ city
        │  ├─ state
        │  └─ postalCode
        ├─ Server updates Buyer document
        └─ Returns: { updated buyer object }

6. SUCCESS
   │
   ├─ Both operations complete ✅
   │
   ├─ Show success modal/message
   │
   ├─ User's profile is now updated:
   │  ├─ address: "123 Main Street" ✅
   │  ├─ state: "Lagos" ✅
   │  └─ postalCode: "102101" ✅
   │
   └─ User done! No extra steps needed.

7. VERIFICATION
   │
   ├─ User can check dashboard
   ├─ Go to /dashboard → Profile tab
   ├─ See all fields populated ✅
   │
   └─ Profile complete without manual update!
```

---

## API Endpoint Architecture

```
┌──────────────────────────────────────────────┐
│         CUSTOM ORDER FORM (Frontend)         │
│      app/custom-costumes/page.tsx            │
└────────────┬─────────────────────────────────┘
             │
             ├─────────────────────────────────────────┐
             │                                         │
             ▼                                         ▼
      POST /api/custom-orders              PATCH /api/buyers/{id}
      (Existing)                           (NEW)
             │                                         │
    ┌────────▼──────────────┐              ┌──────────▼────────────┐
    │  Custom Order API     │              │  Buyer Profile API    │
    │  Save Form Data +     │              │  Update Profile       │
    │  Upload Images        │              │  With Form Data       │
    └────────┬──────────────┘              └──────────┬────────────┘
             │                                         │
             ▼                                         ▼
    ┌────────────────────────┐              ┌──────────────────────┐
    │  CustomOrder DB        │              │   Buyer DB           │
    │  Collection            │              │   (MongoDB)          │
    │  ├─ orderNumber        │              │                      │
    │  ├─ buyerId            │              │   Updated fields:    │
    │  ├─ email              │              │   ├─ address ✅      │
    │  ├─ description        │              │   ├─ state ✅        │
    │  ├─ images [urls]      │              │   └─ postalCode ✅   │
    │  └─ createdAt          │              │                      │
    └────────────────────────┘              └──────────────────────┘
```

---

## Data Flow Diagram

```
USER FILLS FORM
└─ formData state object:
   {
     fullName: "benerd maxwell" ← from buyer.fullName
     email: "benerd01@gmail.com" ← from buyer.email
     phone: "8108478477" ← from buyer.phone
     address: "123 Main Street" ← user added ⭐
     city: "Lagos" ← from buyer.city
     state: "Lagos" ← user added ⭐
     postalCode: "102101" ← user added ⭐
     description: "Victorian costume..."
     deliveryDate: "2026-02-15"
     quantity: 2
   }
   │
   ├─ Split into two requests:
   │
   ├─ Request #1 (FormData):
   │  └─ POST /api/custom-orders
   │     └─ Save complete order with images
   │
   └─ Request #2 (JSON):
      └─ PATCH /api/buyers/{buyerId}
         └─ Update profile with:
            {
              fullName: "benerd maxwell",
              phone: "8108478477",
              address: "123 Main Street", ⭐ NEW
              city: "Lagos",
              state: "Lagos", ⭐ NEW
              postalCode: "102101" ⭐ NEW
            }

RESULT: Buyer profile now complete! ✅
```

---

## Component Interaction

```
┌─────────────────────────────────────────────────────────┐
│              CustomCostumesPage Component               │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  State:                                                 │
│  ├─ formData (all 10 fields + images)                   │
│  ├─ isLoading, submitStatus                             │
│  └─ selectedFiles, previewUrls                          │
│                                                         │
│  Context:                                               │
│  └─ useBuyer() → { buyer }                              │
│      └─ buyer has: id, fullName, email, phone, city... │
│                                                         │
│  Hooks:                                                 │
│  ├─ useEffect → Auto-populate formData from buyer      │
│  └─ handleSubmit → (Enhanced)                          │
│      ├─ Validate form                                  │
│      ├─ POST /api/custom-orders                        │
│      ├─ PATCH /api/buyers/{id} ⭐ NEW                  │
│      └─ Show success                                   │
│                                                         │
│  JSX:                                                   │
│  └─ Input fields (all editable now!)                    │
│     ├─ fullName (editable)                              │
│     ├─ email (editable)                                 │
│     ├─ phone (editable)                                 │
│     ├─ address (editable) ⭐ WAS DISABLED              │
│     ├─ city (editable)                                  │
│     ├─ state (editable) ⭐ WAS DISABLED                │
│     └─ postalCode (editable) ⭐ WAS DISABLED           │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Request/Response Flow

```
BROWSER (Frontend)
│
├─ REQUEST #1: POST /api/custom-orders
│  └─ Body (FormData):
│     ├─ fullName, email, phone, address, city, state, postalCode
│     ├─ description, deliveryDate, quantity
│     ├─ designImages: [File, File, ...]
│     └─ buyerId
│
├─ Response:
│  └─ Status: 201 Created
│     Body: { orderNumber: "CO-2026-001", _id: "...", ... }
│
├─ REQUEST #2: PATCH /api/buyers/{buyerId}  ⭐ NEW
│  └─ Body (JSON):
│     {
│       "fullName": "benerd maxwell",
│       "phone": "8108478477",
│       "address": "123 Main Street",
│       "city": "Lagos",
│       "state": "Lagos",
│       "postalCode": "102101"
│     }
│
└─ Response:
   └─ Status: 200 OK
      Body: { _id: "...", email: "...", address: "123 Main Street", ... }

RESULT: Both operations successful!
        Order created + Profile updated ✅
```

---

## Before & After Comparison

### BEFORE (Problem)
```
User logs in
    ↓
Form auto-fills (read-only) ❌ LOCKED
    ├─ Can't edit pre-filled fields
    └─ Can't add missing fields
         ↓
    Order submitted
         ↓
    Profile NOT updated ❌
         ↓
    User must go to dashboard
    and manually update profile 😞
```

### AFTER (Solution) ✅
```
User logs in
    ↓
Form auto-fills (EDITABLE!) ✅ FLEXIBLE
    ├─ Can edit any pre-filled field
    └─ Can add all missing fields
         ↓
    Order submitted
         ↓
    Profile AUTOMATICALLY updated! ✅
         ↓
    User done! No extra steps needed 🎉
```

---

## Error Handling

```
handleSubmit
│
├─ VALIDATION PHASE
│  ├─ Check: At least one image? ✓
│  └─ Check: Required fields present? ✓
│     If fails: Show error, return early
│
├─ ORDER SUBMISSION PHASE
│  ├─ POST /api/custom-orders
│  ├─ Response OK? ✓
│  └─ If fails: Throw error, catch it
│     Result: Error modal shown ❌
│
└─ PROFILE UPDATE PHASE ⭐ NEW
   ├─ If buyer?.id exists:
   │  ├─ PATCH /api/buyers/{id}
   │  ├─ Response OK?
   │  │  ├─ Yes: Log success ✅
   │  │  └─ No: Log warning ⚠️
   │  └─ If catch: Log warning ⚠️
   │
   └─ Non-blocking! ⭐
      Even if profile update fails,
      order success is shown
      (Order is the important thing)
```

---

**Visual Summary:** 
- ✅ Flexible form (removed restrictions)
- ✅ Two-step submission (order + profile)
- ✅ Non-blocking profile update
- ✅ Seamless UX (user sees success)
- ✅ Profile auto-complete (no extra steps)

---

Generated: January 19, 2026
