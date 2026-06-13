import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';

class MockHeaders {
  private headers: Map<string, string>;
  constructor(headers: Record<string, string> = {}) {
    this.headers = new Map(Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v]));
  }
  get(name: string) {
    return this.headers.get(name.toLowerCase()) || null;
  }
}

class MockNextRequest {
  private bodyText: string;
  public headers: MockHeaders;
  
  constructor(bodyText: string, headers: Record<string, string> = {}) {
    this.bodyText = bodyText;
    this.headers = new MockHeaders(headers);
  }
  async text() {
    return this.bodyText;
  }
}

async function runTest() {
  console.log('Starting local webhook tests...');
  
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI not found in env');
  }

  // Connect to DB
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB');

  const { POST } = await import('../app/api/webhooks/resend/route');

  // Test case 1: email.inbound (which contains the full content in mock format)
  console.log('\n--- Test Case 1: email.inbound (simulated/test format) ---');
  const inboundPayload = {
    type: 'email.inbound',
    data: {
      from: 'Test User <test-local@example.com>',
      to: ['pmoney@empicostumes.com'],
      subject: 'Test Local Inbound Webhook',
      text: 'This is a test of the inbound email flow.',
      html: '<p>This is a test of the inbound email flow.</p>',
      message_id: `<test-${Date.now()}@testdomain.com>`,
      id: `local-test-id-${Date.now()}`
    }
  };

  const req1 = new MockNextRequest(
    JSON.stringify(inboundPayload),
    { 'svix-signature': 'bypass-dev' }
  ) as any;

  const res1 = await POST(req1);
  console.log('Response Status:', res1.status);
  const res1Data = await res1.json();
  console.log('Response Data:', JSON.stringify(res1Data, null, 2));

  // Test case 2: email.received (which is the actual Resend webhook format)
  console.log('\n--- Test Case 2: email.received (actual Resend webhook format) ---');
  const receivedPayload = {
    type: 'email.received',
    data: {
      email_id: '56761188-7520-42d8-8898-ff6fc54ce618',
      message_id: '<test-message-id@example.com>',
      subject: 'Test Real Webhook Format',
      from: 'Test User <test-local@example.com>',
      to: ['pmoney@empicostumes.com']
    }
  };

  const req2 = new MockNextRequest(
    JSON.stringify(receivedPayload),
    { 'svix-signature': 'bypass-dev' }
  ) as any;

  const res2 = await POST(req2);
  console.log('Response Status:', res2.status);
  const res2Data = await res2.json();
  console.log('Response Data:', JSON.stringify(res2Data, null, 2));

  await mongoose.connection.close();
  console.log('\nDisconnected from DB. Tests completed.');
}

runTest().catch(console.error);
