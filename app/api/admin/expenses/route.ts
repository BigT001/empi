import { NextRequest, NextResponse } from 'next/server';
import Expense from '@/lib/models/Expense';
import connectDB from '@/lib/mongodb';

/**
 * GET /api/admin/expenses
 * Fetch all expenses (with optional filters)
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const month = searchParams.get('month');
    const year = searchParams.get('year');

    // Build filter object
    const filter: any = {};

    if (status) {
      filter.status = status;
    }

    if (category) {
      filter.category = category;
    }

    if (month && year) {
      const monthStart = new Date(parseInt(year), parseInt(month), 1);
      const monthEnd = new Date(parseInt(year), parseInt(month) + 1, 0);
      filter.createdAt = {
        $gte: monthStart,
        $lte: monthEnd,
      };
    }

    const expenses = await Expense.find(filter).sort({ createdAt: -1 }).lean();

    // Calculate totals
    const totalAmount = expenses.reduce((sum: number, e: any) => sum + (e.amount || 0), 0);
    const totalVAT = expenses.reduce((sum: number, e: any) => sum + (e.vat || 0), 0);
    const totalPaid = expenses.reduce(
      (sum: number, e: any) => sum + (e.status === 'paid' ? e.total : 0),
      0
    );

    return NextResponse.json(
      {
        success: true,
        data: {
          expenses,
          summary: {
            totalAmount: Math.round(totalAmount * 100) / 100,
            totalVAT: Math.round(totalVAT * 100) / 100,
            totalPaid: Math.round(totalPaid * 100) / 100,
            count: expenses.length,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Expenses API - GET] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch expenses' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/expenses
 * Create a new expense
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const {
      description,
      category,
      amount,
      invoiceNumber,
      supplierName,
      paymentMethod,
      notes,
    } = body;

    // Validate required fields
    if (!description || !category || !amount || !paymentMethod) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate category
    const validCategories = ['supplier', 'utilities', 'rent', 'transport', 'packaging', 'other'];
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { success: false, error: 'Invalid category' },
        { status: 400 }
      );
    }

    // Calculate VAT (7.5%)
    const VAT_RATE = 7.5;
    const vat = Math.round((amount * (VAT_RATE / 100)) * 100) / 100;
    const total = Math.round((amount + vat) * 100) / 100;

    const expense = await Expense.create({
      description,
      category,
      amount,
      vat,
      vatRate: VAT_RATE,
      total,
      invoiceNumber,
      supplierName,
      paymentMethod,
      notes,
      status: 'pending',
    });

    return NextResponse.json(
      {
        success: true,
        data: expense,
        message: 'Expense created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[Expenses API - POST] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create expense' },
      { status: 500 }
    );
  }
}
