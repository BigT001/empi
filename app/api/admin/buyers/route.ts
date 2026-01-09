import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Buyer from '@/lib/models/Buyer';
import Order from '@/lib/models/Order';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // Require admin session
    const adminId = request.cookies.get('admin_session')?.value;
    if (!adminId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    // Fetch all buyers sorted by most recent first
    const buyers = await Buyer.find({}, '-password').sort({ createdAt: -1 }).lean();
    console.log(`[Admin API] Fetching ${buyers.length} buyers from database`);

    // For each buyer, compute order count
    const results = await Promise.all(
      buyers.map(async (b: any) => {
        const orderCount = await Order.countDocuments({ buyerId: b._id }).catch(() => 0);
        return {
          _id: b._id,
          email: b.email,
          phone: b.phone || '',
          fullName: b.fullName || 'Unknown',
          address: b.address || '',
          city: b.city || '',
          state: b.state || '',
          postalCode: b.postalCode || '',
          createdAt: b.createdAt,
          lastLogin: b.lastLogin,
          isAdmin: b.isAdmin || false,
          orderCount,
        };
      })
    );

    console.log(`[Admin API] Returning ${results.length} buyers with order counts`);

    return NextResponse.json({ 
      buyers: results,
      total: results.length,
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    console.error('[Admin API] Get buyers error:', err);
    return NextResponse.json({ error: err.message || 'Failed to fetch buyers' }, { status: 500 });
  }
}
