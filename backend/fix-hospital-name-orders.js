const mongoose = require('mongoose');
const Order = require('./src/models/appModels/Order');
const Admin = require('./src/models/coreModels/Admin');

// Load environment variables
require('dotenv').config();

const mongoUri = process.env.DATABASE || 'mongodb://127.0.0.1:27017/idurarapp';

async function fixHospitalNameInOrders() {
  try {
    console.log('🔗 Connecting to database...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to database');

    // Find orders with missing or empty hospitalName
    console.log('\n🔧 Finding orders with missing hospitalName...');
    const ordersNeedingFix = await Order.find({
      $or: [
        { hospitalName: { $exists: false } },
        { hospitalName: null },
        { hospitalName: '' },
        { hospitalName: 'Unknown Hospital' }
      ]
    }).populate('doctorId', 'name role hospitalName');

    console.log(`📋 Found ${ordersNeedingFix.length} orders needing hospitalName fix`);

    if (ordersNeedingFix.length === 0) {
      console.log('✅ No orders need fixing - all have valid hospitalName values');
      return;
    }

    let fixedCount = 0;
    let errorCount = 0;

    for (const order of ordersNeedingFix) {
      try {
        let newHospitalName = 'Unknown Hospital';
        
        // Priority: doctor's hospitalName > doctor's name > fallback
        if (order.doctorId?.hospitalName) {
          newHospitalName = order.doctorId.hospitalName;
        } else if (order.doctorId?.name) {
          newHospitalName = order.doctorId.name;
        }

        // Update the order
        await Order.findByIdAndUpdate(order._id, {
          hospitalName: newHospitalName
        });

        console.log(`✅ Fixed Order ${order.orderNumber}: "${order.hospitalName}" → "${newHospitalName}"`);
        fixedCount++;

      } catch (error) {
        console.error(`❌ Error fixing Order ${order.orderNumber}:`, error.message);
        errorCount++;
      }
    }

    console.log(`\n📊 Fix Summary:`);
    console.log(`   ✅ Fixed: ${fixedCount} orders`);
    console.log(`   ❌ Errors: ${errorCount} orders`);
    console.log(`   📋 Total processed: ${ordersNeedingFix.length} orders`);

    // Verify the fix
    console.log('\n🔍 Verifying fix...');
    const remainingBrokenOrders = await Order.find({
      $or: [
        { hospitalName: { $exists: false } },
        { hospitalName: null },
        { hospitalName: '' }
      ]
    });

    console.log(`📋 Orders still without hospitalName: ${remainingBrokenOrders.length}`);

    if (remainingBrokenOrders.length > 0) {
      console.log('⚠️  Some orders still need attention:');
      remainingBrokenOrders.forEach((order, index) => {
        console.log(`   ${index + 1}. Order ${order.orderNumber} (${order._id})`);
      });
    } else {
      console.log('🎉 All orders now have hospitalName values!');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from database');
  }
}

fixHospitalNameInOrders();
