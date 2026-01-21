/**
 * Order Diagnostics Utility
 * 
 * Helps identify where the 'mode' field is being lost in the order system
 * Track the data flow: Checkout → API → Database
 */

/**
 * Check if an order has mode field properly set on all items
 * @param order - Order object from database
 * @returns Diagnostic report
 */
export function checkOrderModeIntegrity(order: any) {
  const report = {
    orderNumber: order.orderNumber,
    orderType: order.orderType,
    itemCount: order.items?.length || 0,
    allItemsHaveMode: true,
    itemsWithoutMode: [] as string[],
    itemDetails: [] as any[],
  };

  if (!order.items || !Array.isArray(order.items)) {
    report.allItemsHaveMode = false;
    return report;
  }

  order.items.forEach((item: any, idx: number) => {
    const itemInfo = {
      index: idx,
      name: item.name,
      mode: item.mode || 'MISSING',
      hasMode: !!item.mode,
      quantity: item.quantity,
      price: item.unitPrice || item.price,
    };
    report.itemDetails.push(itemInfo);

    if (!item.mode) {
      report.allItemsHaveMode = false;
      report.itemsWithoutMode.push(`Item ${idx + 1}: ${item.name}`);
    }
  });

  return report;
}

/**
 * Format order mode diagnostics for logging
 * @param order - Order object
 */
export function logOrderModeDiagnostics(order: any, context: string = 'Order') {
  const report = checkOrderModeIntegrity(order);
  
  console.log(`\n[${context}] Mode Field Diagnostics:`, {
    orderNumber: report.orderNumber,
    orderType: report.orderType,
    totalItems: report.itemCount,
    allHaveMode: report.allItemsHaveMode ? '✅ YES' : '❌ NO',
    itemsWithoutMode: report.itemsWithoutMode.length,
  });

  console.log(`[${context}] Item Details:`);
  report.itemDetails.forEach((item: any) => {
    const modeEmoji = item.hasMode ? (item.mode === 'rent' ? '🔄' : '🛍️') : '⚠️';
    console.log(
      `  [${item.index + 1}] ${modeEmoji} "${item.name}" | Mode: ${item.mode} | Qty: ${item.quantity} | Price: ₦${item.price}`
    );
  });

  if (!report.allItemsHaveMode) {
    console.warn(`\n⚠️  ALERT: ${report.itemsWithoutMode.length} item(s) missing mode field!`);
    console.warn(`Items without mode: ${report.itemsWithoutMode.join(', ')}`);
  }

  return report;
}

/**
 * Validate that checkout items have mode before sending to API
 * @param items - Items from cart/checkout
 */
export function validateCheckoutItemsModes(items: any[]) {
  console.log('[Checkout Validation] 🔍 Validating item modes...');

  const validation = {
    totalItems: items.length,
    itemsWithMode: 0,
    itemsWithoutMode: 0,
    issues: [] as string[],
    breakdown: [] as any[],
  };

  items.forEach((item: any, idx: number) => {
    const itemInfo = {
      name: item.name,
      mode: item.mode || 'MISSING',
      hasMode: !!item.mode,
    };
    validation.breakdown.push(itemInfo);

    if (item.mode) {
      validation.itemsWithMode++;
    } else {
      validation.itemsWithoutMode++;
      validation.issues.push(`Item ${idx + 1} ("${item.name}") has no mode field`);
    }
  });

  console.log('[Checkout Validation] Summary:', {
    total: validation.totalItems,
    withMode: validation.itemsWithMode,
    withoutMode: validation.itemsWithoutMode,
  });

  if (validation.itemsWithoutMode > 0) {
    console.error('[Checkout Validation] ❌ MODE MISSING on items:', validation.issues);
  } else {
    console.log('[Checkout Validation] ✅ All items have mode field');
  }

  return validation;
}

/**
 * Determine order type based on items
 * @param items - Order items
 * @returns 'rental' | 'sales' | 'mixed'
 */
export function determineOrderType(items: any[]): 'rental' | 'sales' | 'mixed' {
  const hasRental = items.some((item: any) => item.mode === 'rent');
  const hasSales = items.some((item: any) => item.mode === 'buy');

  if (hasRental && hasSales) return 'mixed';
  if (hasRental) return 'rental';
  if (hasSales) return 'sales';
  
  // Default if no modes set - should not happen in production
  return 'sales';
}

/**
 * Check if an item should incur caution fee (rental items only)
 * @param item - Order item
 */
export function shouldHaveCautionFee(item: any): boolean {
  return item.mode === 'rent';
}
