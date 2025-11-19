import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// Retry helper for transient failures
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  delayMs = 1000
): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries) throw error;
      const delay = delayMs * Math.pow(2, attempt - 1); // exponential backoff
      console.log(`⏳ Retry attempt ${attempt}/${maxRetries} after ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error("Max retries exceeded");
}

// GET all products with CDN caching headers
// Returns ONLY real database products - NO demo data
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');

  try {
    console.log("📥 GET /api/products - Fetching products from database...");
    console.log("🔍 Category filter:", category || "none");

    // Fetch with retry logic for transient connection issues
    const products = await withRetry(
      () => prisma.product.findMany({
        where: category ? { category } : {},
        orderBy: { createdAt: 'desc' },
      }),
      2, // retry 2 times (3 attempts total)
      500  // start with 500ms delay
    );

    console.log("✅ Products fetched successfully, count:", products.length);
    
    // Create response with Edge Cache headers
    const response = NextResponse.json(products);
    response.headers.set(
      "Cache-Control",
      "public, s-maxage=300, stale-while-revalidate=600"
    );
    return response;
  } catch (error) {
    console.error('❌ Error fetching products from database:', error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error('❌ Error details:', errorMessage);
    
    // Return error - client will use cached data if available
    return NextResponse.json(
      { 
        error: "Failed to fetch products",
        details: errorMessage,
        message: "Database connection failed. If you have cached products, they will be shown."
      },
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
    
    // Clear all cached data so new product appears immediately
    revalidatePath("/");
    revalidatePath("/admin");
    
    // Return product with headers to bypass any caching
    const response = NextResponse.json(product, { status: 201 });
    response.headers.set("Cache-Control", "no-cache, no-store, must-revalidate");
    return response;
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

// DELETE product by ID
export async function DELETE(request: NextRequest) {
  try {
    console.log("📥 Received DELETE request to /api/products");
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      console.error("❌ Missing product ID");
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 }
      );
    }

    console.log("🗑️ Deleting product with ID:", id);

    const product = await prisma.product.delete({
      where: { id },
    });

    console.log("✅ Product deleted successfully:", product.id);
    
    return NextResponse.json({ message: "Product deleted successfully", id: product.id }, { status: 200 });
  } catch (error) {
    console.error("❌ Error deleting product:", error);
    
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("❌ Error details:", errorMessage);
    
    // Check if product not found
    if (errorMessage.includes("not found")) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: `Failed to delete product: ${errorMessage}` },
      { status: 500 }
    );
  }
}
