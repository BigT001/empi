import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * POST /api/cloudinary/upload
 * Uploads base64 image data to Cloudinary and returns the secure URL
 * 
 * Request body:
 * {
 *   imageData: "data:image/jpeg;base64,..." (base64 data URL),
 *   fileName: "product-image.jpg" (optional, for reference)
 * }
 * 
 * Response:
 * {
 *   success: true,
 *   url: "https://res.cloudinary.com/..." (secure URL)
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageData, fileName } = body;

    if (!imageData) {
      return NextResponse.json(
        { error: 'imageData is required' },
        { status: 400 }
      );
    }

    // Validate it's a base64 data URL
    if (!imageData.startsWith('data:image/')) {
      return NextResponse.json(
        { error: 'Invalid image data format. Must be base64 data URL starting with "data:image/"' },
        { status: 400 }
      );
    }

    console.log(`📤 Uploading image to Cloudinary: ${fileName || 'unknown'}`);

    // Upload to Cloudinary using the base64 data
    const result = await cloudinary.uploader.upload(imageData, {
      folder: 'empi',
      resource_type: 'auto',
      // Optimize for web
      quality: 'auto',
      fetch_format: 'auto',
    });

    console.log(`✅ Image uploaded successfully: ${result.secure_url}`);

    return NextResponse.json(
      {
        success: true,
        url: result.secure_url,
        publicId: result.public_id,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ Cloudinary upload error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      { 
        error: 'Failed to upload image to Cloudinary',
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
