// Test script to debug user invoice visibility issue
// Run with: node test-user-invoice-flow.js

const BASE_URL = 'http://localhost:3000';

async function testUserInvoiceFlow() {
  console.log('🔍 Testing User Invoice Flow\n');
  console.log('================================\n');

  try {
    // Step 1: Create a test order as a guest user
    console.log('Step 1️⃣  Creating a test order...');
    const orderPayload = {
      customer: {
        name: 'Test User Invoice',
        email: 'testuser@example.com',
        phone: '+234 123 456 7890'
      },
      buyerId: null, // Guest user
      items: [
        {
          id: 'prod-001',
          name: 'Test Costume',
          quantity: 1,
          price: 25000,
          mode: 'buy'
        }
      ],
      pricing: {
        subtotal: 25000,
        shipping: 0,
        total: 26825 // with VAT
      },
      status: 'confirmed'
    };

    console.log('📤 Sending order:', JSON.stringify(orderPayload, null, 2));

    const orderResponse = await fetch(`${BASE_URL}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderPayload)
    });

    if (!orderResponse.ok) {
      const error = await orderResponse.text();
      console.error('❌ Order creation failed:', error);
      return;
    }

    const orderData = await orderResponse.json();
    console.log('✅ Order created:', orderData);
    const orderNumber = orderData.orderNumber;
    console.log(`📦 Order Number: ${orderNumber}\n`);

    // Step 2: Check if invoice was created
    console.log('Step 2️⃣  Checking if invoice exists in database...');
    
    // Try to fetch invoices by email (guest user)
    const guestEmail = 'testuser@example.com';
    const invoicesByEmailUrl = `${BASE_URL}/api/invoices?email=${encodeURIComponent(guestEmail)}`;
    console.log(`📥 Fetching: ${invoicesByEmailUrl}`);

    const invoiceResponse = await fetch(invoicesByEmailUrl);
    
    if (!invoiceResponse.ok) {
      console.error('❌ Failed to fetch invoices:', invoiceResponse.status);
      const error = await invoiceResponse.text();
      console.error('Error:', error);
    } else {
      const invoices = await invoiceResponse.json();
      console.log(`✅ Found ${invoices.length} invoices for email: ${guestEmail}`);
      
      if (invoices.length > 0) {
        console.log('📄 Invoice Details:');
        invoices.forEach((inv, idx) => {
          console.log(`\n   Invoice ${idx + 1}:`);
          console.log(`   - Number: ${inv.invoiceNumber}`);
          console.log(`   - Customer: ${inv.customerName}`);
          console.log(`   - Email: ${inv.customerEmail}`);
          console.log(`   - Amount: ₦${inv.totalAmount}`);
          console.log(`   - Status: ${inv.status}`);
          console.log(`   - Type: ${inv.type}`);
          console.log(`   - Created: ${inv.createdAt || inv.invoiceDate}`);
        });
      } else {
        console.log('⚠️  No invoices found for this email!');
        console.log('🔍 This is the issue - invoice was not saved to database\n');
      }
    }

    // Step 3: Check all invoices in the database
    console.log('\nStep 3️⃣  Checking all invoices in database...');
    const allInvoicesUrl = `${BASE_URL}/api/invoices`;
    console.log(`📥 Fetching: ${allInvoicesUrl}`);

    const allInvoicesResponse = await fetch(allInvoicesUrl);
    
    if (!allInvoicesResponse.ok) {
      console.error('❌ Failed to fetch all invoices');
    } else {
      const allInvoices = await allInvoicesResponse.json();
      console.log(`✅ Total invoices in database: ${allInvoices.length}`);
      
      if (allInvoices.length > 0) {
        console.log('📋 Last 5 invoices:');
        allInvoices.slice(0, 5).forEach((inv, idx) => {
          console.log(`   ${idx + 1}. ${inv.invoiceNumber} - ${inv.customerEmail} - ₦${inv.totalAmount}`);
        });
      }
    }

    // Step 4: Check the actual order in database
    console.log('\nStep 4️⃣  Checking the saved order...');
    const orderCheckUrl = `${BASE_URL}/api/orders?orderNumber=${orderNumber}`;
    console.log(`📥 Fetching: ${orderCheckUrl}`);

    const orderCheckResponse = await fetch(orderCheckUrl);
    
    if (!orderCheckResponse.ok) {
      console.error('⚠️  Could not verify saved order');
    } else {
      const orders = await orderCheckResponse.json();
      if (Array.isArray(orders) && orders.length > 0) {
        const savedOrder = orders[0];
        console.log('✅ Order found in database:');
        console.log(`   - Status: ${savedOrder.status}`);
        console.log(`   - Email: ${savedOrder.email}`);
        console.log(`   - BuyerId: ${savedOrder.buyerId || 'null (guest)'}`);
        console.log(`   - Total: ₦${savedOrder.total}`);
      }
    }

    console.log('\n================================');
    console.log('Summary:');
    console.log('- If "No invoices found" in Step 2, the issue is in invoice creation');
    console.log('- Check the server logs for invoice generation errors');
    console.log('- Make sure order.status === "confirmed" before invoice is created');
    console.log('- Check that customerEmail is being saved properly\n');

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

// Run the test
testUserInvoiceFlow();
