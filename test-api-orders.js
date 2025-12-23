// Test the API endpoint directly
require('dotenv').config();
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

(async () => {
  const email = 'biggy@gmail.com';
  const url = `http://localhost:3000/api/orders?email=${encodeURIComponent(email)}`;
  
  console.log(`Testing API endpoint: ${url}\n`);
  
  try {
    const response = await (await fetch(url)).json();
    console.log('API Response:');
    console.log(`  Success: ${response.success}`);
    console.log(`  Orders count: ${response.orders?.length || 0}`);
    
    if (response.orders && response.orders.length > 0) {
      console.log('\nFirst order:');
      console.log(`  Order#: ${response.orders[0].orderNumber}`);
      console.log(`  Email: ${response.orders[0].email}`);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
})();
