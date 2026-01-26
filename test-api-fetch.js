// Test script to verify API works with proper cookie handling
const fetch = require('node-fetch');

(async () => {
  try {
    // Simulate the browser making the request
    const response = await fetch('http://localhost:3000/api/admin/users?subAdminsOnly=true', {
      method: 'GET',
      credentials: 'include', // Include cookies
      headers: {
        'Cookie': 'admin_session=ed4b28a3fdf81a718a361e8ed083649c4af02deb55842864026b8126d8bc99fe'
      }
    });

    console.log('Status:', response.status);
    const data = await response.json();
    console.log('Response:', JSON.stringify(data, null, 2).substring(0, 500));
  } catch (err) {
    console.error('Error:', err.message);
  }
})();
