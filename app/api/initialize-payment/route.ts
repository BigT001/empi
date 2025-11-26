import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, amount, reference, firstname, lastname, phone } = body;

    // Validate required fields
    if (!email || !amount || !reference) {
      return NextResponse.json(
        { error: 'Missing required fields: email, amount, reference' },
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
