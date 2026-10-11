/**
 * SERVER-ONLY: resolve the signed-in customer from the empi_session cookie.
 */
import type { NextRequest } from 'next/server';
import connectDB from '@/lib/mongodb';
import Buyer from '@/lib/models/Buyer';

export async function getBuyerFromRequest(request: NextRequest) {
  const sessionToken = request.cookies.get('empi_session')?.value;
  if (!sessionToken) return null;

  await connectDB();
  return Buyer.findOne({ sessionToken, sessionExpiry: { $gt: new Date() } });
}
