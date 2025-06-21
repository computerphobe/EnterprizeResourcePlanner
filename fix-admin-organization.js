// Script to fix organizationId for existing admins
const mongoose = require('mongoose');

// Update this with your actual MongoDB connection string
const MONGODB_URI = 'mongodb://localhost:27017/your-database-name';

async function fixAdminOrganizations() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('📊 Connected to MongoDB');
    
    const Admin = mongoose.model('Admin', require('./backend/src/models/coreModels/Admin').schema);
    
    // Find the owner (admin without organizationId)
    const owner = await Admin.findOne({ 
      role: 'owner',
      $or: [
        { organizationId: { $exists: false } },
        { organizationId: null }
      ]
    });
    
    if (!owner) {
      console.log('❌ No owner found. Creating a default owner...');
      // You might need to create an owner manually
      return;
    }
    
    console.log(`👑 Found owner: ${owner.name} (${owner.email})`);
    
    // Find all admins without organizationId (except the owner)
    const adminsWithoutOrg = await Admin.find({
      role: { $ne: 'owner' },
      $or: [
        { organizationId: { $exists: false } },
        { organizationId: null }
      ]
    });
    
    console.log(`🔍 Found ${adminsWithoutOrg.length} admins without organizationId`);
    
    // Update them to belong to the owner's organization
    for (const admin of adminsWithoutOrg) {
      await Admin.findByIdAndUpdate(admin._id, {
        organizationId: owner._id
      });
      console.log(`✅ Updated ${admin.name} (${admin.role}) - organizationId: ${owner._id}`);
    }
    
    console.log(`\n🎉 Migration completed! Updated ${adminsWithoutOrg.length} admins`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📊 Disconnected from MongoDB');
  }
}

// Run the migration
if (require.main === module) {
  fixAdminOrganizations().then(() => {
    process.exit(0);
  }).catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });
}

module.exports = fixAdminOrganizations;
