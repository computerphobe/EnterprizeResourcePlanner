const mongoose = require('mongoose');
const Order = require('./backend/src/models/appModels/Order');
const Admin = require('./backend/src/models/coreModels/Admin');

// Load environment variables if needed
require('dotenv').config();

const mongoUri = process.env.DATABASE || 'mongodb://127.0.0.1:27017/idurarapp';

async function testHospitalNameFix() {
  try {
    console.log('🔗 Connecting to database...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to database');

    // Check some sample orders and their hospitalName values
    console.log('\n📋 Checking current orders...');
    const orders = await Order.find({})
      .populate('doctorId', 'name role email hospitalName')
      .limit(10)
      .sort({ createdAt: -1 });

    console.log(`\n Found ${orders.length} orders:`);
    
    orders.forEach((order, index) => {
      console.log(`\n${index + 1}. Order ${order.orderNumber}:`);
      console.log(`   - Direct hospitalName: "${order.hospitalName}"`);
      console.log(`   - Doctor ID: ${order.doctorId?._id}`);
      console.log(`   - Doctor Name: "${order.doctorId?.name}"`);
      console.log(`   - Doctor Role: "${order.doctorId?.role}"`);
      console.log(`   - Doctor hospitalName: "${order.doctorId?.hospitalName}"`);
      
      // Apply fallback logic
      let finalHospitalName = order.hospitalName;
      if (!finalHospitalName && order.doctorId?.hospitalName) {
        finalHospitalName = order.doctorId.hospitalName;
      } else if (!finalHospitalName) {
        finalHospitalName = 'Unknown Hospital';
      }
      console.log(`   - Final Hospital Name: "${finalHospitalName}"`);
    });

    // Check some doctors and their hospitalName
    console.log('\n👨‍⚕️ Checking doctors with hospitalName...');
    const doctors = await Admin.find({ role: 'doctor' }).limit(5);
    
    console.log(`\n Found ${doctors.length} doctors:`);
    doctors.forEach((doctor, index) => {
      console.log(`\n${index + 1}. Doctor ${doctor.name}:`);
      console.log(`   - hospitalName: "${doctor.hospitalName}"`);
      console.log(`   - role: "${doctor.role}"`);
    });

    // Check orders without hospitalName that need to be fixed
    console.log('\n🔧 Checking orders that need hospitalName fix...');
    const ordersNeedingFix = await Order.find({
      $or: [
        { hospitalName: { $exists: false } },
        { hospitalName: null },
        { hospitalName: '' }
      ]
    })
      .populate('doctorId', 'name role email hospitalName')
      .limit(5);

    console.log(`\n Found ${ordersNeedingFix.length} orders needing fix:`);
    ordersNeedingFix.forEach((order, index) => {
      console.log(`\n${index + 1}. Order ${order.orderNumber}:`);
      console.log(`   - Current hospitalName: "${order.hospitalName}"`);
      console.log(`   - Doctor hospitalName: "${order.doctorId?.hospitalName}"`);
      console.log(`   - Doctor name: "${order.doctorId?.name}"`);
      
      // Show what it would be updated to
      let newHospitalName = order.doctorId?.hospitalName || order.doctorId?.name || 'Unknown Hospital';
      console.log(`   - Would update to: "${newHospitalName}"`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from database');
  }
}

testHospitalNameFix();
