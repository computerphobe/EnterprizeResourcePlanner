const mongoose = require('mongoose');
require('dotenv').config();

async function fixIsDeletedField() {
  try {
    await mongoose.connect(process.env.DATABASE);
    console.log('Connected to database');
    
    const Admin = require('./src/models/coreModels/Admin');
    
    // Find all admins where isDeleted is undefined or missing
    const adminsToUpdate = await Admin.find({ 
      $or: [
        { isDeleted: { $exists: false } },
        { isDeleted: undefined }
      ]
    });
    
    console.log(`Found ${adminsToUpdate.length} admins with undefined/missing isDeleted field`);
    
    if (adminsToUpdate.length > 0) {
      // Update all of them to have isDeleted: false
      const updateResult = await Admin.updateMany(
        { 
          $or: [
            { isDeleted: { $exists: false } },
            { isDeleted: undefined }
          ]
        },
        { $set: { isDeleted: false } }
      );
      
      console.log(`Updated ${updateResult.modifiedCount} admin records to have isDeleted: false`);
      
      // Verify the update
      const deliverersAfterUpdate = await Admin.find({ role: 'deliverer', isDeleted: false });
      console.log(`Deliverers now properly marked (isDeleted: false): ${deliverersAfterUpdate.length}`);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

// Uncomment the line below to run the fix
// fixIsDeletedField();

console.log('This script can fix the isDeleted field for all admin records.');
console.log('Uncomment the last line to run the fix.');
console.log('The current admin controller fix already handles undefined values, so this is optional.');
