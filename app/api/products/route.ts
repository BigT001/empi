import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Product from '@/lib/models/Product';
import { serializeDoc, serializeDocs } from '@/lib/serializer';
import { revalidatePath } from 'next/cache';

// GET all products with CDN caching headers
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  const costumeType = searchParams.get('costumeType');
  const color = searchParams.get('color');
  const material = searchParams.get('material');
  const mode = searchParams.get('mode'); // NEW: filter by mode ('buy' or 'rent')
  const lite = searchParams.get('lite'); // lightweight mode for product picker
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '12'); // Default 12 items per page
  const search = searchParams.get('search'); // New: search query
  const minPrice = searchParams.get('minPrice');
  const maxPrice = searchParams.get('maxPrice');

  try {
    console.log("📥 GET /api/products - Fetching products from database...");
    console.log("🔍 Filters:", { category, costumeType, color, material, search });

    await connectDB();

    // Build query object with advanced filtering
    let query: any = {};
    
    if (category) {
      query.category = category;
    }

    if (costumeType) {
      query.costumeType = costumeType;
    }

    if (color) {
      // Case-insensitive color search
      query.color = new RegExp(color, 'i');
    }

    if (material) {
      // Case-insensitive material search
      query.material = new RegExp(material, 'i');
    }
    
    // NEW: Filter by availability based on mode
    if (mode === 'buy') {
      query.availableForBuy = true;
    } else if (mode === 'rent') {
      query.availableForRent = true;
    }
    
    // Price filtering
    if (minPrice || maxPrice) {
      query.sellPrice = {};
      if (minPrice) {
        query.sellPrice.$gte = parseFloat(minPrice);
      }
      if (maxPrice) {
        query.sellPrice.$lte = parseFloat(maxPrice);
      }
    }
    
    if (search) {
      // Advanced search: match name, description, costumeType, color, material
      const searchRegex = new RegExp(search, 'i'); // Case-insensitive search
      query.$or = [
        { name: searchRegex },
        { description: searchRegex },
        { costumeType: searchRegex },
        { color: searchRegex },
        { material: searchRegex },
      ];
    }

    const skip = (page - 1) * limit;
    
    // Get total count for pagination
    const total = await Product.countDocuments(query);
    
    // For product picker (lite mode), only fetch essential fields
    let query_builder: any = Product.find(query).skip(skip).limit(limit);
    if (lite) {
      query_builder = query_builder.select('_id name sellPrice imageUrl').lean();
    } else {
      query_builder = query_builder.lean();
    }
    
    const products = await query_builder.sort({ createdAt: -1 });

    // Serialize and transform MongoDB _id to id for frontend consistency
    const transformedProducts = serializeDocs(products).map((p: any) => ({
      ...p,
      id: p._id || p.id,
      // Ensure availability fields have defaults for backward compatibility
      availableForBuy: p.availableForBuy !== false ? true : false,
      availableForRent: p.availableForRent !== false ? true : false,
    }));

    console.log("✅ Products fetched successfully, count:", transformedProducts.length);
    
    const response = NextResponse.json({
      data: transformedProducts,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + limit < total,
      }
    });
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
      costumeType: body.costumeType || 'Other',
      ...(body.country && { country: body.country }),
      badge: body.badge || null,
      imageUrl: body.imageUrl,
      imageUrls: body.imageUrls || [],
      sizes: body.sizes || null,
      color: body.color || null,
      material: body.material || null,
      condition: body.condition || null,
      careInstructions: body.careInstructions || null,
      // Availability flags
      availableForBuy: body.availableForBuy !== false ? true : false,
      availableForRent: body.availableForRent !== false ? true : false,
      // Delivery metadata
      deliverySize: body.deliverySize || 'MEDIUM',
      weight: body.weight || 0.5,
      fragile: body.fragile || false,
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
    console.error("❌ Error type:", error instanceof Error ? error.constructor.name : typeof error);
    console.error("❌ Full error object:", JSON.stringify(error, null, 2));
    
    if (error instanceof SyntaxError) {
      console.error("❌ Invalid JSON in request body");
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("❌ Error message:", errorMessage);
    
    // Check if it's a Mongoose validation error
    if (error instanceof Error && error.name === 'ValidationError') {
      console.error("❌ Mongoose ValidationError details:", (error as any).errors);
      const validationErrors = Object.entries((error as any).errors).map(
        ([field, err]: [string, any]) => `${field}: ${err.message}`
      ).join('; ');
      return NextResponse.json(
        { error: `Validation error: ${validationErrors}` },
        { status: 400 }
      );
    }
    
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
