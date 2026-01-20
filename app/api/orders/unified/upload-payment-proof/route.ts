import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import UnifiedOrder from '@/lib/models/UnifiedOrder';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs/promises';

/**
 * POST /api/orders/unified/upload-payment-proof
 * 
 * Upload payment proof for an order (bank transfer)
 * Handles both custom and regular orders via unified endpoint
 */
export async function POST(request: NextRequest) {
  try {
    console.log('[Unified Payment Proof API] POST called');
    
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const orderId = formData.get('orderId') as string;

    if (!file || !orderId) {
      return NextResponse.json(
        { error: 'Missing file or orderId' },
        { status: 400 }
      );
    }

    console.log('[Unified Payment Proof API] File received:', {
      fileName: file.name,
      fileSize: file.size,
      orderId,
    });

    // Connect to database
    await connectDB();

    // Verify order exists (both custom and regular via unified)
    const order = await UnifiedOrder.findById(orderId);
    if (!order) {
      console.error('[Unified Payment Proof API] Order not found:', orderId);
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Save file to public directory
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'payment-proofs');
    await fs.mkdir(uploadsDir, { recursive: true });

    const fileName = `${uuidv4()}_${file.name}`;
    const filePath = path.join(uploadsDir, fileName);

    const buffer = await file.arrayBuffer();
    await fs.writeFile(filePath, new Uint8Array(buffer));

    const proofUrl = `/uploads/payment-proofs/${fileName}`;

    console.log('[Unified Payment Proof API] ✅ File saved:', proofUrl);

    // Update order with payment proof
    // Status: Custom orders stay pending, regular orders become approved
    const newStatus = order.orderType === 'custom' ? 'pending' : 'approved';
    
    order.paymentProofUrl = proofUrl;
    order.paymentProofUploadedAt = new Date();
    order.status = newStatus;
    await order.save();

    console.log(`[Unified Payment Proof API] ✅ Order updated with proof, status set to '${newStatus}'`);

    return NextResponse.json({
      success: true,
      proofUrl,
      message: 'Payment proof uploaded successfully',
    });

  } catch (error) {
    console.error('[API] POST /orders/unified/upload-payment-proof failed:', error);
    return NextResponse.json(
      { error: 'Failed to upload payment proof' },
      { status: 500 }
    );
  }
}
