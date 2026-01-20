/**
 * Test script to verify unified order creation with regular order data
 */

const testRegularOrderData = {
  reference: "TEST-REF-12345",
  email: "test@example.com",
  firstName: "John",
  lastName: "Doe",
  phone: "1234567890",
  buyerId: "testbuyer123",
  orderType: "regular",
  items: [
    { id: "item1", name: "Test Item", price: 100, quantity: 1 }
  ],
  shippingType: "empi",
  status: "approved",
  pricing: {
    subtotal: 100,
    total: 150,
    tax: 20,
    shipping: 30,
  },
  paymentVerified: true,
};

async function testUnifiedOrderCreation() {
  console.log('🧪 Testing unified order creation with regular order data...\n');
  
  try {
    console.log('📤 Sending order data:');
    console.log(JSON.stringify(testRegularOrderData, null, 2));
    console.log('\n');

    const response = await fetch('http://localhost:3000/api/orders/unified', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testRegularOrderData),
    });

    console.log(`📥 Response status: ${response.status}\n`);

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ SUCCESS! Order created:');
      console.log(`   Order Number: ${data.order?.orderNumber || data.orderNumber}`);
      console.log(`   Order ID: ${data.order?._id || data.orderId}`);
      console.log(`   Order Type: ${data.order?.orderType}`);
      console.log(`   Status: ${data.order?.status}`);
    } else {
      console.log('❌ FAILED! Error response:');
      console.log(JSON.stringify(data, null, 2));
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Wait for server to be ready
setTimeout(testUnifiedOrderCreation, 2000);
