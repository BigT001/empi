import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Settings from '@/lib/models/Settings';
import { Types } from 'mongoose';

// GET bank settings - returns all banks or legacy single bank
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const settings = await Settings.findOne({});

    if (!settings) {
      return NextResponse.json(
        { banks: [], bankAccounts: [] },
        { status: 200 }
      );
    }

    // Return banks in standardized format
    const banks = settings.bankAccounts || [];
    
    return NextResponse.json({
      banks,
      bankAccounts: banks,
      // Legacy support
      bankAccountName: settings.bankAccountName,
      bankAccountNumber: settings.bankAccountNumber,
      bankName: settings.bankName,
      bankCode: settings.bankCode,
      transferInstructions: settings.transferInstructions,
    });
  } catch (error) {
    console.error('[Bank Settings GET] Error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve bank settings' },
      { status: 500 }
    );
  }
}

// POST - Add new bank account
export async function POST(req: NextRequest) {
  try {
    const { bankName, accountName, accountNumber, bankCode, sortCode, instructions } = await req.json();

    // Validate required fields
    if (!bankName || !accountName || !accountNumber || !bankCode) {
      return NextResponse.json(
        { error: 'Bank name, account name, number, and bank code are required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Get or create settings document
    let settings = await Settings.findOne({});
    
    if (!settings) {
      settings = new Settings({
        bankAccounts: [],
      });
    }

    // Ensure bankAccounts array exists
    if (!settings.bankAccounts) {
      settings.bankAccounts = [];
    }

    // Check limit
    if (settings.bankAccounts.length >= 3) {
      return NextResponse.json(
        { error: 'Maximum of 3 bank accounts allowed' },
        { status: 400 }
      );
    }

    // Create new bank account
    const newBank = {
      _id: new Types.ObjectId(),
      bankName,
      accountName,
      accountNumber,
      bankCode,
      sortCode: sortCode || undefined,
      instructions: instructions || undefined,
      isActive: settings.bankAccounts.length === 0, // First bank is active by default
    };

    settings.bankAccounts.push(newBank);
    await settings.save();

    return NextResponse.json({
      id: newBank._id.toString(),
      bankName,
      accountName,
      accountNumber,
      bankCode,
      sortCode,
      instructions,
      isActive: newBank.isActive,
    });
  } catch (error) {
    console.error('[Bank Settings POST] Error:', error);
    return NextResponse.json(
      { error: `Failed to add bank: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}

// PUT - Update bank account or set as active
export async function PUT(req: NextRequest) {
  try {
    const { bankId, bankName, accountName, accountNumber, bankCode, sortCode, instructions, isActive } = await req.json();

    if (!bankId) {
      return NextResponse.json(
        { error: 'Bank ID is required' },
        { status: 400 }
      );
    }

    await connectDB();

    const settings = await Settings.findOne({});

    if (!settings || !settings.bankAccounts) {
      return NextResponse.json(
        { error: 'Bank settings not found' },
        { status: 404 }
      );
    }

    const bankIndex = settings.bankAccounts.findIndex((b: any) => b._id?.toString() === bankId);

    if (bankIndex === -1) {
      return NextResponse.json(
        { error: 'Bank not found' },
        { status: 404 }
      );
    }

    // If setting as active, deactivate all others
    if (isActive === true) {
      settings.bankAccounts.forEach((bank: any, idx: number) => {
        bank.isActive = idx === bankIndex;
      });
    } else {
      // Update bank details
      if (bankName) settings.bankAccounts[bankIndex].bankName = bankName;
      if (accountName) settings.bankAccounts[bankIndex].accountName = accountName;
      if (accountNumber) settings.bankAccounts[bankIndex].accountNumber = accountNumber;
      if (bankCode) settings.bankAccounts[bankIndex].bankCode = bankCode;
      if (sortCode !== undefined) settings.bankAccounts[bankIndex].sortCode = sortCode || undefined;
      if (instructions !== undefined) settings.bankAccounts[bankIndex].instructions = instructions || undefined;
    }

    await settings.save();

    const updatedBank = settings.bankAccounts[bankIndex];
    return NextResponse.json({
      id: updatedBank._id?.toString(),
      bankName: updatedBank.bankName,
      accountName: updatedBank.accountName,
      accountNumber: updatedBank.accountNumber,
      bankCode: updatedBank.bankCode,
      sortCode: updatedBank.sortCode,
      instructions: updatedBank.instructions,
      isActive: updatedBank.isActive,
    });
  } catch (error) {
    console.error('[Bank Settings PUT] Error:', error);
    return NextResponse.json(
      { error: `Failed to update bank: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}

// DELETE - Remove bank account
export async function DELETE(req: NextRequest) {
  try {
    const { bankId } = await req.json();

    if (!bankId) {
      return NextResponse.json(
        { error: 'Bank ID is required' },
        { status: 400 }
      );
    }

    await connectDB();

    const settings = await Settings.findOne({});

    if (!settings || !settings.bankAccounts) {
      return NextResponse.json(
        { error: 'Bank settings not found' },
        { status: 404 }
      );
    }

    const initialLength = settings.bankAccounts.length;
    settings.bankAccounts = settings.bankAccounts.filter((b: any) => b._id?.toString() !== bankId);

    if (settings.bankAccounts.length === initialLength) {
      return NextResponse.json(
        { error: 'Bank not found' },
        { status: 404 }
      );
    }

    // If deleted bank was active, set the first remaining bank as active
    const hasActive = settings.bankAccounts.some((b: any) => b.isActive);
    if (!hasActive && settings.bankAccounts.length > 0) {
      settings.bankAccounts[0].isActive = true;
    }

    await settings.save();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Bank Settings DELETE] Error:', error);
    return NextResponse.json(
      { error: `Failed to delete bank: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}
