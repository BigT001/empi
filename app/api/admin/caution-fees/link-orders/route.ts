import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Order from '@/lib/models/Order';
import CautionFeeTransaction from '@/lib/models/CautionFeeTransaction';
import Admin from '@/lib/models/Admin';

/**
 * POST: Link existing orders with caution fees to CautionFeeTransaction records
 * This is a one-time bulk operation to link historical data
 */

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    // Verify admin session
    const adminId = request.cookies.get('admin_session')?.value;
    if (!adminId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const admin = await Admin.findById(adminId);
    if (!admin || !['super_admin', 'finance_admin'].includes(String(admin.role))) {
      return NextResponse.json({ error: 'Forbidden - requires super_admin or finance_admin' }, { status: 403 });
    }

    console.log('[Caution Fee Linking] Starting bulk link operation...');

    // Find all orders with caution fees that don't have a transaction linked
    const ordersToLink = await Order.find({
      cautionFee: { $gt: 0 },
      cautionFeeTransactionId: { $exists: false },
    });

    console.log(`[Caution Fee Linking] Found ${ordersToLink.length} orders to link`);

    let linkedCount = 0;
    let errorCount = 0;
    const errors: Array<{ orderNumber: string; error: string }> = [];

    // Link each order to a caution fee transaction
    for (const order of ordersToLink) {
      try {
        const orderObj = order as any;

        // Check if a transaction already exists for this order
        let transaction = await CautionFeeTransaction.findOne({
          rentalOrderId: order._id,
        });

        if (!transaction) {
          // Create new transaction
          transaction = new CautionFeeTransaction({
            rentalOrderId: order._id,
            buyerId: orderObj.buyerId || undefined,
            buyerEmail: orderObj.email,
            buyerName: `${orderObj.firstName} ${orderObj.lastName}`,
            amount: orderObj.cautionFee,
            status: 'collected', // Default status for existing orders
            timeline: {
              collectedAt: orderObj.createdAt || new Date(),
            },
          });

          await transaction.save();
          console.log(
            `  ✓ Created transaction for order ${orderObj.orderNumber} (Fee: ₦${orderObj.cautionFee})`
          );
        }

        // Link the order to the transaction
        orderObj.cautionFeeTransactionId = transaction._id;
        await order.save();
        linkedCount++;
      } catch (err) {
        errorCount++;
        const orderNumber = (order as any).orderNumber || 'Unknown';
        const errorMsg = err instanceof Error ? err.message : String(err);
        errors.push({ orderNumber, error: errorMsg });
        console.error(`  ✗ Error linking ${orderNumber}:`, errorMsg);
      }
    }

    console.log(
      `[Caution Fee Linking] Complete: ${linkedCount} linked, ${errorCount} errors`
    );

    return NextResponse.json({
      message: 'Caution fee linking completed',
      summary: {
        totalOrders: ordersToLink.length,
        linkedCount,
        errorCount,
        errors,
      },
    });
  } catch (err) {
    console.error('[Caution Fee Linking] Error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET: Check linking status
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // Verify admin session
    const adminId = request.cookies.get('admin_session')?.value;
    if (!adminId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Count unlinked orders
    const unlinkedOrders = await Order.countDocuments({
      cautionFee: { $gt: 0 },
      cautionFeeTransactionId: { $exists: false },
    });

    const linkedOrders = await Order.countDocuments({
      cautionFee: { $gt: 0 },
      cautionFeeTransactionId: { $exists: true },
    });

    const totalCautionFeeOrders = await Order.countDocuments({
      cautionFee: { $gt: 0 },
    });

    const totalTransactions = await CautionFeeTransaction.countDocuments();

    return NextResponse.json({
      linking_status: {
        totalOrdersWithCautionFee: totalCautionFeeOrders,
        linkedOrders,
        unlinkedOrders,
        totalCautionFeeTransactions: totalTransactions,
        linkingComplete: unlinkedOrders === 0,
      },
    });
  } catch (err) {
    console.error('[Caution Fee Linking] Error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
