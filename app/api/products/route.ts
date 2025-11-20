import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Product from '@/lib/models/Product';
import { serializeDoc, serializeDocs } from '@/lib/serializer';
import { revalidatePath } from 'next/cache';

// GET all products with CDN caching headers
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');

  try {
    console.log("📥 GET /api/products - Fetching products from database...");
    console.log("🔍 Category filter:", category || "none");

    await connectDB();

    const query = category ? { category } : {};
    const products = await Product.find(query).sort({ createdAt: -1 }).lean();

    // Serialize and transform MongoDB _id to id for frontend consistency
    const transformedProducts = serializeDocs(products).map((p: any) => ({
      ...p,
      id: p._id || p.id,
    }));

    console.log("✅ Products fetched successfully, count:", transformedProducts.length);
    
    const response = NextResponse.json(transformedProducts);
    response.headers.set(
      "Cache-Control",
      "public, s-maxage=300, stale-while-revalidate=600"
    );
    return response;
  } catch (error) {
    console.error('❌ Error fetching products from database:', error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error('❌ Error details:', errorMessage);
    
    return NextResponse.json(
      { 
        error: "Failed to fetch products",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}

// POST create product
export async function POST(request: NextRequest) {
  try {
    console.log("📥 Received POST request to /api/products");
    
    await connectDB();
    const body = await request.json();
    console.log("📋 Request body keys:", Object.keys(body));

    const requiredFields = ['name', 'description', 'sellPrice', 'rentPrice', 'category', 'imageUrl'];
    const missingFields = requiredFields.filter(field => !body[field]);
    
    if (missingFields.length > 0) {
      console.error("❌ Missing required fields:", missingFields);
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    console.log("✅ All required fields present");

    if (typeof body.sellPrice !== 'number' || typeof body.rentPrice !== 'number') {
      console.error("❌ Invalid price types");
      return NextResponse.json(
        { error: "Prices must be numbers" },
        { status: 400 }
      );
    }

    console.log("✅ Field validation passed");
    console.log("🗄️ Creating product in database...");

    const product = new Product({
      name: body.name,
      description: body.description,
      sellPrice: body.sellPrice,
      rentPrice: body.rentPrice || 0,
      category: body.category,
      badge: body.badge || null,
      imageUrl: body.imageUrl,
      imageUrls: body.imageUrls || [],
      sizes: body.sizes || null,
      color: body.color || null,
      material: body.material || null,
      condition: body.condition || null,
      careInstructions: body.careInstructions || null,
    });

    await product.save();

    console.log("✅ Product created successfully with ID:", product._id);
    
    revalidatePath("/");
    revalidatePath("/admin");
    
    // Serialize response to include id field for consistency
    const responseData = serializeDoc(product);
    responseData.id = responseData._id;
    
    const response = NextResponse.json(responseData, { status: 201 });
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
    
    await connectDB();
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

    const product = await Product.findByIdAndDelete(id);

    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    console.log("✅ Product deleted successfully:", product._id);
    
    const deletedData = serializeDoc(product);
    return NextResponse.json({ message: "Product deleted successfully", id: deletedData._id }, { status: 200 });
  } catch (error) {
    console.error("❌ Error deleting product:", error);
    
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("❌ Error details:", errorMessage);
    
    return NextResponse.json(
      { error: `Failed to delete product: ${errorMessage}` },
      { status: 500 }
    );
  }
}
