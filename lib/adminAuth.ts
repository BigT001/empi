/**
 * SERVER-ONLY: resolve the signed-in admin from the admin_session cookie.
 */
import { NextResponse, type NextRequest } from 'next/server';
import connectDB from '@/lib/mongodb';
import Admin from '@/lib/models/Admin';

export async function getAdminFromRequest(request: NextRequest) {
  const token = request.cookies.get('admin_session')?.value;
  if (!token) return null;

  await connectDB();
  const admin = await Admin.findOne({ 'sessions.token': token });
  if (!admin || admin.isActive === false) return null;

  const session = admin.sessions?.find((s: { token: string }) => s.token === token);
  if (session?.expiresAt && new Date(session.expiresAt) < new Date()) return null;

  return admin;
}

/** Returns a 401 response when the request has no valid admin session, otherwise null */
export async function requireAdmin(request: NextRequest) {
  const admin = await getAdminFromRequest(request);
  return admin ? null : NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
}
