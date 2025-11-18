const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('📦 Checking database for products...\n');
    
    const products = await prisma.product.findMany({
      orderBy: { createdAt: 'desc' }
    });
    
    console.log(`✅ Total products in database: ${products.length}\n`);
    
    if (products.length > 0) {
      console.log('📋 Products:');
      products.forEach((product, index) => {
        console.log(`\n${index + 1}. ${product.name}`);
        console.log(`   ID: ${product.id}`);
        console.log(`   Category: ${product.category}`);
        console.log(`   Price: $${product.sellPrice}`);
        console.log(`   Rent: $${product.rentPrice}/day`);
        console.log(`   Created: ${product.createdAt}`);
        console.log(`   Images: ${product.images.length}`);
      });
    } else {
      console.log('❌ No products found in database');
    }
    
    // Check by category
    const adultCount = products.filter(p => p.category === 'adults').length;
    const kidsCount = products.filter(p => p.category === 'kids').length;
    
    console.log(`\n📊 Category breakdown:`);
    console.log(`   Adults: ${adultCount}`);
    console.log(`   Kids: ${kidsCount}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
