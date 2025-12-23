import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/socket
 * Initialize Socket.IO connection
 * This endpoint helps with Socket.IO initialization
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    status: 'Socket.IO ready',
    message: 'Use NEXT_PUBLIC_SOCKET_URL in client for WebSocket connection'
  });
}

export async function HEAD(request: NextRequest) {
  return NextResponse.json({ status: 'ok' });
}
