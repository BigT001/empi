// This script will test the API endpoint directly
const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/admin/users?subAdminsOnly=true',
  method: 'GET',
  headers: {
    'Cookie': 'admin_session=ed4b28a3fdf81a718a361e8ed083649c4af02deb55842864026b8126d8bc99fe'
  }
};

const req = http.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Response:', JSON.stringify(JSON.parse(data), null, 2));
  });
});

req.on('error', (error) => {
  console.error('Error:', error);
});

req.end();
