const mongoose = require('mongoose');
require('dotenv').config();

const Admin = require('./src/models/coreModels/Admin');

async function checkDeliverers() {
  try {
    await mongoose.connect(process.env.DATABASE);
    console.log('Connected to database');
    
    const allAdmins = await Admin.find({ isDeleted: false });
    console.log('Total non-deleted admins:', allAdmins.length);
    
    const deliverers = allAdmins.filter(admin => admin.role === 'deliverer');
    console.log('Total deliverers found:', deliverers.length);
    
    deliverers.forEach((deliverer, index) => {
      console.log(`Deliverer ${index + 1}:`, {
        _id: deliverer._id,
        name: deliverer.name,
        email: deliverer.email,
        role: deliverer.role,
        isDeleted: deliverer.isDeleted,
        enabled: deliverer.enabled,
        createdAt: deliverer.createdAt
      });
    });
    
    console.log('\nAll admin roles:', [...new Set(allAdmins.map(admin => admin.role))]);
    
    // Also check if there are any recently created deliverers
    const recentDeliverers = await Admin.find({ 
      role: 'deliverer',
      isDeleted: false,
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // last 24 hours
    });
    console.log('Recent deliverers (last 24 hours):', recentDeliverers.length);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkDeliverers();
