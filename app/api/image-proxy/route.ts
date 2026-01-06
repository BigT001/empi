import { NextRequest, NextResponse } from 'next/server';

/**
 * Proxy endpoint to load images from Cloudinary with CORS support
 * GET /api/image-proxy?url=<cloudinary-url>
 */
export async function GET(request: NextRequest) {
  try {
    const url = request.nextUrl.searchParams.get('url');
    
    if (!url) {
      return NextResponse.json(
        { error: 'Missing url parameter' },
        { status: 400 }
      );
    }

    console.log('[Image Proxy] Fetching image:', url);

    // Validate it's a Cloudinary URL
    if (!url.includes('cloudinary.com') && !url.includes('res.cloudinary.com')) {
      console.warn('[Image Proxy] Non-Cloudinary URL attempted:', url);
      return NextResponse.json(
        { error: 'Only Cloudinary URLs are allowed' },
        { status: 403 }
      );
    }

    // Fetch the image
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; EMPI/1.0)',
      },
    });

    if (!response.ok) {
      console.error('[Image Proxy] Failed to fetch image:', response.status, response.statusText);
      return NextResponse.json(
        { error: `Failed to fetch image: ${response.statusText}` },
        { status: response.status }
      );
    }

    // Get the image buffer
    const buffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'image/jpeg';

    // Return with proper CORS headers
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
      },
    });
  } catch (error) {
    console.error('[Image Proxy] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
