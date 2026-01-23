/**
 * CLIENT-SIDE ONLY: Finance Calculation Utilities
 * Fetches pre-calculated revenue values from transaction history without recalculation
 * Used in Project Overview dashboard
 */

/**
 * Helper function to determine transaction type from items array
 */
function getTransactionType(order: any): "sales" | "rentals" | "mixed" {
  if (!order.items || order.items.length === 0) return "sales";

  const hasSales = order.items.some((item: any) => item.mode === "buy");
  const hasRentals = order.items.some((item: any) => item.mode === "rent");

  if (hasRentals && !hasSales) return "rentals";
  if (hasSales && !hasRentals) return "sales";
  return "mixed";
}

/**
 * Fetch Total Online Sales from transaction history
 * Simply sums total amount from all online sales transactions
 */
export async function getTotalOnlineSales(): Promise<number> {
  try {
    const response = await fetch("/api/orders/unified");
    if (!response.ok) throw new Error("Failed to fetch transactions");

    const data = await response.json();
    const orders = data.orders || [];

    // Filter transactions where items contain only 'buy' mode (sales)
    const totalOnlineSales = orders
      .filter((order: any) => {
        if (order.isOffline) return false;
        const type = getTransactionType(order);
        return type === "sales";
      })
      .reduce((sum: number, order: any) => sum + (order.total || order.amount || 0), 0);

    return totalOnlineSales;
  } catch (error) {
    console.error("Error fetching Total Online Sales:", error);
    return 0;
  }
}

/**
 * Fetch Total Online Rentals from transaction history
 * Simply sums total amount from all online rental transactions
 */
export async function getTotalOnlineRentals(): Promise<number> {
  try {
    const response = await fetch("/api/orders/unified");
    if (!response.ok) throw new Error("Failed to fetch transactions");

    const data = await response.json();
    const orders = data.orders || [];

    // Filter transactions where items contain only 'rent' mode (rentals)
    const totalOnlineRentals = orders
      .filter((order: any) => {
        if (order.isOffline) return false;
        const type = getTransactionType(order);
        return type === "rentals";
      })
      .reduce((sum: number, order: any) => sum + (order.total || order.amount || 0), 0);

    return totalOnlineRentals;
  } catch (error) {
    console.error("Error fetching Total Online Rentals:", error);
    return 0;
  }
}

/**
 * Fetch Total Offline Sales from offline orders
 * Simply sums total amount from all offline sales transactions
 */
export async function getTotalOfflineSales(): Promise<number> {
  try {
    const response = await fetch("/api/admin/offline-orders");
    if (!response.ok) throw new Error("Failed to fetch offline orders");

    const data = await response.json();
    const offlineOrders = data.data || [];

    // Filter transactions where items contain only 'buy' mode (sales)
    const totalOfflineSales = offlineOrders
      .filter((order: any) => {
        const type = getTransactionType(order);
        return type === "sales";
      })
      .reduce((sum: number, order: any) => sum + (order.total || 0), 0);

    return totalOfflineSales;
  } catch (error) {
    console.error("Error fetching Total Offline Sales:", error);
    return 0;
  }
}

/**
 * Fetch Total Offline Rentals from offline orders
 * Simply sums total amount from all offline rental transactions
 */
export async function getTotalOfflineRentals(): Promise<number> {
  try {
    const response = await fetch("/api/admin/offline-orders");
    if (!response.ok) throw new Error("Failed to fetch offline orders");

    const data = await response.json();
    const offlineOrders = data.data || [];

    // Filter transactions where items contain only 'rent' mode (rentals)
    const totalOfflineRentals = offlineOrders
      .filter((order: any) => {
        const type = getTransactionType(order);
        return type === "rentals";
      })
      .reduce((sum: number, order: any) => sum + (order.total || 0), 0);

    return totalOfflineRentals;
  } catch (error) {
    console.error("Error fetching Total Offline Rentals:", error);
    return 0;
  }
}

/**
 * Fetch Total Daily Expenses (including VAT)
 * Total Expenses = Expense Amount + Input VAT
 * Both are costs incurred
 */
export async function getTotalDailyExpenses(): Promise<number> {
  try {
    const response = await fetch("/api/admin/offline-expenses");
    if (!response.ok) throw new Error("Failed to fetch expenses");

    const data = await response.json();
    const expenses = data.data || [];

    // Sum all expense amounts + VAT (total money spent)
    const totalExpenses = expenses.reduce(
      (sum: number, expense: any) => sum + (expense.amount || 0) + (expense.vat || 0),
      0
    );

    return totalExpenses;
  } catch (error) {
    console.error("Error fetching Total Daily Expenses:", error);
    return 0;
  }
}
