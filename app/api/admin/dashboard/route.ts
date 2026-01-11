import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Order from '@/lib/models/Order';
import Buyer from '@/lib/models/Buyer';
import Product from '@/lib/models/Product';
import CustomOrder from '@/lib/models/CustomOrder';

interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  pendingInvoices: number;
  totalRents: number;
  totalSales: number;
  totalRentOrders: number;
  totalSalesOrders: number;
  completedOrders: number;
  totalCustomers: number;
  registeredCustomers: number;
  guestCustomers: number;
  averageOrderValue: number;
  completionRate: number;
  timestamp: string;
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // Require admin session
    const adminId = request.cookies.get('admin_session')?.value;
    if (!adminId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    console.log('[Dashboard API] Fetching accurate real data...');

    // Fetch all data in parallel
    const [orders, buyers, products, customOrders] = await Promise.all([
      Order.find({}, '', { lean: true }),
      Buyer.find({}, '', { lean: true }),
      Product.find({}, '', { lean: true }),
      CustomOrder.find({}, '', { lean: true }).catch(() => []),
    ]);

    console.log('[Dashboard API] Retrieved - Orders:', orders.length, 'Buyers:', buyers.length, 'Products:', products.length, 'Custom Orders:', customOrders?.length || 0);

    // Calculate stats from real data
    let totalRevenue = 0;
    let totalRents = 0;
    let totalSales = 0;
    let totalRentOrders = 0;
    let totalSalesOrders = 0;
    let pendingInvoices = 0;
    // pendingOrders will include both regular orders and custom orders in pending/unpaid state
    let pendingOrders = 0;
    let completedOrders = 0;
    const buyerIdsSet = new Set<string>();
    const guestEmailsSet = new Set<string>();

    // Process each order
    orders.forEach((order: any) => {
      const amount = order.total || order.totalAmount || 0;
      totalRevenue += amount;

      // Track customer type
      if (order.buyerId) {
        // Registered customer
        buyerIdsSet.add(String(order.buyerId));
      } else if (order.email) {
        // Guest customer
        guestEmailsSet.add(order.email);
      }

      // Calculate sales vs rentals revenue and count orders
      let hasRental = false;
      let hasSale = false;
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach((item: any) => {
          const itemTotal = (item.price || 0) * (item.quantity || 1);
          if (item.mode === 'rent' || item.rentalDays) {
            totalRents += itemTotal;
            hasRental = true;
          } else {
            totalSales += itemTotal;
            hasSale = true;
          }
        });
      }
      // Count this as a rental or sales order (or both if mixed)
      if (hasRental) totalRentOrders += 1;
      if (hasSale) totalSalesOrders += 1;

        // Track order status — treat awaiting/payment-pending states as pending
        const oStatus = String(order.status || '').toLowerCase();
        const oPaymentStatus = String(order.paymentStatus || '').toLowerCase();
        const isPendingStatus = ['pending', 'unpaid', 'awaiting_payment'].includes(oStatus) || ['pending', 'awaiting_payment'].includes(oPaymentStatus);
        if (isPendingStatus) {
          pendingInvoices += 1;
          pendingOrders += 1;
        } else if (['completed', 'delivered'].includes(oStatus)) {
          completedOrders += 1;
        }
    });

      // Include custom orders pending count
      try {
        if (Array.isArray(customOrders)) {
          customOrders.forEach((co: any) => {
            if (co.status === 'pending') pendingOrders += 1;
            
            // Also track custom order customers
            if (co.buyerId) {
              buyerIdsSet.add(String(co.buyerId));
            } else if (co.email) {
              guestEmailsSet.add(co.email);
            }
          });
        }
      } catch (e) {
        console.warn('[Dashboard API] Failed to process custom orders', e);
      }

    // Count actual registered customers from Buyer collection
    const registeredCustomersCount = buyers.length;

    // Count unique guests from orders and custom orders
    const guestCustomersCount = guestEmailsSet.size;

    // Total unique customers
    const totalCustomersCount = buyerIdsSet.size + guestCustomersCount;

    console.log('[Dashboard API] Customer breakdown:', {
      registeredBuyerIds: buyerIdsSet.size,
      uniqueGuests: guestCustomersCount,
      totalCustomers: totalCustomersCount,
      buyerCollectionCount: registeredCustomersCount,
    });

    // Calculate metrics
    const averageOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;
    const completionRate = orders.length > 0 ? (completedOrders / orders.length) * 100 : 0;

    const stats: DashboardStats = {
      totalRevenue,
      totalOrders: orders.length,
      totalProducts: products.length,
      pendingInvoices,
      // include pendingOrders for UI counts (regular + custom pending orders)
      // @ts-ignore - extend with dynamic field
      pendingOrders: pendingOrders,
      totalRents,
      totalSales,
      totalRentOrders,
      totalSalesOrders,
      completedOrders,
      totalCustomers: totalCustomersCount,
      registeredCustomers: registeredCustomersCount,
      guestCustomers: guestCustomersCount,
      averageOrderValue,
      completionRate,
      timestamp: new Date().toISOString(),
    };

    console.log('[Dashboard API] Calculated stats:', {
      totalRevenue,
      totalOrders: orders.length,
      totalRentOrders,
      totalSalesOrders,
      registeredCustomers: registeredCustomersCount,
      guestCustomers: guestCustomersCount,
      totalCustomers: totalCustomersCount,
      completionRate: completionRate.toFixed(2) + '%',
    });

    return NextResponse.json(stats);
  } catch (err: any) {
    console.error('[Dashboard API] Error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}
