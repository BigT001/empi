import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Expense from '@/lib/models/Expense';
import { serializeDoc, serializeDocs } from '@/lib/serializer';

// POST - Create offline expense
export async function POST(request: NextRequest) {
  try {
    console.log("🔄 [POST /api/admin/offline-expenses] Request received");
    await connectDB();
    const body = await request.json();
    
    console.log("📦 [Request Body]:", JSON.stringify(body, null, 2));

    // Validate required fields
    if (!body.description) {
      console.warn("⚠️ Validation failed: Description is required");
      return NextResponse.json(
        { error: 'Description is required' },
        { status: 400 }
      );
    }

    if (!body.amount || parseFloat(body.amount) <= 0) {
      console.warn("⚠️ Validation failed: Amount must be greater than 0");
      return NextResponse.json(
        { error: 'Amount must be greater than 0' },
        { status: 400 }
      );
    }

    const amount = parseFloat(body.amount);
    const vat = body.isVATApplicable 
      ? parseFloat(body.vat || (amount * 0.075).toFixed(2))
      : 0; // No VAT if not applicable

    console.log("📝 Creating expense with:", {
      description: body.description.trim(),
      category: body.category || 'other',
      vendorName: body.vendorName || 'Unknown Vendor',
      amount,
      vat,
      vatRate: 7.5,
      isVATApplicable: body.isVATApplicable ?? true,
      notes: body.notes || '',
      date: new Date(),
      status: 'verified',
      isOffline: true,
    });

    // Create offline expense
    const offlineExpense = new Expense({
      description: body.description.trim(),
      category: body.category || 'other',
      vendorName: body.vendorName || 'Unknown Vendor',
      amount,
      vat,
      vatRate: 7.5,
      total: amount + vat,  // Calculate total
      isVATApplicable: body.isVATApplicable ?? true, // Default to true if not specified
      paymentMethod: body.paymentMethod || 'cash',  // Default to cash
      notes: body.notes || '',
      date: new Date(),
      status: 'verified', // Offline expenses are auto-verified
      isOffline: true, // Mark as offline expense
      receiptNumber: `OFF-EXP-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
    });

    console.log("💾 Saving to database...");
    await offlineExpense.save();
    console.log(`✅ Offline expense created: ${offlineExpense._id} for ${body.description}`);

    try {
      const serialized = serializeDoc(offlineExpense);
      console.log("✅ Serialized data:", JSON.stringify(serialized, null, 2));
      
      return NextResponse.json({
        success: true,
        expenseId: offlineExpense._id,
        message: 'Offline expense saved successfully',
        data: serialized,
      }, { status: 201 });
    } catch (serializeError) {
      console.error("⚠️ Error serializing data:", serializeError);
      // Return minimal response if serialization fails
      return NextResponse.json({
        success: true,
        expenseId: offlineExpense._id,
        message: 'Offline expense saved successfully (serialization partial)',
        data: {
          _id: offlineExpense._id?.toString?.() || offlineExpense._id,
          description: body.description,
          amount: amount,
          vat: vat,
          category: body.category,
        },
      }, { status: 201 });
    }
  } catch (error) {
    console.error('❌ Error creating offline expense:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      errorObject: error,
    });
    return NextResponse.json(
      {
        error: 'Failed to create offline expense',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET - Fetch offline expenses with optional filters
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100');
    const skip = parseInt(searchParams.get('skip') || '0');
    const filterStatus = searchParams.get('status');

    // Build filter
    const filter: any = { isOffline: true };
    if (filterStatus && filterStatus !== 'all') {
      filter.status = filterStatus;
    }

    console.log("🔍 [GET /api/admin/offline-expenses] Query filter:", JSON.stringify(filter));

    // Fetch offline expenses
    const offlineExpenses = await Expense.find(filter)
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit);

    const totalCount = await Expense.countDocuments(filter);

    console.log(`[Offline Expenses API] Fetched ${offlineExpenses.length} offline expenses (Total: ${totalCount})`);
    console.log("📋 First expense:", offlineExpenses[0] || "No expenses found");
    
    // Also log all expenses regardless of filter for debugging
    const allExpenses = await Expense.find({}).limit(5);
    const allExpensesSummary = allExpenses.map(e => ({
      _id: e._id,
      description: e.description,
      isOffline: e.isOffline
    }));
    console.log("📌 All expenses in DB (first 5):", allExpensesSummary);

    return NextResponse.json({
      success: true,
      data: serializeDocs(offlineExpenses),
      pagination: {
        total: totalCount,
        limit,
        skip,
        hasMore: skip + limit < totalCount,
      }
    });
  } catch (error) {
    console.error('Error fetching offline expenses:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch offline expenses',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
