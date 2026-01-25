/**
 * CLIENT-SIDE ONLY: VAT Calculation Utilities
 * Fetches pre-calculated VAT values from APIs without any server-side model imports
 * Safe to use in client components
 */

/**
 * Fetch Total Online Sales from transaction history
 */
export async function getTotalOnlineSales(): Promise<number> {
  try {
    const response = await fetch("/api/orders/unified");
    if (!response.ok) throw new Error("Failed to fetch transactions");

    const data = await response.json();
    const orders = data.orders || [];

    // Sum sales from all online (non-offline) transactions with mode='buy'
    const totalOnlineSales = orders
      .filter((order: any) => !order.isOffline && order.items?.some((item: any) => item.mode === "buy"))
      .reduce((sum: number, order: any) => {
        const salesAmount = order.items
          ?.filter((item: any) => item.mode === "buy")
          .reduce((itemSum: number, item: any) => itemSum + ((item.price || 0) * (item.quantity || 0)), 0) || 0;
        return sum + salesAmount;
      }, 0);

    return totalOnlineSales;
  } catch (error) {
    console.error("Error fetching Total Online Sales:", error);
    return 0;
  }
}

/**
 * Fetch Total Online Rentals from transaction history
 */
export async function getTotalOnlineRentals(): Promise<number> {
  try {
    const response = await fetch("/api/orders/unified");
    if (!response.ok) throw new Error("Failed to fetch transactions");

    const data = await response.json();
    const orders = data.orders || [];

    // Sum rentals from all online (non-offline) transactions with mode='rent'
    const totalOnlineRentals = orders
      .filter((order: any) => !order.isOffline && order.items?.some((item: any) => item.mode === "rent"))
      .reduce((sum: number, order: any) => {
        const rentalsAmount = order.items
          ?.filter((item: any) => item.mode === "rent")
          .reduce((itemSum: number, item: any) => itemSum + ((item.price || 0) * (item.quantity || 0)), 0) || 0;
        return sum + rentalsAmount;
      }, 0);

    return totalOnlineRentals;
  } catch (error) {
    console.error("Error fetching Total Online Rentals:", error);
    return 0;
  }
}

/**
 * Fetch Total Offline Sales from offline orders
 */
export async function getTotalOfflineSales(): Promise<number> {
  try {
    const response = await fetch("/api/admin/offline-orders");
    if (!response.ok) throw new Error("Failed to fetch offline orders");

    const data = await response.json();
    const offlineOrders = data.data || [];

    // Sum sales from all offline orders with mode='buy' (excluding VAT)
    const totalOfflineSales = offlineOrders
      .filter((order: any) => order.items?.some((item: any) => item.mode === "buy"))
      .reduce((sum: number, order: any) => {
        const salesAmount = order.items
          ?.filter((item: any) => item.mode === "buy")
          .reduce((itemSum: number, item: any) => itemSum + ((item.price || 0) * (item.quantity || 0)), 0) || 0;
        return sum + salesAmount;
      }, 0);

    return totalOfflineSales;
  } catch (error) {
    console.error("Error fetching Total Offline Sales:", error);
    return 0;
  }
}

/**
 * Fetch Total Offline Rentals from offline orders
 */
export async function getTotalOfflineRentals(): Promise<number> {
  try {
    const response = await fetch("/api/admin/offline-orders");
    if (!response.ok) throw new Error("Failed to fetch offline orders");

    const data = await response.json();
    const offlineOrders = data.data || [];

    // Sum rentals from all offline orders with mode='rent' (excluding VAT)
    const totalOfflineRentals = offlineOrders
      .filter((order: any) => order.items?.some((item: any) => item.mode === "rent"))
      .reduce((sum: number, order: any) => {
        const rentalsAmount = order.items
          ?.filter((item: any) => item.mode === "rent")
          .reduce((itemSum: number, item: any) => itemSum + ((item.price || 0) * (item.quantity || 0)), 0) || 0;
        return sum + rentalsAmount;
      }, 0);

    return totalOfflineRentals;
  } catch (error) {
    console.error("Error fetching Total Offline Rentals:", error);
    return 0;
  }
}

/**
 * Fetch Total Daily Expenses
 */
export async function getTotalDailyExpenses(): Promise<number> {
  try {
    const response = await fetch("/api/admin/offline-expenses");
    if (!response.ok) throw new Error("Failed to fetch expenses");

    const data = await response.json();
    const expenses = data.data || [];

    // Sum all expense amounts
    const totalExpenses = expenses.reduce(
      (sum: number, expense: any) => sum + (expense.amount || 0),
      0
    );

    return totalExpenses;
  } catch (error) {
    console.error("Error fetching Total Daily Expenses:", error);
    return 0;
  }
}

/**
 * Fetch Total Online VAT from transaction history
 * Does NOT recalculate - simply sums VAT from all online transactions
 */
export async function getTotalOnlineVAT(): Promise<number> {
  try {
    const response = await fetch("/api/orders/unified?t=" + Date.now(), {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });
    if (!response.ok) {
      throw new Error("Failed to fetch transactions");
    }

    const data = await response.json();
    const orders = data.orders || [];

    // Sum VAT from all online (non-offline) transactions
    const totalOnlineVAT = orders
      .filter((order: any) => !order.isOffline) // Only online orders
      .reduce((sum: number, order: any) => sum + (order.vat || 0), 0);

    return totalOnlineVAT;
  } catch (error) {
    console.error("Error fetching Total Online VAT:", error);
    return 0;
  }
}

/**
 * Fetch Total Offline VAT from offline orders/sales
 */
export async function getTotalOfflineVAT(): Promise<number> {
  try {
    const response = await fetch("/api/admin/offline-orders?t=" + Date.now(), {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });
    if (!response.ok) {
      throw new Error("Failed to fetch offline orders");
    }

    const data = await response.json();
    const offlineOrders = data.data || []; // API returns data in 'data' property

    // Sum VAT from all offline orders (both sales and rentals)
    const totalOfflineVAT = offlineOrders.reduce(
      (sum: number, order: any) => sum + (order.vat || 0),
      0
    );

    return totalOfflineVAT;
  } catch (error) {
    console.error("Error fetching Total Offline VAT:", error);
    return 0;
  }
}

/**
 * Fetch Total Input VAT from daily expenses
 */
export async function getTotalInputVAT(): Promise<number> {
  try {
    const response = await fetch("/api/admin/offline-expenses?t=" + Date.now(), {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });
    if (!response.ok) {
      throw new Error("Failed to fetch expenses");
    }

    const data = await response.json();
    const expenses = data.data || []; // API returns expenses in 'data' property

    // Sum VAT from all expenses (only VAT-applicable expenses)
    const totalInputVAT = expenses.reduce(
      (sum: number, expense: any) => 
        expense.isVATApplicable ? sum + (expense.vat || 0) : sum,
      0
    );

    return totalInputVAT;
  } catch (error) {
    console.error("Error fetching Total Input VAT:", error);
    return 0;
  }
}

/**
 * Calculate Net Payable VAT
 * Net Payable = Total Online VAT + Total Offline VAT - Total Input VAT
 */
export async function getNetPayableVAT(): Promise<number> {
  try {
    const onlineVAT = await getTotalOnlineVAT();
    const offlineVAT = await getTotalOfflineVAT();
    const inputVAT = await getTotalInputVAT();

    const netPayable = onlineVAT + offlineVAT - inputVAT;
    return Math.max(netPayable, 0); // Never negative
  } catch (error) {
    console.error("Error calculating Net Payable VAT:", error);
    return 0;
  }
}
