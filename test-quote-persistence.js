#!/usr/bin/env node

/**
 * Test quote persistence - verify quoteItems are saved and retrieved
 */

const http = require('http');

// Test Order ID from the debug logs
const TEST_ORDER_ID = '696529b981838c1b1189b1dc';
const API_BASE = 'http://localhost:3000/api/custom-orders';

const testQuoteItems = [
  { itemName: 'Yellow Fabric', quantity: 1, unitPrice: 34000 },
  { itemName: 'Beads', quantity: 2, unitPrice: 5000 }
];

async function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(API_BASE + path);
    const options = {
      hostname: url.hostname,
      port: url.port || 3000,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: data ? JSON.parse(data) : null
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: data
          });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runTest() {
  console.log('🔍 Testing Quote Item Persistence\n');
  console.log(`Order ID: ${TEST_ORDER_ID}\n`);

  try {
    // Step 1: Fetch current order state
    console.log('📖 Step 1: Fetching current order state...');
    const getResponse = await makeRequest('GET', `/${TEST_ORDER_ID}`);
    console.log(`   Status: ${getResponse.status}`);
    console.log(`   Current quoteItems: ${getResponse.body?.data?.quoteItems ? JSON.stringify(getResponse.body.data.quoteItems) : 'undefined'}`);
    console.log(`   Current quotedPrice: ${getResponse.body?.data?.quotedPrice}\n`);

    // Step 2: Send PATCH with quoteItems
    console.log('📝 Step 2: Sending PATCH with quoteItems...');
    const patchPayload = {
      quoteItems: testQuoteItems,
      quotedPrice: 50000
    };
    console.log(`   Payload: ${JSON.stringify(patchPayload)}`);
    
    const patchResponse = await makeRequest('PATCH', `/${TEST_ORDER_ID}`, patchPayload);
    console.log(`   Status: ${patchResponse.status}`);
    console.log(`   Response quoteItems: ${patchResponse.body?.order?.quoteItems ? JSON.stringify(patchResponse.body.order.quoteItems) : 'undefined'}\n`);

    // Step 3: Fetch again to verify persistence
    console.log('📖 Step 3: Fetching order again to verify persistence...');
    const verifyResponse = await makeRequest('GET', `/${TEST_ORDER_ID}`);
    console.log(`   Status: ${verifyResponse.status}`);
    console.log(`   Persisted quoteItems: ${verifyResponse.body?.data?.quoteItems ? JSON.stringify(verifyResponse.body.data.quoteItems) : 'undefined'}`);
    console.log(`   Persisted quotedPrice: ${verifyResponse.body?.data?.quotedPrice}\n`);

    // Step 4: Verify
    if (verifyResponse.body?.data?.quoteItems && verifyResponse.body.data.quoteItems.length > 0) {
      console.log('✅ SUCCESS: Quote items are persisting!\n');
      console.log('Items saved:');
      verifyResponse.body.data.quoteItems.forEach((item, idx) => {
        console.log(`  ${idx + 1}. ${item.itemName} x${item.quantity} @ ₦${item.unitPrice}`);
      });
    } else {
      console.log('❌ FAILURE: Quote items are NOT persisting\n');
      console.log('Full response:', JSON.stringify(verifyResponse.body, null, 2));
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    console.error('\nMake sure:');
    console.error('  1. The dev server is running on port 3000');
    console.error('  2. MongoDB is connected');
    console.error(`  3. The order ID exists: ${TEST_ORDER_ID}`);
  }
}

runTest();
