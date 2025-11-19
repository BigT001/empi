import { NextRequest, NextResponse } from 'next/server';

// In-memory error log - will show only recent errors in current session
// For production, consider using a database or file storage
let errorLogs: any[] = [];
const MAX_LOGS = 100;

// POST - Log client-side errors and events
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

    const isSuccess = type.includes('success') || type.includes('Success');
    const isError = stack || type.includes('error') || type.includes('Error');

    const errorLog = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      message,
      stack: stack || null,
      context: context || {},
      userAgent: userAgent || null,
      url: url || null,
      timestamp: timestamp || new Date().toISOString(),
      level: isSuccess ? 'info' : isError ? 'error' : 'warning',
    };

    // Log with appropriate prefix
    if (isSuccess) {
      console.log(`✅ Success [${type}]:`, message);
    } else if (isError) {
      console.error(`🔴 Error [${type}]:`, message);
      if (stack) console.error("Stack:", stack);
      if (context) console.error("Context:", context);
    } else {
      console.warn(`⚠️ Warning [${type}]:`, message);
    }

    // Keep in memory (latest 100 events)
    errorLogs.push(errorLog);
    if (errorLogs.length > MAX_LOGS) {
      errorLogs = errorLogs.slice(-MAX_LOGS);
    }

    console.log(`📊 Total logs in memory: ${errorLogs.length}`);

    return NextResponse.json(
      { success: true, id: errorLog.id, logCount: errorLogs.length },
      { status: 201 }
    );
  } catch (error) {
    console.error("❌ Error logging failed:", error);
    return NextResponse.json(
      { error: "Failed to log event" },
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

    console.log(`📊 GET /api/errors - Total logs available: ${errorLogs.length}`);

    let filtered = errorLogs;
    if (type) {
      filtered = errorLogs.filter((err) => err.type === type);
      console.log(`  Filtered by type "${type}": ${filtered.length} logs`);
    }

    // Return most recent errors
    const recent = filtered.slice(-limit);
    
    return NextResponse.json({
      total: filtered.length,
      returned: recent.length,
      errors: recent,
      memoryStatus: {
        totalInMemory: errorLogs.length,
        maxCapacity: MAX_LOGS,
      },
    });
  } catch (error) {
    console.error("❌ Error fetching logs:", error);
    return NextResponse.json(
      { error: "Failed to fetch error logs" },
      { status: 500 }
    );
  }
}
