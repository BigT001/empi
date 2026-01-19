/**
 * TEST: Create a sample custom order and send to logistics
 * Run this in browser console to test the logistics page
 */

function testCreateOrderAndSendToLogistics() {
  // Sample order that will be sent to logistics
  const sampleOrder = {
    _id: "test-order-" + Date.now(),
    orderNumber: "TEST-" + Math.floor(Math.random() * 10000),
    fullName: "Test Customer",
    email: "test@example.com",
    phone: "08108478477",
    address: "123 Test Street",
    city: "Lagos",
    state: "Lagos",
    description: "Test Custom Gown",
    quantity: 1,
    quotedPrice: 50000,
    status: "ready",
    designUrls: ["https://images.unsplash.com/photo-1595777712802-108af72e1b0f?w=200"],
    createdAt: new Date().toISOString(),
    _isCustomOrder: true,
  };

  // Get existing orders or create empty array
  const existingOrders = sessionStorage.getItem('logistics_orders');
  const ordersArray = existingOrders ? JSON.parse(existingOrders) : [];

  // Add sample order
  ordersArray.push(sampleOrder);

  // Save to sessionStorage
  sessionStorage.setItem('logistics_orders', JSON.stringify(ordersArray));

  console.log('✅ Test order created and sent to logistics!');
  console.log('📦 Order:', sampleOrder);
  console.log('📊 Total orders in logistics:', ordersArray.length);
  console.log('🔄 Refresh the logistics page to see it...');
}

// Run the test
testCreateOrderAndSendToLogistics();
