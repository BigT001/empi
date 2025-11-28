import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Expense from '@/lib/models/Expense';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'all';
    const category = searchParams.get('category') || 'all';
    const isOffline = searchParams.get('isOffline') === 'true';

    // Build query filter
    const filter: any = {};

    if (status !== 'all') {
      filter.status = status;
    }

    if (category !== 'all') {
      filter.category = category;
    }

    if (isOffline) {
      filter.isOffline = true;
    }

    // Fetch expenses sorted by date (newest first)
    const expenses = await Expense.find(filter)
      .sort({ date: -1, createdAt: -1 })
      .lean()
      .exec();

    // Format response
    const formattedExpenses = expenses.map((expense: any) => ({
      _id: expense._id.toString(),
      description: expense.description,
      category: expense.category,
      amount: expense.amount,
      vat: expense.vat,
      status: expense.status,
      date: expense.date || expense.createdAt,
      createdAt: expense.createdAt,
      invoiceNumber: expense.invoiceNumber,
      receipNumber: expense.receipNumber,
      supplierName: expense.supplierName,
      isOffline: expense.isOffline || false,
    }));

    return NextResponse.json(
      {
        success: true,
        expenses: formattedExpenses,
        count: formattedExpenses.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching expenses:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch expenses',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();

    // Validate required fields
    if (!body.description || !body.category || typeof body.amount !== 'number') {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: description, category, amount',
        },
        { status: 400 }
      );
    }

    // Calculate VAT (7.5% by default)
    const vatRate = body.vatRate || 7.5;
    const vat = (body.amount * vatRate) / 100;

    // Create new expense
    const newExpense = new Expense({
      description: body.description,
      category: body.category,
      amount: body.amount,
      vat: Math.round(vat * 100) / 100, // Round to 2 decimal places
      vatRate,
      total: body.amount + vat,
      invoiceNumber: body.invoiceNumber,
      receiptNumber: body.receiptNumber,
      supplierName: body.supplierName,
      vendorName: body.vendorName,
      paymentMethod: body.paymentMethod || 'cash',
      status: body.status || 'verified',
      notes: body.notes,
      isOffline: body.isOffline !== undefined ? body.isOffline : true,
      date: body.date ? new Date(body.date) : new Date(),
    });

    const savedExpense = await newExpense.save();

    return NextResponse.json(
      {
        success: true,
        message: 'Expense created successfully',
        expense: {
          _id: savedExpense._id.toString(),
          description: savedExpense.description,
          category: savedExpense.category,
          amount: savedExpense.amount,
          vat: savedExpense.vat,
          status: savedExpense.status,
          date: savedExpense.date || savedExpense.createdAt,
          createdAt: savedExpense.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating expense:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create expense',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
