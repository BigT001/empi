/**
 * Invoice Diagnostic Script
 * Checks the entire invoice flow: creation, storage, and retrieval
 */

const http = require('http');
const https = require('https');

const BASE_URL = 'http://localhost:3000';

// Test configuration
const testEmail = `test-${Date.now()}@example.com`;
const testBuyerId = '507f1f77bcf86cd799439011'; // Test ObjectId

console.log('🔍 INVOICE DIAGNOSTIC SCRIPT\n');
console.log('📋 Test Configuration:');
console.log(`   Email: ${testEmail}`);
console.log(`   BuyerId: ${testBuyerId}\n`);

async function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runDiagnostics() {
  try {
    // STEP 1: Create a test order
    console.log('📦 STEP 1: Creating test order...\n');
    
    const orderPayload = {
      customer: {
        name: 'Test User',
        email: testEmail,
        phone: '+2341234567890'
      },
      email: testEmail,
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
      status: 'confirmed',
      paymentReference: `TEST-REF-${Date.now()}`,
      paymentMethod: 'paystack'
    };

    const orderResult = await makeRequest('POST', '/api/orders', orderPayload);
    console.log(`Status: ${orderResult.status}`);
    console.log(`Response:`, JSON.stringify(orderResult.data, null, 2));

    if (orderResult.status !== 201 || !orderResult.data.success) {
      console.log('\n❌ Order creation failed!');
      return;
    }

    const orderNumber = orderResult.data.reference;
    const invoiceNumber = orderResult.data.invoice?.invoiceNumber;
    
    console.log(`\n✅ Order created: ${orderNumber}`);
    console.log(`📄 Invoice claimed: ${invoiceNumber || 'NOT RETURNED'}\n`);

    // STEP 2: Check if invoice was saved to database
    console.log('💾 STEP 2: Checking if invoice was saved to MongoDB...\n');
    
    const invoicesResult = await makeRequest('GET', `/api/invoices?email=${encodeURIComponent(testEmail)}`);
    console.log(`Status: ${invoicesResult.status}`);
    console.log(`Invoices found: ${Array.isArray(invoicesResult.data) ? invoicesResult.data.length : 0}`);
    
    if (Array.isArray(invoicesResult.data) && invoicesResult.data.length > 0) {
      console.log('\n✅ Invoice found in database!');
      console.log('Invoice details:', JSON.stringify(invoicesResult.data[0], null, 2));
    } else {
      console.log('\n❌ NO INVOICES FOUND IN DATABASE!');
      console.log('Response:', JSON.stringify(invoicesResult.data, null, 2));
    }

    // STEP 3: Check by order number
    console.log('\n\n🔎 STEP 3: Searching invoices by order number...\n');
    
    const allInvoicesResult = await makeRequest('GET', '/api/invoices');
    console.log(`Total invoices in system: ${Array.isArray(allInvoicesResult.data) ? allInvoicesResult.data.length : 0}`);
    
    if (Array.isArray(allInvoicesResult.data)) {
      const matchingInvoice = allInvoicesResult.data.find(inv => inv.orderNumber === orderNumber);
      if (matchingInvoice) {
        console.log('\n✅ Found matching invoice by order number!');
        console.log('Invoice:', JSON.stringify(matchingInvoice, null, 2));
      } else {
        console.log('\n⚠️ No invoice found matching order number');
        console.log('Available invoices:', allInvoicesResult.data.slice(0, 3).map(i => ({
          invoiceNumber: i.invoiceNumber,
          orderNumber: i.orderNumber,
          customerEmail: i.customerEmail
        })));
      }
    }

    // STEP 4: Summary
    console.log('\n\n📊 DIAGNOSTIC SUMMARY\n');
    console.log('✅ Tests Completed');
    console.log(`   Order Created: YES (${orderNumber})`);
    console.log(`   Invoice in Response: ${invoiceNumber ? 'YES' : 'NO'}`);
    console.log(`   Invoice in Database: ${invoicesResult.status === 200 && Array.isArray(invoicesResult.data) && invoicesResult.data.length > 0 ? 'YES' : 'NO'}`);
    
  } catch (error) {
    console.error('\n❌ Error during diagnostics:', error.message);
  }
}

// Run the diagnostics
console.log('Starting diagnostics in 2 seconds...\n');
setTimeout(runDiagnostics, 2000);
