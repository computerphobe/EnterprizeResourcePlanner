const mongoose = require('mongoose');
require('dotenv').config();

async function testAdminListAPI() {
  try {
    await mongoose.connect(process.env.DATABASE);
    console.log('Connected to database');
    
    // Simulate the admin controller list method
    const Admin = require('./src/models/coreModels/Admin');
    
    const admins = await Admin.find({ 
      $or: [
        { isDeleted: false },
        { isDeleted: { $exists: false } },
        { isDeleted: undefined }
      ]
    }); 
    
    console.log(`Found ${admins.length} non-deleted admins`);
    console.log('Roles found:', [...new Set(admins.map(admin => admin.role))]);
    
    const deliverers = admins.filter(admin => admin.role === 'deliverer');
    console.log(`\nDeliverers that will be returned to frontend: ${deliverers.length}`);
    
    deliverers.forEach((deliverer, index) => {
      console.log(`  ${index + 1}. ${deliverer.name} (${deliverer.email})`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

testAdminListAPI();
