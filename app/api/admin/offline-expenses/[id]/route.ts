import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Expense from '@/lib/models/Expense';
import { serializeDoc } from '@/lib/serializer';
import mongoose from 'mongoose';

// DELETE - Delete offline expense by ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid expense ID' },
        { status: 400 }
      );
    }

    // Find and delete the expense
    const deletedExpense = await Expense.findByIdAndDelete(id);

    if (!deletedExpense) {
      return NextResponse.json(
        { error: 'Expense not found' },
        { status: 404 }
      );
    }

    console.log(`✅ Offline expense deleted: ${id}`);

    return NextResponse.json({
      success: true,
      message: 'Offline expense deleted successfully',
      data: serializeDoc(deletedExpense),
    });
  } catch (error) {
    console.error('❌ Error deleting offline expense:', error);
    return NextResponse.json(
      {
        error: 'Failed to delete offline expense',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET - Fetch single expense by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid expense ID' },
        { status: 400 }
      );
    }

    const expense = await Expense.findById(id);

    if (!expense) {
      return NextResponse.json(
        { error: 'Expense not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: serializeDoc(expense),
    });
  } catch (error) {
    console.error('Error fetching expense:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch expense',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
