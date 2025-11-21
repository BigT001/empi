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
      console.error('❌ Missing imageData in request');
      return NextResponse.json(
        { error: 'imageData is required' },
        { status: 400 }
      );
    }

    // Validate it's a base64 data URL
    if (!imageData.startsWith('data:image/')) {
      console.error('❌ Invalid image format:', imageData.substring(0, 50));
      return NextResponse.json(
        { error: 'Invalid image data format. Must be base64 data URL starting with "data:image/"' },
        { status: 400 }
      );
    }

    console.log(`📤 Uploading image to Cloudinary: ${fileName || 'unknown'}`);
    console.log(`📊 Image data size: ${(imageData.length / 1024 / 1024).toFixed(2)}MB`);

    // Upload to Cloudinary using the base64 data
    // Add timeout to handle slow mobile networks
    const uploadPromise = cloudinary.uploader.upload(imageData, {
      folder: 'empi',
      resource_type: 'auto',
      // Optimize for web
      quality: 'auto',
      fetch_format: 'auto',
      // Allow large uploads (for high-res mobile photos)
      chunk_size: 6000000, // 6MB chunks
    });

    // Set timeout of 120 seconds for upload
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Upload timeout: Taking too long to upload to Cloudinary')), 120000)
    );

    const result = await Promise.race([uploadPromise, timeoutPromise]) as any;

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
    const errorStack = error instanceof Error ? error.stack : '';

    console.error('❌ Error details:', {
      message: errorMessage,
      stack: errorStack,
    });

    // Provide more specific error messages
    let userFriendlyMessage = 'Failed to upload image to Cloudinary';
    if (errorMessage.includes('timeout') || errorMessage.includes('Taking too long')) {
      userFriendlyMessage = 'Upload timeout - your connection may be too slow. Please try again with a faster connection.';
    } else if (errorMessage.includes('Invalid')) {
      userFriendlyMessage = 'Invalid image format. Please try with a different image.';
    } else if (errorMessage.includes('too large')) {
      userFriendlyMessage = 'Image is too large. Please compress it first.';
    }

    return NextResponse.json(
      { 
        error: userFriendlyMessage,
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
