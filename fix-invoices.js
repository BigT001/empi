const mongoose = require('mongoose');

async function fix() {
  try {
    const uri = 'mongodb+srv://sta99175_db_user:n45LxR23xyyf7D9l@cluster0.w7fvrkw.mongodb.net/?appName=Cluster0';
    
    await mongoose.connect(uri);
    const db = mongoose.connection.db;
    const invoices = db.collection('invoices');
    
    // Update all automatic invoices to have paymentVerified: true
    const result = await invoices.updateMany(
      { type: 'automatic' },
      { $set: { paymentVerified: true } }
    );
    
    console.log('✅ Updated', result.modifiedCount, 'invoices');
    
    // Verify the update
    const updated = await invoices.findOne({ type: 'automatic' });
    if (updated) {
      console.log('Verification:');
      console.log('  invoiceNumber:', updated.invoiceNumber);
      console.log('  paymentVerified:', updated.paymentVerified);
    }
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

fix();
