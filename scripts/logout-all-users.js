const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

const buyerSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true },
  phone: { type: String, required: true },
  password: { type: String, required: true },
  fullName: { type: String, required: true },
  address: String,
  city: String,
  state: String,
  postalCode: String,
  isAdmin: { type: Boolean, default: false },
  preferredCurrency: { type: String, default: 'NGN' },
  lastLogin: Date,
  sessionToken: { type: String, default: null },
  sessionExpiry: { type: Date, default: null },
}, { timestamps: true });

const Buyer = mongoose.model('Buyer', buyerSchema);

async function logoutAllUsers() {
  const MONGODB_URI = process.env.MONGODB_URI;

  if (!MONGODB_URI) {
    console.error('❌ ERROR: MONGODB_URI environment variable is not set!');
    process.exit(1);
  }

  try {
    console.log('\n🔗 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get count of active sessions before
    const activeBefore = await Buyer.countDocuments({ sessionToken: { $ne: null } });
    console.log(`📊 Active sessions before: ${activeBefore}`);

    // Clear all active sessions
    const result = await Buyer.updateMany(
      { sessionToken: { $ne: null } },
      { 
        sessionToken: null, 
        sessionExpiry: null 
      }
    );

    console.log(`✅ Cleared ${result.modifiedCount} active user sessions\n`);

    // Verify
    const activeAfter = await Buyer.countDocuments({ sessionToken: { $ne: null } });
    console.log(`✅ Verification: ${activeAfter} active sessions remaining\n`);

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

logoutAllUsers();
