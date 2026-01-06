// Test the API endpoint to verify images are returned correctly
require('dotenv').config();
const http = require('http');

async function testApiEndpoint() {
  console.log('🧪 Testing /api/custom-orders endpoint...\n');
  
  const host = process.env.API_HOST || 'localhost';
  const port = process.env.PORT || 3000;
  
  // Build the URL
  const url = `http://${host}:${port}/api/custom-orders`;
  console.log(`📡 URL: ${url}\n`);
  
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error(`❌ Error: ${response.status} ${response.statusText}`);
      return;
    }
    
    const data = await response.json();
    
    if (!data.orders || data.orders.length === 0) {
      console.log('⚠️  No orders found');
      return;
    }
    
    console.log(`✅ Found ${data.orders.length} orders\n`);
    
    data.orders.forEach((order, idx) => {
      console.log(`[${idx + 1}] ${order.orderNumber}`);
      console.log(`  Email: ${order.email}`);
      console.log(`  Status: ${order.status}`);
      console.log(`  Images: ${order.designUrls?.length || 0}`);
      
      if (order.designUrls && order.designUrls.length > 0) {
        order.designUrls.slice(0, 2).forEach((url, imgIdx) => {
          console.log(`    Image ${imgIdx + 1}: ${url.substring(0, 60)}...`);
        });
      }
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Connection error:', error.message);
    console.log('\n💡 Make sure the Next.js dev server is running:');
    console.log('   npm run dev');
  }
}

testApiEndpoint();
