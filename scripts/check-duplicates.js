const mongoose = require('mongoose');

const mongoURI = process.env.MONGODB_URI || 'mongodb+srv://sta99175_db_user:n45LxR23xyyf7D9l@cluster0.w7fvrkw.mongodb.net/?appName=Cluster0';

async function checkDuplicates() {
  try {
    await mongoose.connect(mongoURI);
    const db = mongoose.connection.db;
    const collection = db.collection('unifiedorders');

    // Check for duplicate order numbers
    const pipeline = [
      { $group: { _id: '$orderNumber', count: { $sum: 1 } } },
      { $match: { count: { $gt: 1 } } }
    ];

    const dups = await collection.aggregate(pipeline).toArray();

    if (dups.length > 0) {
      console.log('⚠️ Found duplicate order numbers:');
      dups.forEach(d => console.log(`  - ${d._id} (count: ${d.count})`));
    } else {
      console.log('✅ No duplicate order numbers found');
      
      // Show all orders count by type
      const regular = await collection.countDocuments({ orderType: 'regular' });
      const custom = await collection.countDocuments({ orderType: 'custom' });
      console.log(`\n📊 Order counts by type:`);
      console.log(`  - Regular: ${regular}`);
      console.log(`  - Custom: ${custom}`);
      console.log(`  - Total: ${regular + custom}`);
    }

    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkDuplicates();
