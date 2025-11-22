// Quick test to diagnose MongoDB connection issues
const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;

console.log('\n🔍 MongoDB Connection Diagnostic\n');
console.log('═'.repeat(50));

if (!MONGODB_URI) {
  console.error('❌ ERROR: MONGODB_URI environment variable is not set!');
  console.error('Make sure your .env file contains: MONGODB_URI=mongodb+srv://...');
  process.exit(1);
}

console.log('📋 Connection String (first 50 chars):', MONGODB_URI.substring(0, 50) + '...');
console.log('✅ MONGODB_URI is set\n');

console.log('Attempting to connect to MongoDB...\n');

mongoose.connect(MONGODB_URI, {
  serverSelectionTimeoutMS: 5000,
  connectTimeoutMS: 10000,
})
  .then(() => {
    console.log('✅ Successfully connected to MongoDB!');
    console.log('✅ Database is accessible');
    
    // List all collections
    return mongoose.connection.db.listCollections().toArray();
  })
  .then(collections => {
    console.log('\n📊 Available Collections:');
    collections.forEach(col => {
      console.log(`   - ${col.name}`);
    });
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Connection Error:');
    console.error('Error Type:', error.name);
    console.error('Error Message:', error.message);
    
    if (error.message.includes('connect ENOTFOUND')) {
      console.error('\n💡 This means MongoDB cannot be reached at the hostname.');
      console.error('Check your connection string and network connection.');
    } else if (error.message.includes('authentication failed')) {
      console.error('\n💡 Invalid username or password.');
      console.error('Verify credentials in your MONGODB_URI.');
    } else if (error.message.includes('IP')) {
      console.error('\n💡 Your IP address is not whitelisted in MongoDB Atlas.');
      console.error('Add your IP to the IP Whitelist in MongoDB Atlas.');
    } else if (error.message.includes('connect ETIMEDOUT')) {
      console.error('\n💡 Connection timed out - possible network issue.');
      console.error('Check your firewall and network connection.');
    }
    
    process.exit(1);
  });

// Add a timeout in case it hangs
setTimeout(() => {
  console.error('\n⏱️ Connection attempt timed out after 15 seconds');
  process.exit(1);
}, 15000);
