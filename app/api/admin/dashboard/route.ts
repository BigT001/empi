import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Order from '@/lib/models/Order';
import Buyer from '@/lib/models/Buyer';
import Product from '@/lib/models/Product';

interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  pendingInvoices: number;
  totalRents: number;
  totalSales: number;
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
    const [orders, buyers, products] = await Promise.all([
      Order.find({}, '', { lean: true }),
      Buyer.find({}, '', { lean: true }),
      Product.find({}, '', { lean: true }),
    ]);

    console.log('[Dashboard API] Retrieved - Orders:', orders.length, 'Buyers:', buyers.length, 'Products:', products.length);

    // Calculate stats from real data
    let totalRevenue = 0;
    let totalRents = 0;
    let totalSales = 0;
    let pendingInvoices = 0;
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

      // Calculate sales vs rentals revenue
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach((item: any) => {
          const itemTotal = (item.price || 0) * (item.quantity || 1);
          if (item.mode === 'rent' || item.rentalDays) {
            totalRents += itemTotal;
          } else {
            totalSales += itemTotal;
          }
        });
      }

      // Track order status
      if (order.status === 'pending' || order.status === 'unpaid') {
        pendingInvoices += 1;
      } else if (order.status === 'completed' || order.status === 'delivered') {
        completedOrders += 1;
      }
    });

    // Count actual registered customers from Buyer collection
    const registeredCustomersCount = buyers.length;

    // Count unique guests from orders
    const guestCustomersCount = guestEmailsSet.size;

    // Total unique customers
    const totalCustomersCount = registeredCustomersCount + guestCustomersCount;

    // Calculate metrics
    const averageOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;
    const completionRate = orders.length > 0 ? (completedOrders / orders.length) * 100 : 0;

    const stats: DashboardStats = {
      totalRevenue,
      totalOrders: orders.length,
      totalProducts: products.length,
      pendingInvoices,
      totalRents,
      totalSales,
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
      registeredCustomers: registeredCustomersCount,
      guestCustomers: guestCustomersCount,
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
