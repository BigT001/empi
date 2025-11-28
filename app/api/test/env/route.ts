import { NextResponse } from 'next/server';

/**
 * GET /api/test/env
 * Check environment variables and configuration
 */
export async function GET() {
  const cronSecret = process.env.CRON_SECRET;
  const mongoUri = process.env.MONGODB_URI;
  const nodeEnv = process.env.NODE_ENV;

  return NextResponse.json(
    {
      success: true,
      message: 'Environment check completed',
      environment: {
        nodeEnv: nodeEnv || 'development',
        cronSecretSet: !!cronSecret,
        mongodbUriSet: !!mongoUri,
        mongodbConnection: mongoUri ? 'Configured' : 'Missing',
        timestamp: new Date().toISOString(),
      },
      warnings: [
        !cronSecret ? '⚠️ CRON_SECRET not set - cron jobs will not be secured' : null,
        !mongoUri ? '⚠️ MONGODB_URI not set - database connection will fail' : null,
      ].filter(Boolean),
      recommendations: [
        cronSecret ? null : 'Set CRON_SECRET in .env.local for security',
        mongoUri ? null : 'Set MONGODB_URI in .env.local',
      ].filter(Boolean),
    },
    { status: 200 }
  );
}
