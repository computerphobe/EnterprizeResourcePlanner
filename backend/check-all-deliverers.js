const mongoose = require('mongoose');
require('dotenv').config();

async function checkAllDeliverers() {
  try {
    await mongoose.connect(process.env.DATABASE);
    console.log('Connected to database');
    
    const Admin = require('./src/models/coreModels/Admin');
    
    // Get all deliverers regardless of isDeleted status
    const allDeliverers = await Admin.find({ role: 'deliverer' });
    console.log('Total deliverers found (all):', allDeliverers.length);
    
    allDeliverers.forEach((deliverer, index) => {
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
    
    // Check with the current filter
    const nonDeletedDeliverers = await Admin.find({ role: 'deliverer', isDeleted: false });
    console.log('\nDeliverers with isDeleted: false:', nonDeletedDeliverers.length);
    
    // Check with undefined isDeleted
    const undefinedDeletedDeliverers = await Admin.find({ 
      role: 'deliverer', 
      $or: [{ isDeleted: { $exists: false } }, { isDeleted: undefined }]
    });
    console.log('Deliverers with isDeleted undefined/missing:', undefinedDeletedDeliverers.length);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkAllDeliverers();
