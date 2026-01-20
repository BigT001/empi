/**
 * ORDER FLOW DETECTION - QUICK REFERENCE CARD
 * =============================================
 * 
 * Print this out or bookmark it!
 * Everything you need to know about detecting custom vs regular orders
 * 
 */

// ============================================================================
// ⚡ ONE-LINER IMPORTS
// ============================================================================

import { isCustomOrder, isRegularOrder, getOrderType } from '@/lib/utils/orderFlowDetection';
import { detectOrderTypeFromCheckoutSource } from '@/lib/utils/orderFlowDetection';

// ============================================================================
// ⚡ QUICK CHECKS (Copy & Paste Ready)
// ============================================================================

// Check if order is custom
if (isCustomOrder(order)) { /* handle custom */ }

// Check if order is regular
if (isRegularOrder(order)) { /* handle regular */ }

// Get order type directly
const type = getOrderType(order); // Returns 'custom' | 'regular' | 'unknown'
if (type === 'custom') { /* ... */ }

// ============================================================================
// ⚡ AT CHECKOUT PAGE
// ============================================================================

const context = detectOrderTypeFromCheckoutSource();
// {
//   source: 'custom' | 'regular' | 'unknown',
//   stage: 'checkout',
//   customOrderNumber?: string,
//   cartItemCount?: number,
//   debugInfo: { ... }
// }

// ============================================================================
// ⚡ ORDER CHARACTERISTICS
// ============================================================================

// CUSTOM ORDER looks like:
{
  orderNumber: "CO-2026-001",
  fullName: "John Doe",
  description: "Blue wedding dress",
  costumeType: "wedding",
  quotedPrice: 250000,
  source: "custom",
  // NO items field!
}

// REGULAR ORDER looks like:
{
  orderNumber: "OR-2026-001",
  firstName: "John",
  lastName: "Doe",
  items: [
    { productId: "...", name: "...", quantity: 2, price: 50000 }
  ],
  orderType: "sales",
  source: "regular",
}

// ============================================================================
// ⚡ IN COMPONENTS (React)
// ============================================================================

// Option 1: Simple conditional
{isCustomOrder(order) ? <CustomCard /> : <RegularCard />}

// Option 2: Switch statement
switch (getOrderType(order)) {
  case 'custom': return <CustomCard order={order} />;
  case 'regular': return <RegularCard order={order} />;
  default: return <ErrorCard />;
}

// Option 3: Filter arrays
const customOrders = orders.filter(isCustomOrder);
const regularOrders = orders.filter(isRegularOrder);

// ============================================================================
// ⚡ IN API ROUTES
// ============================================================================

// Save with source
const orderRecord = {
  ...data,
  source: detectOrderTypeFromCheckoutSource().source,
};
await Order.create(orderRecord);

// Query by source
const customOrders = await Order.find({ email: 'user@email.com', source: 'custom' });
const regularOrders = await Order.find({ email: 'user@email.com', source: 'regular' });

// ============================================================================
// ⚡ PREVENT MIXING (Validation)
// ============================================================================

import { validateNoOrderMixing } from '@/lib/utils/orderFlowDetection';

const ctx1 = detectOrderTypeFromCheckoutSource();
const ctx2 = detectOrderTypeFromStructure(order);

validateNoOrderMixing(ctx1, ctx2); // Throws if different!

// ============================================================================
// ⚡ DEBUGGING
// ============================================================================

import { debugOrderType } from '@/lib/utils/orderFlowDetection';

debugOrderType(order, 'My Component');
// Prints detailed debug info to console

// ============================================================================
// ⚡ WHAT DETERMINES ORDER TYPE?
// ============================================================================

// CUSTOM ORDER indicators:
// ✓ Has: description, fullName, email, city
// ✓ Has: costumeType OR quotedPrice
// ✓ Missing: items array
// ✓ Came from: Custom order form
// ✓ Session: customOrderQuote

// REGULAR ORDER indicators:
// ✓ Has: items array (non-empty)
// ✓ Has: orderType ('sales', 'rental', 'mixed')
// ✓ Has: firstName, lastName
// ✓ Came from: Product collection → Cart
// ✓ Session: cartItems

// ============================================================================
// ⚡ ERROR MESSAGES TO KNOW
// ============================================================================

// "🚨 ORDER MIXING DETECTED: Cannot combine custom order with regular order"
// → Fix: Don't mix data from different order flows

// "Cannot determine order type - no checkout source data found"
// → Fix: Make sure order data is in session/URL params

// "Cannot determine order type from object structure"
// → Fix: Check if order object has required fields

// ============================================================================
// ⚡ FIELD REFERENCE
// ============================================================================

// ALWAYS present in:
// Custom Orders: description, fullName, email, city, status
// Regular Orders: items[], orderType, firstName, lastName, email, status

// SOMETIMES present in:
// Custom Orders: costumeType, quotedPrice, quoteItems, designUrl
// Regular Orders: deliveryOption, rentalSchedule, cautionFee

// ALWAYS track:
// Both: source ('custom' | 'regular'), createdAt, updatedAt, orderNumber

// ============================================================================
// ⚡ REAL WORLD EXAMPLES
// ============================================================================

// Example 1: Display order card
function OrderCard({ order }) {
  return isCustomOrder(order) 
    ? <div>Custom: {order.description}</div>
    : <div>Regular: {order.items.length} items</div>;
}

// Example 2: Payment processing
async function handlePayment(order) {
  if (isCustomOrder(order)) {
    // Use quotedPrice
    return processPayment(order.quotedPrice);
  } else {
    // Use total from items
    return processPayment(order.total);
  }
}

// Example 3: Admin filter
const customOrders = orders.filter(isCustomOrder);
const regularOrders = orders.filter(isRegularOrder);

// ============================================================================
// ⚡ REMEMBER
// ============================================================================

// 🎯 Always use the utility functions - never hardcode type checks
// 🎯 Always save the 'source' field when creating orders
// 🎯 Always validate before mixing orders
// 🎯 Always use appropriate components for order type
// 🎯 When in doubt, use debugOrderType() to inspect

// ============================================================================
