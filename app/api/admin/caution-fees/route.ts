import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import CautionFeeTransaction from '@/lib/models/CautionFeeTransaction';
import Order from '@/lib/models/Order';
import Admin from '@/lib/models/Admin';

/**
 * GET: Fetch caution fee transactions
 * POST: Create a refund for a caution fee
 * PATCH: Update caution fee status
 */

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // Verify admin session
    const adminId = request.cookies.get('admin_session')?.value;
    if (!adminId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const admin = await Admin.findById(adminId);
    if (!admin) {
      return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const buyerId = searchParams.get('buyerId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = parseInt(searchParams.get('skip') || '0');

    // Build filter
    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    if (buyerId) filter.buyerId = buyerId;

    // Fetch caution fees
    const cautionFees = await CautionFeeTransaction.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);

    const total = await CautionFeeTransaction.countDocuments(filter);

    // Calculate summary
    const collected = await CautionFeeTransaction.aggregate([
      { $match: { status: { $in: ['collected', 'pending_return'] } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    const refunded = await CautionFeeTransaction.aggregate([
      { $match: { status: 'refunded' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    const partially = await CautionFeeTransaction.aggregate([
      { $match: { status: 'partially_refunded' } },
      { $group: { _id: null, total: { $sum: '$refundAmount' } } },
    ]);

    const forfeited = await CautionFeeTransaction.aggregate([
      { $match: { status: 'forfeited' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    return NextResponse.json({
      cautionFees,
      pagination: { total, limit, skip },
      summary: {
        collectedAmount: collected[0]?.total || 0,
        refundedAmount: refunded[0]?.total || 0,
        partiallyRefundedAmount: partially[0]?.total || 0,
        forfeitedAmount: forfeited[0]?.total || 0,
      },
    });
  } catch (error) {
    console.error('[Caution Fee API] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await connectDB();

    // Verify admin session
    const adminId = request.cookies.get('admin_session')?.value;
    if (!adminId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const admin = await Admin.findById(adminId);
    if (!admin) {
      return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
    }

    const body = await request.json();
    const { cautionFeeId, action, costumeCondition, deductionAmount, deductionReason, notes } =
      body;

    if (!cautionFeeId || !action) {
      return NextResponse.json(
        { error: 'Missing required fields: cautionFeeId, action' },
        { status: 400 }
      );
    }

    const cautionFee = await CautionFeeTransaction.findById(cautionFeeId);
    if (!cautionFee) {
      return NextResponse.json({ error: 'Caution fee not found' }, { status: 404 });
    }

    let status: string;
    let refundAmount = 0;

    if (action === 'refund_full') {
      // Full refund
      status = 'refunded';
      refundAmount = cautionFee.amount;
      cautionFee.timeline.returnedAt = new Date();
      cautionFee.timeline.refundedAt = new Date();
    } else if (action === 'refund_partial') {
      // Partial refund (damaged)
      if (!deductionAmount || !deductionReason) {
        return NextResponse.json(
          { error: 'Partial refund requires deductionAmount and deductionReason' },
          { status: 400 }
        );
      }
      status = 'partially_refunded';
      refundAmount = cautionFee.amount - deductionAmount;
      cautionFee.deductionAmount = deductionAmount;
      cautionFee.deductionReason = deductionReason;
      cautionFee.timeline.returnedAt = new Date();
      cautionFee.timeline.refundedAt = new Date();
    } else if (action === 'forfeit') {
      // Forfeit (lost or damaged beyond repair)
      status = 'forfeited';
      refundAmount = 0;
      cautionFee.timeline.returnedAt = new Date();
    } else {
      return NextResponse.json(
        { error: `Invalid action: ${action}. Use 'refund_full', 'refund_partial', or 'forfeit'` },
        { status: 400 }
      );
    }

    cautionFee.status = status as 'collected' | 'pending_return' | 'refunded' | 'partially_refunded' | 'forfeited';
    cautionFee.costumeCondition = costumeCondition;
    cautionFee.refundAmount = refundAmount;
    if (notes) cautionFee.notes = notes;

    await cautionFee.save();

    // Update order status if needed
    const order = await Order.findById(cautionFee.rentalOrderId);
    if (order && status === 'refunded') {
      // Mark order as returned/completed
      order.status = 'delivered';
      await order.save();
    }

    return NextResponse.json({
      message: `Caution fee ${action} completed successfully`,
      cautionFee,
      refundAmount,
    });
  } catch (error) {
    console.error('[Caution Fee API] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
