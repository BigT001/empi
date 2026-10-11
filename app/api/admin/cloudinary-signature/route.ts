import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { getAdminFromRequest } from '@/lib/adminAuth';

const VIDEO_FOLDER = 'empi/videos';

/**
 * POST /api/admin/cloudinary-signature
 * Signs a direct browser → Cloudinary upload so large product videos skip our API.
 * Admin session required; the API secret never leaves the server.
 */
export async function POST(request: NextRequest) {
  const admin = await getAdminFromRequest(request);
  if (!admin) {
    return NextResponse.json({ error: 'Admin session expired. Please log in again.' }, { status: 401 });
  }

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) {
    return NextResponse.json({ error: 'Cloudinary is not configured on the server' }, { status: 500 });
  }

  const timestamp = Math.round(Date.now() / 1000);
  const signature = cloudinary.utils.api_sign_request({ folder: VIDEO_FOLDER, timestamp }, apiSecret);

  return NextResponse.json({ cloudName, apiKey, timestamp, signature, folder: VIDEO_FOLDER });
}
