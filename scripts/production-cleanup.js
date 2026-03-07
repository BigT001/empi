const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env.local') });

async function clearData() {
    try {
        const mongoUri = process.env.MONGODB_URI || "mongodb+srv://sta99175_db_user:n45LxR23xyyf7D9l@cluster0.w7fvrkw.mongodb.net/?appName=Cluster0";
        if (!mongoUri) {
            console.error('MONGODB_URI not found');
            process.exit(1);
        }

        await mongoose.connect(mongoUri);
        console.log('Connected to MongoDB');

        // 1. Delete all Buyers (Users)
        // We don't touch Admins
        const buyerResult = await mongoose.connection.db.collection('buyers').deleteMany({});
        console.log(`Deleted ${buyerResult.deletedCount} buyers.`);

        // 2. Delete all Users (if separate collection holds auth data)
        // Check if 'users' collection exists and has data that should be deleted
        const userResult = await mongoose.connection.db.collection('users').deleteMany({});
        console.log(`Deleted ${userResult.deletedCount} users.`);

        // 3. Delete all Transaction Histories & Financial Data
        const collectionsToClear = [
            'orders',
            'unifiedorders',
            'customorders',
            'invoices',
            'expenses',
            'dailyexpenses',
            'vathistories',
            'cautionfeetransactions',
            'messages',
            'notifications',
            'carts',
            'errorlogs'
        ];

        for (const collName of collectionsToClear) {
            const result = await mongoose.connection.db.collection(collName).deleteMany({});
            console.log(`Deleted ${result.deletedCount} items from ${collName}.`);
        }

        console.log('--- CLEANUP COMPLETE ---');
        console.log('Preserved: Admins and Products.');

        await mongoose.disconnect();
    } catch (error) {
        console.error('Cleanup failed:', error);
        process.exit(1);
    }
}

clearData();
