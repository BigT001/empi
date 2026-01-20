/**
 * MIGRATION SCRIPT: CustomOrder & Order → UnifiedOrder
 * 
 * Usage: 
 * 1. Set MONGODB_URI: $env:MONGODB_URI='your_uri'
 * 2. Run: npm run migrate:unified
 * 
 * Or use MongoDB Compass/Atlas to manually copy collections:
 * 1. Export CustomOrder collection to JSON
 * 2. Transform and import to UnifiedOrder as orderType:'custom'
 * 3. Export Order collection to JSON  
 * 4. Transform and import to UnifiedOrder as orderType:'regular'
 */

console.log(`
╔════════════════════════════════════════════════════════════════╗
║              MIGRATION HELPER SCRIPT                           ║
║                                                                ║
║  This script provides guidance for data migration.             ║
║  For development, you can manually migrate in MongoDB:         ║
║                                                                ║
║  Option 1: Use MongoDB Compass                                ║
║  - Connect to your database                                   ║
║  - Export custom_orders collection                            ║
║  - Transform data with orderType field                        ║
║  - Import to unifiedorders collection                         ║
║                                                                ║
║  Option 2: Use MongoDB Shell                                  ║
║  See detailed commands below...                               ║
╚════════════════════════════════════════════════════════════════╝
`);
