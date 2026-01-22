const mongoose = require('mongoose');

const connectionString = 'mongodb+srv://sta99175_db_user:n45LxR23xyyf7D9l@cluster0.w7fvrkw.mongodb.net/?appName=Cluster0';

async function checkInvoices() {
  try {
    await mongoose.connect(connectionString);
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;
    
    // Check invoices collection
    const invoicesCol = db.collection('invoices');
    const count = await invoicesCol.countDocuments();
    
    console.log(`📋 Invoices Collection: ${count} documents\n`);
    
    if (count > 0) {
      const invoices = await invoicesCol.find({}).toArray();
      
      console.log('📊 ALL INVOICES:\n');
      invoices.forEach((inv, idx) => {
        console.log(`[${idx + 1}] Invoice Details:`);
        console.log(`    Invoice Number: ${inv.invoiceNumber}`);
        console.log(`    Order Number: ${inv.orderNumber}`);
        console.log(`    Total: ₦${inv.totalAmount}`);
        console.log(`    Subtotal: ₦${inv.subtotal}`);
        console.log(`    Tax: ₦${inv.taxAmount}`);
        console.log(`    Items: ${inv.items?.length || 0}`);
        if (inv.items && inv.items.length > 0) {
          inv.items.forEach((item, i) => {
            console.log(`      Item ${i + 1}: ${item.name} (${item.quantity} @ ₦${item.price}) - Mode: ${item.mode}`);
          });
        }
        console.log(`    Type: ${inv.type}`);
        console.log(`    Status: ${inv.status}`);
        console.log('');
      });

      // Summary
      const totalRevenue = invoices.reduce((sum, i) => sum + (i.totalAmount || 0), 0);
      
      console.log('📈 SUMMARY:');
      console.log(`   Total Invoices: ${count}`);
      console.log(`   Total Revenue: ₦${totalRevenue}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

checkInvoices();
