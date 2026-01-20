const mongoose = require('mongoose');

mongoose.connect('mongodb+srv://sta99175_db_user:n45LxR23xyyf7D9l@cluster0.w7fvrkw.mongodb.net/?appName=Cluster0').then(async () => {
  const db = mongoose.connection.db;
  const order = await db.collection('unifiedorders').findOne({
    buyerId: '696ddeafce19a19fe0deb6b5',
    orderType: 'regular',
    isActive: true
  }, { sort: { createdAt: -1 } });
  
  if(order) {
    console.log('Latest order:', order.orderNumber);
    console.log('Items:');
    order.items?.forEach(i => {
      console.log('  -', i.name);
      console.log('    image:', i.image ? 'YES (' + i.image.substring(0, 40) + '...)' : 'NO');
      console.log('    imageUrl:', i.imageUrl ? 'YES (' + i.imageUrl.substring(0, 40) + '...)' : 'NO');
    });
  } else {
    console.log('No orders found');
  }
  await mongoose.connection.close();
}).catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});
