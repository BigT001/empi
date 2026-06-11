const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI is not defined in .env');
  process.exit(1);
}

async function run() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected.');

    console.log('🔑 Granting mail room permissions to all administrators...');
    
    // We add 'view_mail_room' and 'manage_mail_room' to the permissions array of every admin
    const result = await mongoose.connection.db.collection('admins').updateMany(
      {},
      {
        $addToSet: {
          permissions: {
            $each: ['view_mail_room', 'manage_mail_room']
          }
        }
      }
    );

    console.log(`🎉 Success! Updated ${result.modifiedCount} admin document(s).`);
  } catch (error) {
    console.error('❌ Error updating admin permissions:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed.');
  }
}

run();
