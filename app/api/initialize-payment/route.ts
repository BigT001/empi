import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    let { email, amount, reference, firstname, lastname, phone } = body;

    // Validate and sanitize email
    email = (email || '').trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.error("❌ Invalid email format:", email);
      return NextResponse.json(
        { error: 'Invalid email address provided' },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!amount || !reference) {
      return NextResponse.json(
        { error: 'Missing required fields: amount, reference' },
        { status: 400 }
      );
    }

    const publicKey = process.env.NEXT_PUBLIC_PAYSTACK_KEY;
    if (!publicKey) {
      console.error("❌ NEXT_PUBLIC_PAYSTACK_KEY not configured");
      return NextResponse.json(
        { error: 'Payment service not configured' },
        { status: 500 }
      );
    }

    console.log("💳 Initializing payment with Paystack...", {
      email,
      amount,
      reference,
      firstname,
      lastname,
    });

    // Initialize transaction via Paystack API
    const initializeUrl = 'https://api.paystack.co/transaction/initialize';
    const secretKey = process.env.PAYSTACK_SECRET_KEY;

    if (!secretKey) {
      console.error("❌ PAYSTACK_SECRET_KEY not configured");
      return NextResponse.json(
        { error: 'Payment service not configured' },
        { status: 500 }
      );
    }

    const response = await fetch(initializeUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        amount: Math.round(Number(amount)), // Ensure it's in kobo
        reference,
        first_name: firstname || 'Customer',
        last_name: lastname || '',
        phone: phone || '',
        callback_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/checkout?reference=${reference}`,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("❌ Paystack initialization error:", data);
      return NextResponse.json(
        { error: data.message || 'Failed to initialize payment' },
        { status: response.status }
      );
    }

    console.log("✅ Payment initialized successfully");
    console.log("Authorization URL:", data.data?.authorization_url);

    return NextResponse.json({
      success: true,
      authorization_url: data.data?.authorization_url,
      access_code: data.data?.access_code,
      reference: data.data?.reference,
    });
  } catch (error) {
    console.error("❌ Payment initialization error:", error);
    return NextResponse.json(
      { error: 'Payment initialization failed' },
      { status: 500 }
    );
  }
}
