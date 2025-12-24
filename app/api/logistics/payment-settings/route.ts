import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import mongoose from 'mongoose';

// Define PaymentCard schema inline
const paymentCardSchema = new mongoose.Schema({
  bankName: { type: String, required: true },
  accountNumber: { type: String, required: true },
  accountHolderName: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

// Define LogisticsSettings schema
const logisticsSettingsSchema = new mongoose.Schema({
  paymentCards: [paymentCardSchema],
  updatedAt: { type: Date, default: Date.now },
});

// Get or create the model
let LogisticsSettings: any;
try {
  LogisticsSettings = mongoose.model('LogisticsSettings');
} catch {
  LogisticsSettings = mongoose.model('LogisticsSettings', logisticsSettingsSchema);
}

// GET - Retrieve payment cards
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const settings = await LogisticsSettings.findOne({});
    if (!settings) {
      return NextResponse.json({ paymentCards: [] });
    }

    return NextResponse.json({
      paymentCards: settings.paymentCards || [],
    });
  } catch (error) {
    console.error('[Payment Settings] GET Error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve payment settings' },
      { status: 500 }
    );
  }
}

// POST - Add payment card
export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();
    const { bankName, accountNumber, accountHolderName } = body;

    // Validation
    if (!bankName || !accountNumber || !accountHolderName) {
      return NextResponse.json(
        { error: 'Bank name, account number, and account holder name are required' },
        { status: 400 }
      );
    }

    // Get or create settings document
    let settings = await LogisticsSettings.findOne({});
    if (!settings) {
      settings = new LogisticsSettings({ paymentCards: [] });
    }

    // Check maximum limit
    if (settings.paymentCards.length >= 2) {
      return NextResponse.json(
        { error: 'Maximum of 2 payment cards allowed' },
        { status: 400 }
      );
    }

    // Add new card
    settings.paymentCards.push({
      bankName,
      accountNumber,
      accountHolderName,
      createdAt: new Date(),
    });

    settings.updatedAt = new Date();
    await settings.save();

    console.log('[Payment Settings] Card added successfully');

    return NextResponse.json({
      success: true,
      paymentCards: settings.paymentCards,
      message: 'Payment card added successfully',
    });
  } catch (error) {
    console.error('[Payment Settings] POST Error:', error);
    return NextResponse.json(
      { error: 'Failed to save payment card' },
      { status: 500 }
    );
  }
}

// DELETE - Remove payment card
export async function DELETE(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const cardId = searchParams.get('cardId');

    if (!cardId) {
      return NextResponse.json(
        { error: 'Card ID is required' },
        { status: 400 }
      );
    }

    let settings = await LogisticsSettings.findOne({});
    if (!settings) {
      return NextResponse.json(
        { error: 'Settings not found' },
        { status: 404 }
      );
    }

    // Remove card by ID
    settings.paymentCards = settings.paymentCards.filter(
      (card: any) => card._id.toString() !== cardId
    );

    settings.updatedAt = new Date();
    await settings.save();

    console.log('[Payment Settings] Card deleted successfully');

    return NextResponse.json({
      success: true,
      paymentCards: settings.paymentCards,
      message: 'Payment card deleted successfully',
    });
  } catch (error) {
    console.error('[Payment Settings] DELETE Error:', error);
    return NextResponse.json(
      { error: 'Failed to delete payment card' },
      { status: 500 }
    );
  }
}
