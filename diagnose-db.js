#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

async function diagnose() {
  console.log('🔍 Database Diagnostic Tool\n');
  console.log('📋 Environment Check:');
  console.log(`   DATABASE_URL: ${process.env.DATABASE_URL ? '✓ Set' : '✗ Missing'}`);
  console.log(`   DIRECT_URL: ${process.env.DIRECT_URL ? '✓ Set' : '✗ Missing'}`);
  
  if (!process.env.DATABASE_URL) {
    console.log('\n❌ DATABASE_URL is not set. Please check your .env.local file');
    process.exit(1);
  }

  // Extract host from connection string
  const match = process.env.DATABASE_URL.match(/@([^:]+):(\d+)/);
  if (match) {
    const [, host, port] = match;
    console.log(`\n🌐 Connection Target:`);
    console.log(`   Host: ${host}`);
    console.log(`   Port: ${port}`);
  }

  console.log('\n⏳ Attempting to connect to database...\n');
  
  const prisma = new PrismaClient({
    log: ['error', 'warn'],
  });

  try {
    // Try to ping the database
    const result = await prisma.$queryRaw`SELECT NOW()`;
    console.log('✅ Database connection SUCCESSFUL!');
    console.log(`   Server time: ${result[0].now}`);
    
    // Count products
    const count = await prisma.product.count();
    console.log(`\n📦 Products in database: ${count}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Database connection FAILED');
    console.error(`\n📍 Error: ${error.message}`);
    
    if (error.message.includes('Can\'t reach database server')) {
      console.error('\n💡 Troubleshooting:');
      console.error('   1. Check if Supabase is online: https://status.supabase.com');
      console.error('   2. Verify DATABASE_URL is correct in .env.local');
      console.error('   3. Check firewall/VPN isn\'t blocking port 5432');
      console.error('   4. Try from a different network');
    }
    
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

diagnose().catch(console.error);
