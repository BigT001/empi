const { PrismaClient } = require('@prisma/client');

async function testDB() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Fetching all products from database...');
    const products = await prisma.product.findMany({
      orderBy: { createdAt: 'desc' }
    });
    
    console.log(`✅ Found ${products.length} products`);
    console.log('\n📋 Products:');
    products.forEach((p, i) => {
      console.log(`\n${i + 1}. ${p.name}`);
      console.log(`   ID: ${p.id}`);
      console.log(`   Category: ${p.category}`);
      console.log(`   Price: $${p.sellPrice}`);
      console.log(`   Rent: $${p.rentPrice}/day`);
      console.log(`   Description: ${p.description.substring(0, 50)}...`);
      console.log(`   Created: ${p.createdAt}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testDB();
