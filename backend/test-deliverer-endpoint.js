const mongoose = require('mongoose');
const Order = require('./src/models/appModels/Order');
const Return = require('./src/models/appModels/Returns');
const Admin = require('./src/models/coreModels/Admin');
const Inventory = require('./src/models/appModels/Inventory');

// Load environment variables
require('dotenv').config();

const mongoUri = process.env.DATABASE || 'mongodb://127.0.0.1:27017/idurarapp';

async function testDelivererEndpointData() {
  try {
    console.log('🔗 Connecting to database...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to database');

    // Find a test deliverer
    const testDeliverer = await Admin.findOne({ role: 'deliverer' });
    if (!testDeliverer) {
      console.log('❌ No deliverer found in database');
      return;
    }

    console.log(`\n🚚 Testing data for deliverer: ${testDeliverer.name} (${testDeliverer._id})`);

    // Simulate the delivererOrders endpoint logic
    const orders = await Order.find({ 
      delivererId: testDeliverer._id, 
      status: { $in: ['pending', 'processing', 'picked_up', 'completed'] } 
    })
      .populate('doctorId', 'name role email hospitalName')
      .populate('delivererId', 'name role email')
      .populate({
        path: 'items.inventoryItem',
        select: 'itemName category price expiryDate batchNumber'
      })
      .populate({
        path: 'items.substitutions.returnId',
        populate: {
          path: 'originalItemId',
          select: 'itemName category batchNumber expiryDate price'
        }
      })
      .populate('items.substitutions.substitutedBy', 'name')
      .sort({ createdAt: -1 });

    console.log(`📋 Found ${orders.length} orders for this deliverer`);

    for (const order of orders) {
      console.log(`\n🔍 Processing Order ${order.orderNumber}:`);
      console.log(`   - Status: ${order.status}`);
      console.log(`   - Hospital: ${order.hospitalName}`);
      console.log(`   - Doctor: ${order.doctorId?.name}`);

      // Simulate the enhanced details processing
      let totalOriginalQuantity = 0;
      let totalReturnedQuantity = 0;
      let totalReturnedValue = 0;
      let itemsWithReturns = 0;
      const returnDetails = [];

      for (const item of order.items) {
        totalOriginalQuantity += item.quantity;

        // Find returns for this item
        if (item.inventoryItem && item.inventoryItem._id) {
          const returnedItems = await Return.find({
            originalItemId: item.inventoryItem._id,
            returnOrder: order._id,
            status: { $in: ['Available for reuse', 'Used', 'Damaged', 'Disposed'] }
          });

          const itemReturnedQuantity = returnedItems.reduce((sum, returnItem) => {
            return sum + (returnItem.returnedQuantity || 0);
          }, 0);

          if (itemReturnedQuantity > 0) {
            itemsWithReturns++;
            totalReturnedQuantity += itemReturnedQuantity;
            
            const itemPrice = item.price || item.inventoryItem.price || 0;
            const itemReturnedValue = itemReturnedQuantity * itemPrice;
            totalReturnedValue += itemReturnedValue;

            returnDetails.push({
              itemName: item.inventoryItem.itemName,
              originalQuantity: item.quantity,
              returnedQuantity: itemReturnedQuantity,
              itemPrice: itemPrice,
              returnedValue: itemReturnedValue
            });

            console.log(`     ✅ ${item.inventoryItem.itemName}: ${itemReturnedQuantity}/${item.quantity} returned, ₹${itemReturnedValue.toFixed(2)}`);
          } else {
            console.log(`     ⚪ ${item.inventoryItem.itemName}: No returns`);
          }
        }
      }

      console.log(`   📊 Return Summary:`);
      console.log(`     - Items with returns: ${itemsWithReturns}/${order.items.length}`);
      console.log(`     - Total returned quantity: ${totalReturnedQuantity}/${totalOriginalQuantity}`);
      console.log(`     - Total returned value: ₹${totalReturnedValue.toFixed(2)}`);

      const returnInfo = {
        hasReturns: itemsWithReturns > 0,
        totalItems: order.items.length,
        itemsWithReturns,
        totalOriginalQuantity,
        totalReturnedQuantity,
        totalReturnedValue,
        returnDetails
      };

      console.log(`   🔧 returnInfo object:`, JSON.stringify(returnInfo, null, 2));
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from database');
  }
}

testDelivererEndpointData();
