/**
 * Test Invoice Generation from Orders API
 * This script simulates creating an order with Paystack payment
 * and verifies that an invoice is generated
 */

const http = require('http');

// Test data for an order
const testOrder = {
  customer: {
    name: 'Test User',
    email: 'test@example.com',
    phone: '+2341234567890'
  },
  email: 'test@example.com',
  phone: '+2341234567890',
  address: '123 Test Street',
  city: 'Lagos',
  state: 'Lagos',
  zipCode: '100001',
  items: [
    {
      productId: 'test-product-1',
      name: 'Test Costume',
      quantity: 1,
      price: 50000,
      mode: 'rent'
    }
  ],
  subtotal: 50000,
  shippingCost: 2000,
  vat: 3640,
  vatRate: 7.5,
  total: 55640,
  status: 'confirmed', // This triggers invoice generation
  paymentReference: 'TEST-REF-' + Date.now(),
  paymentMethod: 'paystack'
};

console.log('🧪 Testing Invoice Generation from Orders API...\n');
console.log('📦 Test Order Data:', {
  customerName: testOrder.customer.name,
  email: testOrder.customer.email,
  items: testOrder.items.length,
  total: testOrder.total,
  status: testOrder.status
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/orders',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  }
};

const req = http.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('\n✅ Response Status:', res.statusCode);
    console.log('📨 Response Headers:', res.headers);
    
    try {
      const parsedData = JSON.parse(data);
      console.log('\n📋 Response Body:');
      console.log(JSON.stringify(parsedData, null, 2));
      
      if (parsedData.success) {
        console.log('\n✅ ORDER CREATED SUCCESSFULLY');
        console.log('   Order ID:', parsedData.orderId);
        console.log('   Reference:', parsedData.reference);
        
        if (parsedData.invoice) {
          console.log('\n📄 INVOICE GENERATED:');
          console.log('   Invoice Number:', parsedData.invoice.invoiceNumber);
          console.log('   Invoice ID:', parsedData.invoice.invoiceId);
          console.log('\n✨ SUCCESS: Invoice was generated automatically!');
        } else {
          console.log('\n⚠️  WARNING: Invoice was not generated');
          console.log('   Check the server logs for details');
        }
      } else {
        console.log('\n❌ Order creation failed:', parsedData.error);
      }
    } catch (e) {
      console.error('\n❌ Error parsing response:', e.message);
      console.log('Raw response:', data);
    }
  });
});

req.on('error', (e) => {
  console.error('\n❌ Request error:', e.message);
  console.log('Make sure the server is running on http://localhost:3000');
  process.exit(1);
});

// Send the test data
console.log('\n🚀 Sending test order to /api/orders...\n');
req.write(JSON.stringify(testOrder));
req.end();
