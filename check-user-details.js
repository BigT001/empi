const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env.local') });

const buyerSchema = new mongoose.Schema({
  email: String,
  phone: String,
  fullName: String,
  address: String,
  city: String,
  state: String,
  postalCode: String,
  createdAt: Date,
  lastLogin: Date,
});

const Buyer = mongoose.model('Buyer', buyerSchema, 'buyers');

async function checkUser() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const user = await Buyer.findOne({ email: 'benerd01@gmail.com' });
    
    if (!user) {
      console.log('❌ User not found');
      process.exit(1);
    }

    console.log('\n📋 User Details:');
    console.log('─'.repeat(50));
    console.log(`Email: ${user.email}`);
    console.log(`Full Name: ${user.fullName}`);
    console.log(`Phone: ${user.phone}`);
    console.log(`City: ${user.city || '(empty)'}`);
    console.log(`State: ${user.state || '(empty)'}`);
    console.log(`Address: ${user.address || '(empty)'}`);
    console.log(`Postal Code: ${user.postalCode || '(empty)'}`);
    console.log(`Created At: ${user.createdAt}`);
    console.log(`Last Login: ${user.lastLogin || '(never)'}`);
    console.log('─'.repeat(50));
    
    // Check if fields exist in database
    console.log('\n📊 Field Status:');
    console.log(`City: ${user.city ? '✅ Exists' : '❌ Missing'}`);
    console.log(`State: ${user.state ? '✅ Exists' : '❌ Missing'}`);
    console.log(`Address: ${user.address ? '✅ Exists' : '❌ Missing'}`);
    console.log(`Postal Code: ${user.postalCode ? '✅ Exists' : '❌ Missing'}`);
    
    // Update with sample data if fields are empty
    if (!user.city || !user.state || !user.address || !user.postalCode) {
      console.log('\n⚠️  Some fields are empty. Would you like to update them?');
    }

    await mongoose.connection.close();
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

checkUser();
