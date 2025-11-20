import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import ErrorLog from '@/lib/models/ErrorLog';
import { serializeDoc } from '@/lib/serializer';

// POST - Log client-side errors and events
export async function POST(request: NextRequest) {
  try {
    await connectDB();
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

    const errorLog = new ErrorLog({
      type,
      message,
      stack: stack || null,
      context: context ? JSON.stringify(context) : null,
      userAgent: userAgent || null,
      url: url || null,
      timestamp: timestamp || new Date(),
    });

    if (isSuccess) {
      console.log(`✅ Success [${type}]:`, message);
    } else if (isError) {
      console.error(`🔴 Error [${type}]:`, message);
      if (stack) console.error("Stack:", stack);
    } else {
      console.warn(`⚠️ Warning [${type}]:`, message);
    }

    await errorLog.save();

    const serialized = serializeDoc(errorLog);
    return NextResponse.json(
      { success: true, id: serialized._id },
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
    await connectDB();
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    let query: any = {};
    if (type) {
      query.type = type;
    }

    const errorLogs = await ErrorLog.find(query)
      .sort({ timestamp: -1 })
      .limit(limit);

    const total = await ErrorLog.countDocuments(query);

    return NextResponse.json({
      total,
      returned: errorLogs.length,
      errors: errorLogs,
    });
  } catch (error) {
    console.error("❌ Error fetching logs:", error);
    return NextResponse.json(
      { error: "Failed to fetch error logs" },
      { status: 500 }
    );
  }
}
