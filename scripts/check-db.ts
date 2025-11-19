import { prisma } from './lib/prisma';

async function main() {
  try {
    console.log('🔍 Checking database...\n');

    const productCount = await prisma.product.count();
    console.log(`📊 Total Products: ${productCount}`);

    if (productCount > 0) {
      const products = await prisma.product.findMany({
        select: {
          id: true,
          name: true,
          category: true,
          sellPrice: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      });

      console.log('\n📦 Recent Products:');
      products.forEach((product, idx) => {
        console.log(
          `${idx + 1}. ${product.name} (${product.category}) - ₦${product.sellPrice} - ${product.createdAt.toLocaleDateString()}`
        );
      });
    } else {
      console.log('❌ No products found in database');
    }

    console.log('\n✅ Database connection successful');
  } catch (error) {
    console.error('❌ Database error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
