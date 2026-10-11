import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Settings from '@/lib/models/Settings';
import { requireAdmin } from '@/lib/adminAuth';

export async function POST(req: NextRequest) {
  const unauthorized = await requireAdmin(req);
  if (unauthorized) return unauthorized;
    try {
        const { manual, paystack } = await req.json();

        await connectDB();

        let settings = await Settings.findOne({});
        if (!settings) {
            settings = new Settings({
                bankAccounts: [],
            });
        }

        settings.paymentMethods = {
            manual: manual === true,
            paystack: paystack === true,
        };

        await settings.save();

        return NextResponse.json({
            success: true,
            paymentMethods: settings.paymentMethods,
        });
    } catch (error) {
        console.error('[Payment Settings POST] Error:', error);
        return NextResponse.json(
            { error: 'Failed to update payment settings' },
            { status: 500 }
        );
    }
}
