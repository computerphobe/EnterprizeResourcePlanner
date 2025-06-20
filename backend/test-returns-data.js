const mongoose = require('mongoose');
const Order = require('./src/models/appModels/Order');
const Return = require('./src/models/appModels/Returns');
const Admin = require('./src/models/coreModels/Admin');
const Inventory = require('./src/models/appModels/Inventory');

// Load environment variables
require('dotenv').config();

const mongoUri = process.env.DATABASE || 'mongodb://127.0.0.1:27017/idurarapp';

async function testReturnsData() {
  try {
    console.log('🔗 Connecting to database...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to database');

    // Find orders with deliverer assigned
    console.log('\n📋 Finding orders with deliverers...');
    const ordersWithDeliverers = await Order.find({
      delivererId: { $exists: true, $ne: null },
      status: { $in: ['pending', 'processing', 'picked_up', 'completed'] }
    })
      .populate('doctorId', 'name role email hospitalName')
      .populate('delivererId', 'name role email')
      .populate({
        path: 'items.inventoryItem',
        select: 'itemName category price expiryDate batchNumber'
      })
      .limit(5)
      .sort({ createdAt: -1 });

    console.log(`📋 Found ${ordersWithDeliverers.length} orders with deliverers`);

    for (const order of ordersWithDeliverers) {
      console.log(`\n🔍 Order ${order.orderNumber}:`);
      console.log(`   - Hospital: ${order.hospitalName}`);
      console.log(`   - Doctor: ${order.doctorId?.name}`);
      console.log(`   - Deliverer: ${order.delivererId?.name}`);
      console.log(`   - Status: ${order.status}`);
      console.log(`   - Items: ${order.items.length}`);

      // Check for returns for each item
      let totalReturns = 0;
      let totalReturnValue = 0;

      for (const item of order.items) {
        if (item.inventoryItem && item.inventoryItem._id) {
          const returns = await Return.find({
            originalItemId: item.inventoryItem._id,
            returnOrder: order._id,
            status: { $in: ['Available for reuse', 'Used', 'Damaged', 'Disposed'] }
          });

          if (returns.length > 0) {
            const itemReturnedQuantity = returns.reduce((sum, ret) => sum + (ret.returnedQuantity || 0), 0);
            const itemPrice = item.price || item.inventoryItem.price || 0;
            const itemReturnValue = itemReturnedQuantity * itemPrice;

            totalReturns += itemReturnedQuantity;
            totalReturnValue += itemReturnValue;

            console.log(`     📦 ${item.inventoryItem.itemName}:`);
            console.log(`         - Original Qty: ${item.quantity}`);
            console.log(`         - Returned Qty: ${itemReturnedQuantity}`);
            console.log(`         - Item Price: ₹${itemPrice}`);
            console.log(`         - Return Value: ₹${itemReturnValue.toFixed(2)}`);
            console.log(`         - Returns: ${returns.length} entries`);
          }
        }
      }

      console.log(`   💰 Total Return Value: ₹${totalReturnValue.toFixed(2)}`);
      console.log(`   📊 Total Returned Items: ${totalReturns}`);
    }

    // Check total returns in system
    console.log('\n📊 Overall Returns Statistics:');
    const totalReturns = await Return.countDocuments();
    const totalReturnsByStatus = await Return.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalQuantity: { $sum: '$returnedQuantity' }
        }
      }
    ]);

    console.log(`   - Total Return Records: ${totalReturns}`);
    totalReturnsByStatus.forEach(stat => {
      console.log(`   - ${stat._id}: ${stat.count} records, ${stat.totalQuantity} items`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from database');
  }
}

testReturnsData();
