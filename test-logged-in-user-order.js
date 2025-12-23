// Test to check if logged-in users are passing buyerId when creating orders

const BASE_URL = 'http://localhost:3000';

async function testLoggedInUserOrder() {
  console.log('🔍 Testing Logged-In User Order Creation\n');
  console.log('================================\n');

  try {
    // First, let's create a test buyer account
    console.log('Step 1️⃣  Creating a test buyer account...\n');

    const buyerPayload = {
      email: 'testbuyer@example.com',
      password: 'TestPassword123!',
      fullName: 'Test Buyer'
    };

    // Check if we can sign up or register
    const signupResponse = await fetch(`${BASE_URL}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buyerPayload)
    });

    console.log(`Signup Response: ${signupResponse.status}`);
    const signupData = await signupResponse.json();
    console.log('Signup Response Data:', signupData);
    
    let buyerId = null;

    if (signupData.buyer && signupData.buyer._id) {
      buyerId = signupData.buyer._id;
      console.log(`✅ Buyer created with ID: ${buyerId}\n`);
    } else if (signupData.message && signupData.message.includes('already exists')) {
      console.log('⚠️  Buyer already exists, looking for existing account...\n');
      // Try to find the buyer
      const findResponse = await fetch(`${BASE_URL}/api/buyers?email=testbuyer@example.com`);
      if (findResponse.ok) {
        const buyerData = await findResponse.json();
        if (Array.isArray(buyerData) && buyerData.length > 0) {
          buyerId = buyerData[0]._id;
          console.log(`✅ Found existing buyer with ID: ${buyerId}\n`);
        }
      }
    } else {
      console.log('ℹ️  Could not determine buyer ID, using test ID\n');
      buyerId = '507f1f77bcf86cd799439011'; // Test ObjectId
    }

    // Now create an order WITH buyerId
    console.log('Step 2️⃣  Creating order WITH buyerId (logged-in user)...\n');

    const orderWithBuyerPayload = {
      buyerId: buyerId, // ← This is the key difference
      customer: {
        name: 'Test Buyer Order',
        email: 'testbuyer@example.com',
        phone: '+234 987 654 3210'
      },
      items: [
        {
          id: 'prod-002',
          name: 'Buyer Test Costume',
          quantity: 1,
          price: 35000,
          mode: 'buy'
        }
      ],
      pricing: {
        subtotal: 35000,
        shipping: 0,
        total: 37625 // with VAT
      },
      status: 'confirmed'
    };

    console.log('Order Payload:');
    console.log(`  buyerId: ${orderWithBuyerPayload.buyerId}`);
    console.log(`  customer.email: ${orderWithBuyerPayload.customer.email}\n`);

    const orderResponse = await fetch(`${BASE_URL}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderWithBuyerPayload)
    });

    if (!orderResponse.ok) {
      console.error('❌ Order creation failed:', orderResponse.status);
      return;
    }

    const orderData = await orderResponse.json();
    console.log('✅ Order created successfully');
    console.log(`  Invoice Number: ${orderData.invoice?.invoiceNumber}\n`);

    // Step 3: Check if invoice has buyerId
    console.log('Step 3️⃣  Checking if invoice was saved with buyerId...\n');

    const invoiceUrl = `${BASE_URL}/api/invoices?buyerId=${buyerId}`;
    console.log(`Fetching: ${invoiceUrl}\n`);

    const invoiceResponse = await fetch(invoiceUrl);
    
    if (!invoiceResponse.ok) {
      console.error('❌ Failed to fetch invoices by buyerId');
      return;
    }

    const invoices = await invoiceResponse.json();
    console.log(`Found ${invoices.length} invoices for buyerId: ${buyerId}`);

    if (invoices.length > 0) {
      console.log(`\n✅ SUCCESS: Invoice saved WITH buyerId!`);
      console.log('Invoice details:');
      invoices.forEach(inv => {
        console.log(`  - ${inv.invoiceNumber}`);
        console.log(`    buyerId: ${inv.buyerId}`);
        console.log(`    customerEmail: ${inv.customerEmail}`);
        console.log(`    totalAmount: ₦${inv.totalAmount}`);
      });
    } else {
      console.log(`\n❌ PROBLEM: No invoices found for this buyerId!`);
      console.log('This means the invoice was saved with buyerId=null or undefined');
      console.log('So the logged-in user cannot find their invoices by buyerId\n');

      // Let's fetch by email instead to verify the invoice was created
      console.log('Checking if invoice exists by email...');
      const emailUrl = `${BASE_URL}/api/invoices?email=testbuyer@example.com`;
      const emailResponse = await fetch(emailUrl);
      
      if (emailResponse.ok) {
        const emailInvoices = await emailResponse.json();
        console.log(`Found ${emailInvoices.length} invoices by email`);
        
        if (emailInvoices.length > 0) {
          const invoice = emailInvoices[emailInvoices.length - 1];
          console.log(`\n❌ ISSUE CONFIRMED:`);
          console.log(`   - Invoice EXISTS and can be found by email`);
          console.log(`   - But buyerId is: ${invoice.buyerId || 'null'}`);
          console.log(`   - So logged-in user cannot retrieve it using their buyerId`);
          console.log(`\n🔧 SOLUTION: Make sure buyerId is passed when user creates order`);
        }
      }
    }

    console.log('\n================================');
    console.log('Key Finding:');
    console.log('If step 3 found 0 invoices by buyerId:');
    console.log('→ The order API is not passing buyerId to invoice creation');
    console.log('→ Check the checkout/payment flow to ensure buyerId is sent\n');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testLoggedInUserOrder();
