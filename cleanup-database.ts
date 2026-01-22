import connectDB from '@/lib/mongodb';
import Order from '@/lib/models/Order';
import UnifiedOrder from '@/lib/models/UnifiedOrder';
import CustomOrder from '@/lib/models/CustomOrder';
import Expense from '@/lib/models/Expense';
import CautionFeeTransaction from '@/lib/models/CautionFeeTransaction';

async function cleanupDatabase() {
  try {
    console.log('🧹 Starting database cleanup...\n');
    
    await connectDB();
    console.log('✅ Connected to database\n');

    // Delete from all collections
    const collections = [
      { name: 'Order', model: Order },
      { name: 'UnifiedOrder', model: UnifiedOrder },
      { name: 'CustomOrder', model: CustomOrder },
      { name: 'Expense', model: Expense },
      { name: 'CautionFeeTransaction', model: CautionFeeTransaction },
    ];

    for (const collection of collections) {
      try {
        const result = await collection.model.deleteMany({});
        console.log(`🗑️  ${collection.name}: Deleted ${result.deletedCount} records`);
      } catch (error) {
        console.log(`⚠️  ${collection.name}: Could not delete (collection may not exist or be empty)`);
      }
    }

    console.log('\n✅ Database cleanup complete!');
    console.log('📊 Dashboard should now show ₦0 for all metrics');
    console.log('🧪 Ready for fresh testing\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    process.exit(1);
  }
}

cleanupDatabase();
