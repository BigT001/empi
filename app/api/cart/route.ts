import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Cart from "@/lib/models/Cart";
import { serializeDoc } from "@/lib/serializer";

// GET user's cart
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json({ error: "Session ID required" }, { status: 400 });
    }

    let cart = await Cart.findOne({ sessionId });
    if (!cart) {
      cart = new Cart({ sessionId, items: [] });
      await cart.save();
    }
    return NextResponse.json(serializeDoc(cart));
  } catch (error) {
    console.error("Error fetching cart:", error);
    const sessionId = new URL(req.url).searchParams.get("sessionId");
    return NextResponse.json({ sessionId, items: [] });
  }
}

// POST add to cart or update cart
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const { sessionId, items } = body;

    if (!sessionId) {
      return NextResponse.json({ error: "Session ID required" }, { status: 400 });
    }

    let cart = await Cart.findOne({ sessionId });
    if (!cart) {
      cart = new Cart({ sessionId, items: items || [] });
    } else {
      cart.items = items || [];
    }
    await cart.save();

    return NextResponse.json(cart);
  } catch (error) {
    console.error("Error updating cart:", error);
    return NextResponse.json({ error: "Failed to update cart" }, { status: 500 });
  }
}

// DELETE clear cart
export async function DELETE(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json({ error: "Session ID required" }, { status: 400 });
    }

    await Cart.deleteOne({ sessionId });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting cart:", error);
    return NextResponse.json({ error: "Failed to delete cart" }, { status: 500 });
  }
}
