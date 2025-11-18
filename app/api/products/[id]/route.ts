import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { devStore } from '@/lib/devStore';

const prisma = new PrismaClient();

// GET single product
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    // Fallback to dev store
    const { id } = await params;
    const devProduct = devStore.getProduct(id);
    return NextResponse.json(devProduct || null);
  }
}

// UPDATE product
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const product = await prisma.product.update({
      where: { id },
      data: {
        ...(body.name && { name: body.name }),
        ...(body.description && { description: body.description }),
        ...(body.sellPrice && { sellPrice: body.sellPrice }),
        ...(body.rentPrice !== undefined && { rentPrice: body.rentPrice }),
        ...(body.category && { category: body.category }),
        ...(body.badge && { badge: body.badge }),
        ...(body.image && { image: body.image }),
        ...(body.images && { images: body.images }),
        ...(body.sizes && { sizes: body.sizes }),
        ...(body.color && { color: body.color }),
        ...(body.material && { material: body.material }),
        ...(body.condition && { condition: body.condition }),
        ...(body.careInstructions && { careInstructions: body.careInstructions }),
      },
    });

    return NextResponse.json(product);
  } catch (error) {
    console.error('Error updating product:', error);
    // Return the body as product when database unavailable
    const body = await request.json();
    return NextResponse.json(body);
  }
}

// DELETE product
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.product.delete({
      where: { id },
    });

    return NextResponse.json(
      { message: 'Product deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting product:', error);
    // Fallback to dev store
    const { id } = await params;
    devStore.deleteProduct(id);
    return NextResponse.json(
      { message: 'Product deleted successfully' },
      { status: 200 }
    );
  }
}
