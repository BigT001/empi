// Create test custom orders with sample image URLs
require('dotenv').config();
const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/empi';

// Sample Cloudinary image URLs (public sample images)
const SAMPLE_IMAGE_URLS = [
  'https://res.cloudinary.com/demo/image/fetch/https://www.example.com/image.jpg',
  'https://res.cloudinary.com/demo/image/upload/v1234567890/sample.jpg',
];

async function createTestCustomOrders() {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    const db = client.db('empi');
    const customOrdersCollection = db.collection('customorders');
    
    console.log('📝 Creating test custom orders...\n');
    
    const testOrders = [
      {
        orderNumber: 'TEST-001',
        fullName: 'John Doe',
        email: 'john@example.com',
        phone: '08012345678',
        city: 'Lagos',
        state: 'Lagos',
        description: 'Custom yellow dress with floral patterns',
        quantity: 2,
        status: 'pending',
        designUrl: 'https://res.cloudinary.com/demo/image/upload/v1234567890/sample.jpg',
        designUrls: [
          'https://res.cloudinary.com/demo/image/upload/w_200,h_200,c_fill/v1234567890/sample.jpg',
          'https://res.cloudinary.com/demo/image/upload/w_200,h_200,c_fill/v1234567890/sample2.jpg',
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        orderNumber: 'TEST-002',
        fullName: 'Jane Smith',
        email: 'jane@example.com',
        phone: '08098765432',
        city: 'Abuja',
        state: 'FCT',
        description: 'White wedding gown with beads',
        quantity: 1,
        status: 'approved',
        designUrl: 'https://res.cloudinary.com/demo/image/upload/v1234567890/sample3.jpg',
        designUrls: [
          'https://res.cloudinary.com/demo/image/upload/w_200,h_200,c_fill/v1234567890/sample3.jpg',
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        orderNumber: 'TEST-003',
        fullName: 'Ahmed Hassan',
        email: 'ahmed@example.com',
        phone: '08011223344',
        city: 'Kano',
        state: 'Kano',
        description: 'Black traditional outfit',
        quantity: 3,
        status: 'in-progress',
        designUrl: 'https://res.cloudinary.com/demo/image/upload/v1234567890/sample4.jpg',
        designUrls: [
          'https://res.cloudinary.com/demo/image/upload/w_200,h_200,c_fill/v1234567890/sample4.jpg',
          'https://res.cloudinary.com/demo/image/upload/w_200,h_200,c_fill/v1234567890/sample5.jpg',
          'https://res.cloudinary.com/demo/image/upload/w_200,h_200,c_fill/v1234567890/sample6.jpg',
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    
    const result = await customOrdersCollection.insertMany(testOrders);
    console.log(`✅ Created ${result.insertedIds.length} test orders\n`);
    
    // Verify they were created
    const created = await customOrdersCollection.find({}).toArray();
    console.log('📋 Test Orders Created:');
    created.forEach((order, i) => {
      console.log(`\n[${i+1}] ${order.orderNumber}`);
      console.log(`  Email: ${order.email}`);
      console.log(`  Description: ${order.description}`);
      console.log(`  Images: ${order.designUrls?.length || 0}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.close();
  }
}

createTestCustomOrders();
