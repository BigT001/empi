// Simple script to list buyers from MongoDB using mongoose
// Usage (PowerShell):
// $env:MONGODB_URI = 'your_mongo_uri'; node scripts/list-buyers.js

const mongoose = require('mongoose');

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('Please set MONGODB_URI environment variable. Example:');
    console.error("$env:MONGODB_URI = 'mongodb+srv://user:pass@cluster.mongodb.net/dbname'");
    process.exit(1);
  }

  try {
    await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const buyersColl = db.collection('buyers');

    const count = await buyersColl.countDocuments();
    console.log(`Buyers count: ${count}`);

    if (count > 0) {
      const sample = await buyersColl.find({}, { projection: { password: 0 } }).sort({ createdAt: -1 }).limit(20).toArray();
      console.log('Sample buyers (up to 20):');
      console.dir(sample, { depth: 2, colors: true });
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Error connecting to MongoDB or fetching buyers:', err);
    process.exit(2);
  }
}

main();
