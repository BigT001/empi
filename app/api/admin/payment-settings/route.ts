import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Settings from '@/lib/models/Settings';

export async function POST(req: NextRequest) {
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
