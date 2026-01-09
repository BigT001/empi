const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) {
  console.error('❌ MONGODB_URI not set');
  console.error('Env vars:', process.env);
  process.exit(1);
}

const productSchema = new mongoose.Schema({
  name: String,
  costumeType: String,
  country: String,
  category: String,
  _id: mongoose.Schema.Types.ObjectId,
});

const Product = mongoose.model('Product', productSchema);

async function checkProducts() {
  try {
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Find Traditional Africa products
    const traditionalAfricaProducts = await Product.find({ costumeType: 'Traditional Africa' });
    
    console.log(`\n📊 Found ${traditionalAfricaProducts.length} Traditional Africa products:\n`);
    
    traditionalAfricaProducts.forEach(product => {
      console.log(`Name: ${product.name}`);
      console.log(`Country: ${product.country || 'NOT SET'}`);
      console.log(`Category: ${product.category}`);
      console.log('---');
    });

    // Check all products with South Africa
    const southAfricaProducts = await Product.find({ country: 'South Africa' });
    console.log(`\n🌍 Products with South Africa country: ${southAfricaProducts.length}`);
    southAfricaProducts.forEach(product => {
      console.log(`- ${product.name} (${product.costumeType})`);
    });

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkProducts();
