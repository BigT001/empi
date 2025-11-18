import { NextRequest, NextResponse } from "next/server";

// Simple in-memory cart storage for development
const carts: Map<string, any> = new Map();

// GET user's cart
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json({ error: "Session ID required" }, { status: 400 });
    }

    const cart = carts.get(sessionId) || { sessionId, items: [] };
    return NextResponse.json(cart);
  } catch (error) {
    console.error("Error fetching cart:", error);
    const sessionId = new URL(req.url).searchParams.get("sessionId");
    return NextResponse.json({ sessionId, items: [] });
  }
}

// POST add to cart or update cart
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sessionId, items } = body;

    if (!sessionId) {
      return NextResponse.json({ error: "Session ID required" }, { status: 400 });
    }

    const cart = { sessionId, items: items || [] };
    carts.set(sessionId, cart);

    return NextResponse.json(cart);
  } catch (error) {
    console.error("Error updating cart:", error);
    return NextResponse.json({ error: "Failed to update cart" }, { status: 500 });
  }
}

// DELETE clear cart
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json({ error: "Session ID required" }, { status: 400 });
    }

    carts.delete(sessionId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting cart:", error);
    return NextResponse.json({ error: "Failed to delete cart" }, { status: 500 });
  }
}
