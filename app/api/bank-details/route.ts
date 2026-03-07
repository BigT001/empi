import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Settings from '@/lib/models/Settings';

export async function GET(req: NextRequest) {
    try {
        await connectDB();

        const settings = await Settings.findOne({});

        if (!settings) {
            return NextResponse.json(
                { bank: null },
                { status: 200 }
            );
        }

        // Find the active bank account
        const activeBank = settings.bankAccounts?.find((b: any) => b.isActive);

        // If no active bank found in array, fall back to legacy fields
        if (!activeBank && settings.bankName) {
            return NextResponse.json({
                bank: {
                    bankName: settings.bankName,
                    accountName: settings.bankAccountName,
                    accountNumber: settings.bankAccountNumber,
                    instructions: settings.transferInstructions,
                }
            });
        }

        return NextResponse.json({
            bank: activeBank || null,
            paymentMethods: settings.paymentMethods || { manual: true, paystack: true }
        });
    } catch (error) {
        console.error('[Public Bank Details GET] Error:', error);
        return NextResponse.json(
            { error: 'Failed to retrieve bank details' },
            { status: 500 }
        );
    }
}
