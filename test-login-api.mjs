import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const testLogins = [
  {
    email: 'admin@empicostumes.com',
    password: 'Mastercode@empicostumes',
    name: 'Super Admin',
  },
  {
    email: 'finance@empicostumes.com',
    password: 'Finance009206',
    name: 'Finance Admin',
  },
  {
    email: 'logistics@empicostumes.com',
    password: 'Logistics009206',
    name: 'Logistics Admin',
  },
];

async function testLogin(email: string, password: string, name: string) {
  console.log(`\n📧 Testing login for: ${name} (${email})`);
  console.log('═'.repeat(60));

  try {
    const response = await fetch('http://localhost:3000/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      credentials: 'include',
    });

    console.log(`Status: ${response.status}`);

    const data = await response.json();

    if (response.ok) {
      console.log('✅ LOGIN SUCCESSFUL');
      console.log(`  Email: ${data.email}`);
      console.log(`  Role: ${data.role}`);
      console.log(`  Permissions: ${data.permissions.join(', ')}`);
    } else {
      console.log('❌ LOGIN FAILED');
      console.log(`  Error: ${data.error}`);
      if (data.remainingAttempts) {
        console.log(`  Remaining attempts: ${data.remainingAttempts}`);
      }
    }
  } catch (error) {
    console.error('❌ Request failed:', error);
  }
}

async function runTests() {
  console.log('🔐 ADMIN LOGIN TEST SUITE');
  console.log('═'.repeat(60));
  console.log('Testing login API with known credentials...\n');

  for (const test of testLogins) {
    await testLogin(test.email, test.password, test.name);
  }

  console.log('\n' + '═'.repeat(60));
  console.log('Test suite completed!');
  console.log('\n📝 Note: Make sure the development server is running on port 3000');
}

runTests();
