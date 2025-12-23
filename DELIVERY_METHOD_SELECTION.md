# Delivery Method Selection Implementation

## Overview
Replaced the payment success popup with a delivery method selection modal that allows customers to choose between EMPI Delivery or Self Pickup after successful payment.

## Changes Made

### 1. Created DeliveryMethodModal Component
**File:** `/app/components/DeliveryMethodModal.tsx`
- New modal component with two delivery options:
  - EMPI Delivery (₦2,500, 2-5 business days)
  - Self Pickup (FREE, Ready within 24 hours)
- Shows payment confirmation with order reference
- Updates order with selected delivery method
- Redirects to logistics page after selection
- Graceful error handling

### 2. Created Dynamic Order Update API
**File:** `/app/api/orders/[id]/route.ts`
- New PATCH endpoint to update individual orders
- Allows updating delivery method, status, and related fields
- Includes product image population helper
- Supports GET requests for single order retrieval

### 3. Updated Checkout Page
**File:** `/app/checkout/page.tsx`
- Replaced `PaymentSuccessModal` import with `DeliveryMethodModal`
- Added state for delivery modal (`deliveryModalOpen`)
- Added state for selected order ID (`selectedOrderId`)
- Modified payment success handler to:
  - Capture the order ID from API response
  - Show delivery method modal instead of success popup
  - Clear cart on successful payment

## Workflow

1. User completes payment via Paystack
2. Order is created via POST `/api/orders`
3. Payment success modal is replaced with delivery method selection modal
4. User selects delivery method (EMPI or Self Pickup)
5. Selected method is saved to order via PATCH `/api/orders/[id]`
6. Order status is set to "pending"
7. User is redirected to `/admin/logistics`
8. Logistics team sees the new order in the pending tab

## Database Updates
- Orders now have `shippingType` field populated: "empi" or "self"
- Orders have `status` set to "pending" for logistics visibility
- All order fields are available for update (address, state, etc.)

## Future Enhancements
- Add customer address collection during delivery method selection
- Add estimated delivery date calculation
- Send notification email with delivery details
- Allow delivery method changes in logistics dashboard
