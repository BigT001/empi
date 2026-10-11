import { NextResponse } from 'next/server';
import { getVatConfig } from '@/lib/vatSettings';

export async function GET() {
  const config = await getVatConfig();

  const response = NextResponse.json(config);
  response.headers.set(
    "Cache-Control",
    "public, s-maxage=30, stale-while-revalidate=60"
  );
  return response;
}
