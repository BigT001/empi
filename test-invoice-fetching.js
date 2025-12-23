// Test to debug why user isn't seeing invoices on their invoice page
// This simulates what the user invoice page does

const BASE_URL = 'http://localhost:3000';

async function testUserInvoiceFetching() {
  console.log('🔍 Testing User Invoice Page Data Fetching\n');
  console.log('================================\n');

  try {
    // Test 1: Guest user (no buyer ID, using email)
    console.log('Test 1️⃣  Guest user invoice fetching (by email)');
    console.log('Scenario: User checks invoice tab after buying as guest\n');

    const guestEmail = 'testuser@example.com';
    console.log(`Guest Email: ${guestEmail}`);
    console.log(`localStorage.getItem('guest_email'): "${guestEmail}"\n`);

    const fetchUrl = `/api/invoices?email=${encodeURIComponent(guestEmail)}`;
    console.log(`📥 Fetching URL: ${BASE_URL}${fetchUrl}\n`);

    const response = await fetch(`${BASE_URL}${fetchUrl}`);
    console.log(`Response Status: ${response.status}`);
    console.log(`Response OK: ${response.ok}\n`);

    if (response.ok) {
      const data = await response.json();
      console.log(`✅ Data received:`, Array.isArray(data) ? `Array with ${data.length} items` : typeof data);
      
      if (Array.isArray(data) && data.length > 0) {
        console.log(`\n✅ SUCCESS: User can see invoices!`);
        console.log(`Found ${data.length} invoices:`);
        data.forEach((inv, idx) => {
          console.log(`\n   ${idx + 1}. ${inv.invoiceNumber}`);
          console.log(`      Customer: ${inv.customerName}`);
          console.log(`      Email: ${inv.customerEmail}`);
          console.log(`      Amount: ₦${inv.totalAmount}`);
          console.log(`      Date: ${new Date(inv.invoiceDate).toLocaleDateString()}`);
        });
      } else {
        console.log(`⚠️  WARNING: No invoices returned!`);
        console.log(`This means the API returned an empty array`);
      }
    } else {
      console.error(`❌ API Error: ${response.status}`);
      const error = await response.text();
      console.error(`Error: ${error}`);
    }

    // Test 2: Logged-in user
    console.log('\n\nTest 2️⃣  Logged-in user invoice fetching (by buyerId)');
    console.log('Scenario: Registered customer checks invoice tab\n');

    // Using a real buyerId from the database
    const testBuyerId = '6949f08d7f31b88bf7990716'; // From the test order we just created
    console.log(`Buyer ID: ${testBuyerId}\n`);

    const buyerFetchUrl = `/api/invoices?buyerId=${testBuyerId}`;
    console.log(`📥 Fetching URL: ${BASE_URL}${buyerFetchUrl}\n`);

    const buyerResponse = await fetch(`${BASE_URL}${buyerFetchUrl}`);
    console.log(`Response Status: ${buyerResponse.status}`);
    console.log(`Response OK: ${buyerResponse.ok}\n`);

    if (buyerResponse.ok) {
      const buyerData = await buyerResponse.json();
      console.log(`✅ Data received:`, Array.isArray(buyerData) ? `Array with ${buyerData.length} items` : typeof buyerData);
      
      if (Array.isArray(buyerData) && buyerData.length > 0) {
        console.log(`\n✅ SUCCESS: Buyer can see invoices!`);
        console.log(`Found ${buyerData.length} invoices for this buyer`);
      } else {
        console.log(`⚠️  WARNING: No invoices for this buyerId`);
      }
    } else {
      console.error(`❌ API Error: ${buyerResponse.status}`);
    }

    // Test 3: Check what the Invoice schema expects
    console.log('\n\nTest 3️⃣  Checking Invoice model fields\n');
    const allInvoicesResponse = await fetch(`${BASE_URL}/api/invoices?limit=1`);
    
    if (allInvoicesResponse.ok) {
      const allData = await allInvoicesResponse.json();
      if (Array.isArray(allData) && allData.length > 0) {
        const sampleInvoice = allData[0];
        console.log('Sample Invoice Fields:');
        Object.keys(sampleInvoice).forEach(key => {
          const value = sampleInvoice[key];
          if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            console.log(`  ${key}: [Object]`);
          } else if (Array.isArray(value)) {
            console.log(`  ${key}: [Array with ${value.length} items]`);
          } else {
            console.log(`  ${key}: ${typeof value === 'string' && value.length > 50 ? value.substring(0, 50) + '...' : value}`);
          }
        });
      }
    }

    console.log('\n================================');
    console.log('Diagnosis:');
    console.log('✓ If Test 1 shows invoices → User should see them');
    console.log('✓ If Test 1 shows NO invoices → Check if guest_email in localStorage');
    console.log('✓ If Test 2 shows invoices → Logged-in users work');
    console.log('✓ If Test 2 shows NO invoices → buyerId might not be saved in invoice\n');

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    console.error(error);
  }
}

testUserInvoiceFetching();
