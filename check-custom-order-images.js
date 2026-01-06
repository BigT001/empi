// Check custom orders and their image URLs in database
require('dotenv').config();
const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/empi';

async function checkCustomOrderImages() {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    const db = client.db('empi');
    
    console.log('🔍 Checking custom orders and images...\n');
    
    const customOrdersCollection = db.collection('customorders');
    const allCustomOrders = await customOrdersCollection.find({}).sort({ createdAt: -1 }).limit(10).toArray();
    
    console.log(`📊 Found ${allCustomOrders.length} custom orders\n`);
    
    if (allCustomOrders.length > 0) {
      allCustomOrders.forEach((order, i) => {
        console.log(`\n[${i+1}] Order: ${order.orderNumber}`);
        console.log(`  Email: ${order.email}`);
        console.log(`  Full Name: ${order.fullName}`);
        console.log(`  Status: ${order.status}`);
        console.log(`  designUrl: ${order.designUrl ? '✅ ' + order.designUrl.substring(0, 50) + '...' : '❌ EMPTY'}`);
        console.log(`  designUrls count: ${order.designUrls?.length || 0}`);
        
        if (order.designUrls && order.designUrls.length > 0) {
          order.designUrls.forEach((url, idx) => {
            console.log(`    [${idx+1}] ${url.substring(0, 80)}...`);
          });
        } else {
          console.log(`    ⚠️ No designUrls found!`);
        }
        
        console.log(`  Created: ${new Date(order.createdAt).toLocaleString()}`);
      });
    } else {
      console.log('❌ No custom orders found in database!');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.close();
  }
}

checkCustomOrderImages();
