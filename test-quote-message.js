#!/usr/bin/env node

/**
 * Test quote message sending
 * This script tests the complete quote flow: save quote and send message notification
 */

const API_BASE = 'http://localhost:3000/api';

async function testQuoteMessage() {
  try {
    console.log('🚀 Testing Quote Message Flow\n');

    // Step 1: Get a custom order from the database
    console.log('📋 Step 1: Fetching custom orders...');
    const ordersResponse = await fetch(`${API_BASE}/custom-orders`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!ordersResponse.ok) {
      throw new Error(`Failed to fetch orders: ${ordersResponse.status}`);
    }

    const ordersData = await ordersResponse.json();
    const customOrders = ordersData.orders || [];
    console.log(`✅ Found ${customOrders.length} custom orders`);

    if (customOrders.length === 0) {
      console.log('❌ No custom orders found. Please create one first.');
      return;
    }

    const testOrder = customOrders[0];
    console.log(`Using order: ${testOrder.orderNumber} (ID: ${testOrder._id})\n`);

    // Step 2: Send a test message with quote (simulating admin sending quote)
    console.log('📨 Step 2: Sending quote message...');
    const quoteMessage = {
      orderId: String(testOrder._id),
      orderNumber: String(testOrder.orderNumber),
      senderEmail: 'admin@empi.com',
      senderName: 'Admin',
      senderType: 'admin',
      content: 'Your quotation is ready! Review the quote items and total price below.',
      messageType: 'quote',
      quotedPrice: 50000,
      isFinalPrice: false,
    };

    console.log('📤 Message payload:', JSON.stringify(quoteMessage, null, 2));

    const messageResponse = await fetch(`${API_BASE}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(quoteMessage),
    });

    if (!messageResponse.ok) {
      const errorText = await messageResponse.text();
      console.error(`❌ Failed to send message: ${messageResponse.status}`);
      console.error(`   Error: ${errorText}`);
      return;
    }

    const messageData = await messageResponse.json();
    console.log(`✅ Message sent successfully!`);
    console.log(`   Message ID: ${messageData.message?._id}`);
    console.log(`   Quote: ₦${messageData.message?.quotedPrice}\n`);

    // Step 3: Fetch messages to verify
    console.log('🔍 Step 3: Fetching messages to verify...');
    const fetchResponse = await fetch(`${API_BASE}/messages?orderId=${testOrder._id}`);
    const fetchData = await fetchResponse.json();
    const messageCount = fetchData.messages?.length || 0;
    console.log(`✅ Retrieved ${messageCount} messages for this order`);

    if (fetchData.messages && fetchData.messages.length > 0) {
      const quoteMessages = fetchData.messages.filter(m => m.messageType === 'quote');
      console.log(`   Quote messages: ${quoteMessages.length}`);
      if (quoteMessages.length > 0) {
        const latestQuote = quoteMessages[quoteMessages.length - 1];
        console.log(`   Latest quote: ₦${latestQuote.quotedPrice} from ${latestQuote.senderName}`);
      }
    }

    console.log('\n✅ Quote message test PASSED!');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

testQuoteMessage();
