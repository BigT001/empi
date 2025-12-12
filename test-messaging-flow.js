/**
 * Test script to verify the complete messaging flow
 * This helps diagnose where messages are getting lost
 */

const API_BASE = 'http://localhost:3000/api';

async function testMessagingFlow() {
  try {
    console.log('🚀 Starting Messaging Flow Test\n');

    // Step 1: Fetch a custom order
    console.log('📋 Step 1: Fetching custom orders from database...');
    const ordersResponse = await fetch(`${API_BASE}/custom-orders`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!ordersResponse.ok) {
      throw new Error(`Failed to fetch orders: ${ordersResponse.status}`);
    }

    const ordersData = await ordersResponse.json();
    console.log(`✅ Found ${ordersData.orders?.length || 0} custom orders`);

    if (!ordersData.orders || ordersData.orders.length === 0) {
      console.log('❌ No custom orders found. Please create one first.');
      return;
    }

    const testOrder = ordersData.orders[0];
    console.log(`   Using order: ${testOrder.orderNumber} (ID: ${testOrder._id})\n`);

    // Step 2: Send a test message as customer
    console.log('📤 Step 2: Sending test message from CUSTOMER...');
    const customerMessageResponse = await fetch(`${API_BASE}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId: testOrder._id,
        orderNumber: testOrder.orderNumber,
        senderEmail: testOrder.email,
        senderName: testOrder.fullName,
        senderType: 'customer',
        content: `[TEST] Hello, I am interested in this custom order. When will the quote be ready?`,
        messageType: 'negotiation',
      }),
    });

    if (!customerMessageResponse.ok) {
      const errorText = await customerMessageResponse.text();
      throw new Error(`Failed to send customer message: ${customerMessageResponse.status} - ${errorText}`);
    }

    const customerMessage = await customerMessageResponse.json();
    console.log(`✅ Customer message sent: ${customerMessage.message?._id}`);
    console.log(`   Message: "${customerMessage.message?.content}"\n`);

    // Step 3: Verify message was saved
    console.log('🔍 Step 3: Fetching messages to verify they were saved...');
    const fetchResponse = await fetch(`${API_BASE}/messages?orderId=${testOrder._id}`);
    const fetchData = await fetchResponse.json();
    console.log(`✅ Retrieved ${fetchData.messages?.length || 0} messages for this order`);

    if (fetchData.messages && fetchData.messages.length > 0) {
      fetchData.messages.forEach((msg, idx) => {
        console.log(`   [${idx + 1}] ${msg.senderType} (${msg.senderName}): "${msg.content}"`);
      });
    }
    console.log();

    // Step 4: Send a test admin reply
    console.log('📤 Step 4: Sending test ADMIN reply with quote...');
    const adminMessageResponse = await fetch(`${API_BASE}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId: testOrder._id,
        orderNumber: testOrder.orderNumber,
        senderEmail: 'admin@empi.com',
        senderName: 'Admin',
        senderType: 'admin',
        content: `We can deliver this by next month.`,
        messageType: 'quote',
        quotedPrice: 50000,
        isFinalPrice: false,
      }),
    });

    if (!adminMessageResponse.ok) {
      const errorText = await adminMessageResponse.text();
      throw new Error(`Failed to send admin message: ${adminMessageResponse.status} - ${errorText}`);
    }

    const adminMessage = await adminMessageResponse.json();
    console.log(`✅ Admin message sent: ${adminMessage.message?._id}`);
    console.log(`   Quote: ₦${adminMessage.message?.quotedPrice}\n`);

    // Step 5: Fetch all messages again
    console.log('🔍 Step 5: Final check - Fetching all messages...');
    const finalFetchResponse = await fetch(`${API_BASE}/messages?orderId=${testOrder._id}`);
    const finalFetchData = await finalFetchResponse.json();
    console.log(`✅ Final count: ${finalFetchData.messages?.length || 0} messages`);

    if (finalFetchData.messages && finalFetchData.messages.length > 0) {
      console.log('\n   📧 Message History:');
      finalFetchData.messages.forEach((msg, idx) => {
        console.log(`   [${idx + 1}] ${msg.senderType} (${msg.senderName})`);
        console.log(`       Type: ${msg.messageType}`);
        console.log(`       Content: "${msg.content}"`);
        if (msg.quotedPrice) {
          console.log(`       Price: ₦${msg.quotedPrice}${msg.isFinalPrice ? ' (FINAL)' : ''}`);
        }
        console.log(`       Read: ${msg.isRead}`);
        console.log();
      });
    }

    console.log('✅ Messaging flow test complete!\n');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
testMessagingFlow();
