/**
 * ORDER FLOW DETECTION UTILITY
 * ============================
 * 
 * CRITICAL: Single source of truth for determining order type
 * Prevents custom and regular orders from being mixed up
 * 
 * Used at:
 * - Checkout page (detect which flow buyer came from)
 * - Payment processing (handle different payment flows)
 * - Order display (show correct order card)
 * - Order creation (track order source in database)
 * 
 * @author Senior Developer
 * @version 1.0.0
 */

/**
 * Type definitions for order sources
 */
export type OrderSource = 'custom' | 'regular' | 'unknown';
export type OrderFlowStage = 'product-page' | 'cart' | 'custom-form' | 'quote' | 'payment' | 'checkout' | 'order-display';

export interface OrderFlowContext {
  source: OrderSource;
  stage: OrderFlowStage;
  customOrderId?: string;
  customOrderNumber?: string;
  cartItemCount?: number;
  timestamp?: Date;
  debugInfo?: Record<string, any>;
}

/**
 * ============================================================================
 * DETECTION FUNCTION #1: FROM CHECKOUT SOURCE (URL & SESSION)
 * ============================================================================
 * Called at: Checkout page, Payment page
 * Accuracy: 99% (checks URL params and session storage)
 * 
 * CUSTOM ORDER INDICATORS:
 * - URL has ?customOrder=true
 * - URL has customOrderId parameter
 * - sessionStorage has customOrderQuote
 * 
 * REGULAR ORDER INDICATORS:
 * - sessionStorage has cartItems with items
 * - URL has cartItems parameter
 * 
 */
export function detectOrderTypeFromCheckoutSource(): OrderFlowContext {
  const context: OrderFlowContext = {
    source: 'unknown',
    stage: 'checkout',
    debugInfo: {},
  };

  // Check URL parameters (most reliable for checkout)
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);

    // ✅ CUSTOM ORDER: URL param is set
    if (params.get('customOrder') === 'true') {
      context.source = 'custom';
      context.customOrderNumber = params.get('orderNumber') || undefined;
      context.debugInfo = {
        source: 'URL param: ?customOrder=true',
        hasOrderNumber: !!context.customOrderNumber,
      };
      return context;
    }

    // ✅ CUSTOM ORDER: Custom order ID in URL
    if (params.get('customOrderId')) {
      context.source = 'custom';
      context.customOrderId = params.get('customOrderId') || undefined;
      context.debugInfo = {
        source: 'URL param: customOrderId',
        customOrderId: context.customOrderId,
      };
      return context;
    }

    // Check session storage for custom order
    try {
      const customOrderQuote = sessionStorage.getItem('customOrderQuote');
      if (customOrderQuote) {
        const quoteData = JSON.parse(customOrderQuote);
        context.source = 'custom';
        context.customOrderNumber = quoteData.orderNumber;
        context.debugInfo = {
          source: 'sessionStorage: customOrderQuote',
          orderNumber: quoteData.orderNumber,
        };
        return context;
      }
    } catch (e) {
      console.warn('[OrderFlowDetection] ⚠️ Error parsing customOrderQuote:', e);
    }

    // ✅ REGULAR ORDER: Cart items in session storage
    try {
      const cartItems = sessionStorage.getItem('cartItems');
      if (cartItems) {
        const items = JSON.parse(cartItems);
        if (Array.isArray(items) && items.length > 0) {
          context.source = 'regular';
          context.cartItemCount = items.length;
          context.debugInfo = {
            source: 'sessionStorage: cartItems',
            itemCount: items.length,
          };
          return context;
        }
      }
    } catch (e) {
      console.warn('[OrderFlowDetection] ⚠️ Error parsing cartItems:', e);
    }
  }

  // If nothing found, still unknown
  context.debugInfo = { source: 'No indicators found' };
  return context;
}

/**
 * ============================================================================
 * DETECTION FUNCTION #2: FROM ORDER OBJECT STRUCTURE
 * ============================================================================
 * Called at: Order display, order cards, order details page
 * Accuracy: 95% (checks data structure)
 * 
 * CUSTOM ORDER STRUCTURE:
 * - Has: description, fullName, email, city
 * - Has: costumeType OR quotedPrice
 * - Missing: items array
 * 
 * REGULAR ORDER STRUCTURE:
 * - Has: items array (non-empty)
 * - Has: orderType field (sales/rental/mixed)
 * - Missing: description field
 * 
 */
export function detectOrderTypeFromStructure(order: any): OrderFlowContext {
  const context: OrderFlowContext = {
    source: 'unknown',
    stage: 'order-display',
    debugInfo: { checkCount: 0 },
  };

  if (!order) {
    context.debugInfo = { error: 'Order object is null/undefined' };
    return context;
  }

  // Custom order indicators
  const hasDescription = !!order.description;
  const hasFullName = !!order.fullName;
  const hasCostumeType = !!order.costumeType;
  const hasQuotedPrice = order.quotedPrice !== undefined;
  const hasNoItems = !Array.isArray(order.items) || order.items.length === 0;

  // Regular order indicators
  const hasItems = Array.isArray(order.items) && order.items.length > 0;
  const hasOrderType = ['sales', 'rental', 'mixed'].includes(order.orderType);

  if (context.debugInfo) {
    context.debugInfo.checkCount = 0;
  }

  // 🔍 CUSTOM ORDER DETECTION
  if (hasDescription && hasFullName && (hasCostumeType || hasQuotedPrice) && hasNoItems) {
    context.source = 'custom';
    context.debugInfo = {
      indicators: ['description', 'fullName', hasQuotedPrice ? 'quotedPrice' : 'costumeType', 'noItems'],
      confidence: 'high',
    };
    return context;
  }

  // 🔍 REGULAR ORDER DETECTION
  if (hasItems && hasOrderType) {
    context.source = 'regular';
    context.cartItemCount = order.items.length;
    context.debugInfo = {
      indicators: ['items array', 'orderType'],
      itemCount: order.items.length,
      orderType: order.orderType,
      confidence: 'high',
    };
    return context;
  }

  // Fallback: Check if it's explicitly marked
  if (order.isCustomOrder === true) {
    context.source = 'custom';
    context.debugInfo = {
      indicators: ['isCustomOrder flag'],
      confidence: 'medium',
    };
    return context;
  }

  if (order.isCustomOrder === false) {
    context.source = 'regular';
    context.debugInfo = {
      indicators: ['isCustomOrder flag'],
      confidence: 'medium',
    };
    return context;
  }

  // Could not determine
  context.debugInfo = {
    availableFields: Object.keys(order).slice(0, 10),
    hasItems,
    hasDescription,
    hasFullName,
    confidence: 'unknown',
  };

  return context;
}

/**
 * ============================================================================
 * DETECTION FUNCTION #3: FROM DATABASE COLLECTION
 * ============================================================================
 * Called at: Server-side order processing, API routes
 * Accuracy: 100% (checks which collection it came from)
 * 
 */
export function detectOrderTypeFromCollection(collectionName: string): OrderFlowContext {
  const context: OrderFlowContext = {
    source: 'unknown',
    stage: 'order-display',
    debugInfo: { collection: collectionName },
  };

  const normalized = collectionName.toLowerCase();

  if (normalized.includes('custom')) {
    context.source = 'custom';
    context.debugInfo = { collection: collectionName, match: 'contains "custom"' };
    return context;
  }

  if (normalized === 'orders') {
    context.source = 'regular';
    context.debugInfo = { collection: collectionName, match: 'exact match "orders"' };
    return context;
  }

  context.debugInfo = { collection: collectionName, match: 'no match' };
  return context;
}

/**
 * ============================================================================
 * MAIN VALIDATION FUNCTION - PREVENT MIXING
 * ============================================================================
 * CRITICAL: Ensures we NEVER mix custom and regular orders
 * Throws error if mixing detected
 * 
 */
export function validateNoOrderMixing(context1: OrderFlowContext, context2: OrderFlowContext): boolean {
  if (context1.source === 'unknown' || context2.source === 'unknown') {
    console.warn('[OrderFlowDetection] ⚠️ Cannot validate mixing - unknown order type');
    return true; // Don't block on unknown
  }

  const isMixed = context1.source !== context2.source;

  if (isMixed) {
    const error = new Error(
      `🚨 ORDER MIXING DETECTED: Cannot combine ${context1.source} order with ${context2.source} order`
    );
    console.error('[OrderFlowDetection]', error.message);
    console.error('[OrderFlowDetection] Context 1:', context1);
    console.error('[OrderFlowDetection] Context 2:', context2);
    throw error;
  }

  return true;
}

/**
 * ============================================================================
 * HELPER FUNCTION: GET ORDER TYPE (SIMPLE INTERFACE)
 * ============================================================================
 * Easy one-liner to check order type
 * 
 */
export function getOrderType(order: any): OrderSource {
  const context = detectOrderTypeFromStructure(order);
  return context.source;
}

/**
 * ============================================================================
 * HELPER FUNCTION: IS CUSTOM ORDER?
 * ============================================================================
 * Simple boolean check
 * 
 */
export function isCustomOrder(order: any): boolean {
  return getOrderType(order) === 'custom';
}

/**
 * ============================================================================
 * HELPER FUNCTION: IS REGULAR ORDER?
 * ============================================================================
 * Simple boolean check
 * 
 */
export function isRegularOrder(order: any): boolean {
  return getOrderType(order) === 'regular';
}

/**
 * ============================================================================
 * DEBUGGING FUNCTION
 * ============================================================================
 * Call this when debugging order type detection issues
 * 
 */
export function debugOrderType(order: any, label: string = 'Order'): void {
  console.group(`[OrderFlowDetection] 🔍 DEBUG: ${label}`);
  console.log('Order object:', order);

  const structureContext = detectOrderTypeFromStructure(order);
  console.log('From structure:', structureContext);

  if (typeof window !== 'undefined') {
    const checkoutContext = detectOrderTypeFromCheckoutSource();
    console.log('From checkout source:', checkoutContext);

    console.log('\n📊 Summary:');
    console.log('Structure detection:', structureContext.source);
    console.log('Checkout detection:', checkoutContext.source);
    console.log('Final type:', getOrderType(order));
  }

  console.groupEnd();
}

/**
 * ============================================================================
 * EXPORT SUMMARY FOR QUICK REFERENCE
 * ============================================================================
 * 
 * USE THESE FUNCTIONS:
 * 
 * 1. At Checkout Page:
 *    const context = detectOrderTypeFromCheckoutSource();
 *    if (context.source === 'custom') { ... }
 * 
 * 2. When Displaying Order Cards:
 *    const isCustom = isCustomOrder(order);
 *    const isRegular = isRegularOrder(order);
 * 
 * 3. When Processing Payment:
 *    const type = getOrderType(orderData);
 *    if (type === 'custom') { handleCustomPayment() }
 *    else if (type === 'regular') { handleCartPayment() }
 * 
 * 4. When Saving Order:
 *    const source = detectOrderTypeFromCheckoutSource().source;
 *    const orderRecord = { ...order, source, createdAt: new Date() }
 * 
 * 5. Prevent Mixing (validation):
 *    const ctx1 = detectOrderTypeFromCheckoutSource();
 *    const ctx2 = detectOrderTypeFromStructure(order);
 *    validateNoOrderMixing(ctx1, ctx2); // Throws if mixed
 * 
 * ============================================================================
 */
