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

    const publicKey = process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY;
    if (!publicKey) {
      console.error("❌ NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY not configured");
      return NextResponse.json(
        { error: 'Payment service not configured' },
        { status: 500 }
      );
    }

    console.log("💳 Initializing payment with Flutterwave...", {
      email,
      amount,
      reference,
      firstname,
      lastname,
    });

    // Initialize transaction via Flutterwave API
    const initializeUrl = 'https://api.flutterwave.com/v3/payments';
    const secretKey = process.env.FLUTTERWAVE_SECRET_KEY;

    if (!secretKey) {
      console.error("❌ FLUTTERWAVE_SECRET_KEY not configured");
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
        tx_ref: reference,
        amount: Number(amount) / 100, // Convert from kobo to base Naira amount
        currency: 'NGN',
        redirect_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/checkout?reference=${reference}&email=${encodeURIComponent(email)}&name=${encodeURIComponent((firstname || '') + ' ' + (lastname || ''))}`,
        customer: {
          email,
          phonenumber: phone || '',
          name: `${firstname || 'Customer'} ${lastname || ''}`.trim(),
        },
        customizations: {
          title: 'EMPI Costumes',
          logo: `${process.env.NEXT_PUBLIC_APP_URL || 'https://empicostumes.com'}/logo/EMPI-2k24-LOGO-1.PNG`,
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("❌ Flutterwave initialization error:", data);
      return NextResponse.json(
        { error: data.message || 'Failed to initialize payment' },
        { status: response.status }
      );
    }

    console.log("✅ Payment initialized successfully via Flutterwave");
    console.log("Authorization URL (hosted link):", data.data?.link);

    return NextResponse.json({
      success: true,
      authorization_url: data.data?.link, // Map link to authorization_url for client compatibility
      reference: reference,
    });
  } catch (error) {
    console.error("❌ Payment initialization error:", error);
    return NextResponse.json(
      { error: 'Payment initialization failed' },
      { status: 500 }
    );
  }
}
