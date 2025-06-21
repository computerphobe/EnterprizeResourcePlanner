const mongoose = require('mongoose');
const Order = require('./src/models/appModels/Order');
const Inventory = require('./src/models/appModels/Inventory');

// Load environment variables
require('dotenv').config();

const mongoUri = process.env.DATABASE || 'mongodb://127.0.0.1:27017/idurarapp';

async function fixOrderPricing() {
  try {
    console.log('🔗 Connecting to database...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to database');

    // Find orders with missing or zero pricing
    console.log('\n🔧 Finding orders with pricing issues...');
    const ordersNeedingPriceFix = await Order.find({
      $or: [
        { totalAmount: { $lte: 0 } },
        { 'items.price': { $lte: 0 } },
        { 'items.price': { $exists: false } }
      ]
    }).populate('items.inventoryItem', 'itemName price');

    console.log(`📋 Found ${ordersNeedingPriceFix.length} orders needing price fix`);

    if (ordersNeedingPriceFix.length === 0) {
      console.log('✅ No orders need pricing fixes');
      return;
    }

    let fixedCount = 0;
    let errorCount = 0;

    for (const order of ordersNeedingPriceFix) {
      try {
        let orderNeedsUpdate = false;
        let newTotalAmount = 0;
        const updatedItems = [];

        console.log(`\n🔍 Processing Order ${order.orderNumber}:`);
        console.log(`   Current total: ₹${order.totalAmount || 0}`);

        for (const item of order.items) {
          let itemPrice = item.price || 0;
          let unitPrice = 0;

          // If item has no price or zero price, calculate from inventory
          if (!itemPrice || itemPrice <= 0) {
            if (item.inventoryItem && item.inventoryItem.price) {
              unitPrice = item.inventoryItem.price;
              itemPrice = unitPrice * item.quantity;
              orderNeedsUpdate = true;
              console.log(`   ✅ ${item.inventoryItem.itemName}: ₹${unitPrice} × ${item.quantity} = ₹${itemPrice}`);
            } else {
              console.log(`   ⚠️  ${item.inventoryItem?.itemName || 'Unknown'}: No price available`);
              itemPrice = 0;
            }
          } else {
            unitPrice = itemPrice / (item.quantity || 1);
            console.log(`   ✓ ${item.inventoryItem?.itemName || 'Unknown'}: Already has price ₹${itemPrice}`);
          }

          newTotalAmount += itemPrice;
          updatedItems.push({
            ...item.toObject(),
            price: itemPrice
          });
        }

        if (orderNeedsUpdate || order.totalAmount !== newTotalAmount) {
          // Update the order
          await Order.findByIdAndUpdate(order._id, {
            items: updatedItems,
            totalAmount: newTotalAmount
          });

          console.log(`   💰 Updated total: ₹${order.totalAmount || 0} → ₹${newTotalAmount}`);
          fixedCount++;
        } else {
          console.log(`   ✓ Order already has correct pricing`);
        }

      } catch (error) {
        console.error(`❌ Error fixing Order ${order.orderNumber}:`, error.message);
        errorCount++;
      }
    }

    console.log(`\n📊 Price Fix Summary:`);
    console.log(`   ✅ Fixed: ${fixedCount} orders`);
    console.log(`   ❌ Errors: ${errorCount} orders`);
    console.log(`   📋 Total processed: ${ordersNeedingPriceFix.length} orders`);

    // Verify the fix
    console.log('\n🔍 Verifying fix...');
    const remainingBrokenOrders = await Order.find({
      $or: [
        { totalAmount: { $lte: 0 } },
        { 'items.price': { $lte: 0 } }
      ]
    });

    console.log(`📋 Orders still with pricing issues: ${remainingBrokenOrders.length}`);

    if (remainingBrokenOrders.length > 0) {
      console.log('⚠️  Some orders still need attention:');
      remainingBrokenOrders.forEach((order, index) => {
        console.log(`   ${index + 1}. Order ${order.orderNumber} - Total: ₹${order.totalAmount || 0}`);
      });
    } else {
      console.log('🎉 All orders now have proper pricing!');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from database');
  }
}

fixOrderPricing();
