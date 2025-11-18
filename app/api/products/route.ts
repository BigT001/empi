import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET all products
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');

  try {
    console.log("📥 GET /api/products - Fetching products...");
    console.log("🔍 Category filter:", category || "none");

    const products = await prisma.product.findMany({
      where: category ? { category } : {},
      orderBy: { createdAt: 'desc' },
    });

    console.log("✅ Products fetched successfully, count:", products.length);
    return NextResponse.json(products);
  } catch (error) {
    console.error('❌ Error fetching products:', error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error('❌ Error details:', errorMessage);
    
    // Return error response instead of empty array
    return NextResponse.json(
      { error: "Failed to fetch products", details: errorMessage },
      { status: 500 }
    );
  }
}

// POST create product
export async function POST(request: NextRequest) {
  try {
    console.log("📥 Received POST request to /api/products");
    
    const body = await request.json();
    console.log("📋 Request body keys:", Object.keys(body));

    // Validate required fields
    const requiredFields = ['name', 'description', 'sellPrice', 'rentPrice', 'category', 'image', 'images'];
    const missingFields = requiredFields.filter(field => !body[field]);
    
    if (missingFields.length > 0) {
      console.error("❌ Missing required fields:", missingFields);
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    console.log("✅ All required fields present");
    console.log("📝 Product details:", {
      name: body.name,
      description: body.description.substring(0, 50) + "...",
      sellPrice: body.sellPrice,
      rentPrice: body.rentPrice,
      category: body.category,
      imageSize: body.image?.length || 0,
      imagesCount: Array.isArray(body.images) ? body.images.length : 0,
    });

    // Validate field types
    if (typeof body.sellPrice !== 'number' || typeof body.rentPrice !== 'number') {
      console.error("❌ Invalid price types");
      return NextResponse.json(
        { error: "Prices must be numbers" },
        { status: 400 }
      );
    }

    if (!Array.isArray(body.images)) {
      console.error("❌ Images is not an array");
      return NextResponse.json(
        { error: "Images must be an array" },
        { status: 400 }
      );
    }

    console.log("✅ Field validation passed");
    console.log("🗄️ Creating product in database...");

    const product = await prisma.product.create({
      data: {
        name: body.name,
        description: body.description,
        sellPrice: body.sellPrice,
        rentPrice: body.rentPrice || 0,
        category: body.category,
        badge: body.badge || null,
        image: body.image,
        images: body.images || [],
        sizes: body.sizes || null,
        color: body.color || null,
        material: body.material || null,
        condition: body.condition || null,
        careInstructions: body.careInstructions || null,
      },
    });

    console.log("✅ Product created successfully with ID:", product.id);
    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error("❌ Error creating product:", error);
    
    if (error instanceof SyntaxError) {
      console.error("❌ Invalid JSON in request body");
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("❌ Error message:", errorMessage);
    
    return NextResponse.json(
      { error: `Failed to create product: ${errorMessage}` },
      { status: 500 }
    );
  }
}
