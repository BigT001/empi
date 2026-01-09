import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Order from '@/lib/models/Order';
import CustomOrder from '@/lib/models/CustomOrder';
import Product from '@/lib/models/Product';
import { serializeDoc } from '@/lib/serializer';

// Helper function to populate imageUrl for order items
async function populateOrderImages(order: any) {
  if (!order || !order.items || order.items.length === 0) {
    return order;
  }

  try {
    const productIds = order.items
      .map((item: any) => item.productId)
      .filter((id: string) => id && !order.items.find((item: any) => item.imageUrl && item.productId === id));

    if (productIds.length === 0) {
      return order;
    }

    const products = await Product.find({ _id: { $in: productIds } }).select('_id imageUrl');
    const productMap = new Map(products.map((p: any) => [p._id.toString(), p.imageUrl]));

    order.items = order.items.map((item: any) => ({
      ...item,
      imageUrl: item.imageUrl || productMap.get(item.productId?.toString()),
    }));
  } catch (err) {
    console.warn('[Orders API] Warning: Failed to populate product images:', err);
  }

  return order;
}

// PATCH - Update order (delivery method, status, etc.)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const updates = await request.json();

    // Validate update fields
    const allowedFields = [
      'shippingType',
      'status',
      'deliveryState',
      'deliveryFee',
      'estimatedDeliveryDays',
      'vehicleType',
      'address',
      'busStop',
      'city',
      'state',
      'zipCode',
    ];

    const sanitizedUpdates: any = {};
    Object.keys(updates).forEach((key) => {
      if (allowedFields.includes(key)) {
        sanitizedUpdates[key] = updates[key];
      }
    });

    // Update the order
    const order = await Order.findByIdAndUpdate(
      id,
      sanitizedUpdates,
      { new: true, runValidators: true }
    );

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    console.log(`[Orders API] ✅ Order ${id} updated:`, sanitizedUpdates);

    const serialized = serializeDoc(order);
    const withImages = await populateOrderImages(serialized);

    return NextResponse.json({
      success: true,
      order: withImages,
    });
  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json({
      error: 'Failed to update order',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// GET - Fetch single order by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    const order = await Order.findById(id);

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    const serialized = serializeDoc(order);
    const withImages = await populateOrderImages(serialized);

    return NextResponse.json({
      success: true,
      order: withImages,
    });
  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json({
      error: 'Failed to fetch order',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// DELETE - Delete order by ID (supports both regular and custom orders)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    console.log(`[Orders API] 🗑️ Deleting order ${id}`);

    // Validate that id is a valid MongoDB ObjectId
    if (!id || id.length !== 24) {
      console.log(`[Orders API] ❌ Invalid order ID format: ${id}`);
      return NextResponse.json(
        { error: 'Invalid order ID' },
        { status: 400 }
      );
    }

    // Try to delete from regular orders first
    let deletedOrder = await Order.findByIdAndDelete(id);

    // If not found in regular orders, try custom orders
    if (!deletedOrder) {
      deletedOrder = await CustomOrder.findByIdAndDelete(id);
    }

    if (!deletedOrder) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    console.log(`[Orders API] ✅ Order ${id} permanently deleted`);

    return NextResponse.json({
      success: true,
      message: 'Order deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting order:', error);
    return NextResponse.json({
      error: 'Failed to delete order',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
