import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Product from '@/lib/models/Product';
import { serializeDoc } from '@/lib/serializer';

// GET single product
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const product = await Product.findById(id);

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(serializeDoc(product));
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { error: 'Product not found' },
      { status: 404 }
    );
  }
}

// UPDATE product
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await request.json();

    const updateData: any = {};
    if (body.name) updateData.name = body.name;
    if (body.description) updateData.description = body.description;
    if (body.sellPrice !== undefined) updateData.sellPrice = body.sellPrice;
    if (body.rentPrice !== undefined) updateData.rentPrice = body.rentPrice;
    if (body.category) updateData.category = body.category;
    if (body.badge) updateData.badge = body.badge;
    if (body.imageUrl) updateData.imageUrl = body.imageUrl;
    if (body.imageUrls) updateData.imageUrls = body.imageUrls;
    if (body.sizes) updateData.sizes = body.sizes;
    if (body.color) updateData.color = body.color;
    if (body.material) updateData.material = body.material;
    if (body.condition) updateData.condition = body.condition;
    if (body.careInstructions) updateData.careInstructions = body.careInstructions;

    const product = await Product.findByIdAndUpdate(id, updateData, { new: true });

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(serializeDoc(product));
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    );
  }
}

// DELETE product
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const product = await Product.findByIdAndDelete(id);

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: 'Product deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    );
  }
}
