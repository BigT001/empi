import { NextRequest, NextResponse } from 'next/server';

// In-memory error log (simple, free, no database needed)
let errorLogs: any[] = [];
const MAX_LOGS = 100;

// POST - Log client-side errors
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, message, stack, context, userAgent, url, timestamp } = body;

    if (!type || !message) {
      return NextResponse.json(
        { error: "Missing required fields: type, message" },
        { status: 400 }
      );
    }

    const errorLog = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      message,
      stack: stack || null,
      context: context || {},
      userAgent: userAgent || null,
      url: url || null,
      timestamp: timestamp || new Date().toISOString(),
    };

    console.error(`🔴 Client Error [${type}]:`, message);
    if (stack) console.error("Stack:", stack);

    // Keep in memory (latest 100 errors)
    errorLogs.push(errorLog);
    if (errorLogs.length > MAX_LOGS) {
      errorLogs = errorLogs.slice(-MAX_LOGS);
    }

    return NextResponse.json(
      { success: true, id: errorLog.id },
      { status: 201 }
    );
  } catch (error) {
    console.error("❌ Error logging failed:", error);
    return NextResponse.json(
      { error: "Failed to log error" },
      { status: 500 }
    );
  }
}

// GET - Retrieve recent errors
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    let filtered = errorLogs;
    if (type) {
      filtered = errorLogs.filter((err) => err.type === type);
    }

    // Return most recent errors
    const recent = filtered.slice(-limit);
    return NextResponse.json({
      total: filtered.length,
      returned: recent.length,
      errors: recent,
    });
  } catch (error) {
    console.error("❌ Error fetching logs:", error);
    return NextResponse.json(
      { error: "Failed to fetch error logs" },
      { status: 500 }
    );
  }
}
