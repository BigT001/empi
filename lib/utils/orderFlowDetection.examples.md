/**
 * ORDER FLOW DETECTION - INTEGRATION EXAMPLES
 * ============================================
 * 
 * Copy-paste ready examples for using the order flow detection utility
 * throughout your application
 */

// ============================================================================
// EXAMPLE 1: At Checkout Page
// ============================================================================
// File: app/checkout/page.tsx

import { detectOrderTypeFromCheckoutSource, isCustomOrder } from '@/lib/utils/orderFlowDetection';

export default function CheckoutPage() {
  // Detect which flow the buyer came from
  const orderContext = detectOrderTypeFromCheckoutSource();
  
  if (orderContext.source === 'custom') {
    // 🎯 CUSTOM ORDER FLOW
    // - Get custom order data from session
    // - Show custom order summary
    // - Process custom order payment
    
    return (
      <div>
        <h1>Custom Order Checkout</h1>
        <p>Order: {orderContext.customOrderNumber}</p>
        {/* Custom order payment form */}
      </div>
    );
  }
  
  if (orderContext.source === 'regular') {
    // 🛒 REGULAR ORDER FLOW
    // - Get cart items from session
    // - Show cart summary
    // - Process cart payment
    
    return (
      <div>
        <h1>Cart Checkout</h1>
        <p>Items: {orderContext.cartItemCount}</p>
        {/* Cart payment form */}
      </div>
    );
  }
  
  return <div>Error: Unable to determine order type</div>;
}

// ============================================================================
// EXAMPLE 2: Order Card Display Component
// ============================================================================
// File: app/components/OrderCard.tsx

import { isCustomOrder, isRegularOrder, debugOrderType } from '@/lib/utils/orderFlowDetection';

interface OrderCardProps {
  order: any;
}

export function OrderCard({ order }: OrderCardProps) {
  // DEBUG (remove in production)
  if (process.env.NODE_ENV === 'development') {
    debugOrderType(order, 'OrderCard');
  }
  
  // Determine which card to show
  if (isCustomOrder(order)) {
    return <CustomOrderCard order={order} />;
  }
  
  if (isRegularOrder(order)) {
    return <RegularOrderCard order={order} />;
  }
  
  return <div className="error">Unknown order type</div>;
}

// ============================================================================
// EXAMPLE 3: Payment Processing (API Route)
// ============================================================================
// File: app/api/payments/process/route.ts

import { detectOrderTypeFromStructure } from '@/lib/utils/orderFlowDetection';

export async function POST(request: NextRequest) {
  const paymentData = await request.json();
  const { orderId, amount } = paymentData;
  
  // Fetch the order from database
  const order = await Order.findById(orderId);
  
  // Determine order type BEFORE processing
  const orderContext = detectOrderTypeFromStructure(order);
  
  if (orderContext.source === 'custom') {
    // Handle custom order payment
    console.log('Processing CUSTOM order payment:', order.orderNumber);
    // Custom payment logic
  } else if (orderContext.source === 'regular') {
    // Handle regular order payment
    console.log('Processing REGULAR order payment:', order.orderNumber);
    // Regular payment logic
  } else {
    throw new Error('Cannot process: unknown order type');
  }
  
  return NextResponse.json({ success: true });
}

// ============================================================================
// EXAMPLE 4: Saving Order (API Route)
// ============================================================================
// File: app/api/orders/create/route.ts

import { detectOrderTypeFromCheckoutSource } from '@/lib/utils/orderFlowDetection';

export async function POST(request: NextRequest) {
  const orderData = await request.json();
  
  // 🔑 CRITICAL: Detect order source BEFORE saving
  const flowContext = detectOrderTypeFromCheckoutSource();
  
  // Add source field to order
  const orderRecord = {
    ...orderData,
    source: flowContext.source, // CUSTOM or REGULAR
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  
  // Save to database
  const savedOrder = await Order.create(orderRecord);
  
  console.log(`✅ Order created:`, {
    orderNumber: savedOrder.orderNumber,
    source: savedOrder.source, // This will be either 'custom' or 'regular'
  });
  
  return NextResponse.json(savedOrder);
}

// ============================================================================
// EXAMPLE 5: Order List Display (Admin)
// ============================================================================
// File: app/admin/orders/page.tsx

import { isCustomOrder, isRegularOrder } from '@/lib/utils/orderFlowDetection';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  
  // Separate orders by type
  const customOrders = orders.filter(isCustomOrder);
  const regularOrders = orders.filter(isRegularOrder);
  
  return (
    <div>
      <section>
        <h2>Custom Orders ({customOrders.length})</h2>
        {customOrders.map(order => (
          <CustomOrderRow key={order._id} order={order} />
        ))}
      </section>
      
      <section>
        <h2>Regular Orders ({regularOrders.length})</h2>
        {regularOrders.map(order => (
          <RegularOrderRow key={order._id} order={order} />
        ))}
      </section>
    </div>
  );
}

// ============================================================================
// EXAMPLE 6: Preventing Order Mixing (Validation)
// ============================================================================
// File: lib/utils/orderValidation.ts

import { 
  detectOrderTypeFromCheckoutSource, 
  detectOrderTypeFromStructure,
  validateNoOrderMixing 
} from '@/lib/utils/orderFlowDetection';

export function validateOrderFlow(orderData: any) {
  // Get order type from multiple sources
  const checkoutContext = detectOrderTypeFromCheckoutSource();
  const structureContext = detectOrderTypeFromStructure(orderData);
  
  // This will throw an error if types don't match
  try {
    validateNoOrderMixing(checkoutContext, structureContext);
    console.log('✅ Order types match - safe to proceed');
  } catch (error) {
    console.error('❌ Order type mismatch detected!');
    throw error;
  }
}

// ============================================================================
// EXAMPLE 7: Quick Checks (Utility Functions)
// ============================================================================

import { 
  getOrderType, 
  isCustomOrder, 
  isRegularOrder 
} from '@/lib/utils/orderFlowDetection';

// Simple one-liner checks
const myOrder = { /* ... */ };

if (getOrderType(myOrder) === 'custom') {
  // Custom order logic
}

if (isCustomOrder(myOrder)) {
  // Custom order logic
}

if (isRegularOrder(myOrder)) {
  // Regular order logic
}

// ============================================================================
// EXAMPLE 8: For Server-Side (Database Queries)
// ============================================================================
// File: lib/utils/orderQueries.ts

import Order from '@/lib/models/Order';
import CustomOrder from '@/lib/models/CustomOrder';

// Get only custom orders
export async function getCustomOrders(email: string) {
  return await Order.find({ email, source: 'custom' });
}

// Get only regular orders
export async function getRegularOrders(email: string) {
  return await Order.find({ email, source: 'regular' });
}

// Get all orders separated by type
export async function getOrdersGroupedByType(email: string) {
  const customOrders = await Order.find({ email, source: 'custom' });
  const regularOrders = await Order.find({ email, source: 'regular' });
  const directCustomOrders = await CustomOrder.find({ email });
  
  return { customOrders, regularOrders, directCustomOrders };
}

// ============================================================================
// EXAMPLE 9: Type-Safe Workflow
// ============================================================================
// File: app/components/OrderSummary.tsx

import type { AnyOrder } from '@/lib/types/orderFlowTypes';
import { isCustomOrderData, isRegularOrderData } from '@/lib/types/orderFlowTypes';

interface OrderSummaryProps {
  order: AnyOrder;
}

export function OrderSummary({ order }: OrderSummaryProps) {
  if (isCustomOrderData(order)) {
    // TypeScript knows 'order' is ICustomOrderData here
    return (
      <div>
        <p>Costume: {order.description}</p>
        <p>Quoted Price: ₦{order.quotedPrice}</p>
      </div>
    );
  }
  
  if (isRegularOrderData(order)) {
    // TypeScript knows 'order' is IRegularOrderData here
    return (
      <div>
        <p>Items: {order.items.length}</p>
        <p>Total: ₦{order.total}</p>
      </div>
    );
  }
  
  return null;
}

// ============================================================================
// SUMMARY OF KEY FUNCTIONS
// ============================================================================
/*

USE THESE AT CHECKOUT/PAYMENT:
✓ detectOrderTypeFromCheckoutSource()
✓ detectOrderTypeFromCheckoutSource().source === 'custom' ? ... : ...

USE THESE FOR DISPLAY/ORDERS:
✓ isCustomOrder(order)
✓ isRegularOrder(order)
✓ getOrderType(order)

USE THESE FOR DEBUGGING:
✓ debugOrderType(order, 'label')

USE THESE FOR VALIDATION:
✓ validateNoOrderMixing(context1, context2)

USE THESE FOR DATABASE:
✓ detectOrderTypeFromCollection('customorders' | 'orders')
✓ Save with source: 'custom' | 'regular'

*/
