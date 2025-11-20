import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: Request) {
  try {
    const { folder } = await request.json();

    // Search assets in Cloudinary
    const result = await cloudinary.search
      .expression(folder ? `folder="${folder}"` : 'resource_type:image')
      .max_results(100)
      .execute();

    return Response.json(result);
  } catch (error) {
    console.error('Cloudinary search error:', error);
    return Response.json(
      { error: 'Failed to fetch Cloudinary assets' },
      { status: 500 }
    );
  }
}
