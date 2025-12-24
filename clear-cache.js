// Script to clear all localStorage cache
console.log('🔍 Checking localStorage for cached products...\n');

// List all localStorage keys
const keys = Object.keys(localStorage);
console.log('📋 All localStorage keys:');
keys.forEach(key => {
  const value = localStorage.getItem(key);
  const size = value ? (value.length / 1024).toFixed(2) : 0;
  console.log(`  - ${key} (${size} KB)`);
  
  // If it's a product cache, show details
  if (key.startsWith('empi_products_cache_')) {
    try {
      const data = JSON.parse(value || '{}');
      console.log(`    ├─ Products: ${data.products?.length || 0}`);
      console.log(`    ├─ Cached at: ${new Date(data.timestamp).toISOString()}`);
      if (data.products && data.products.length > 0) {
        console.log(`    └─ First product: ${data.products[0].name}`);
      }
    } catch (e) {
      console.log(`    └─ (Could not parse)`);
    }
  }
});

console.log('\n🗑️  Clearing all product caches...\n');

// Clear all product caches
const cacheKeys = keys.filter(k => k.startsWith('empi_products_cache_'));
cacheKeys.forEach(key => {
  localStorage.removeItem(key);
  console.log(`  ✅ Cleared: ${key}`);
});

console.log(`\n✨ Cleared ${cacheKeys.length} product cache entries`);

// Show remaining localStorage
const remainingKeys = Object.keys(localStorage);
console.log(`\n📊 Remaining localStorage keys: ${remainingKeys.length}`);
remainingKeys.forEach(key => {
  const value = localStorage.getItem(key);
  const size = value ? (value.length / 1024).toFixed(2) : 0;
  console.log(`  - ${key} (${size} KB)`);
});
