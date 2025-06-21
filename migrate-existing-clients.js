// Migration script to update existing clients for the new email-based flow
const mongoose = require('mongoose');

// You'll need to update this with your actual MongoDB connection string
const MONGODB_URI = 'mongodb://localhost:27017/your-database-name';

async function migrateExistingClients() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('📊 Connected to MongoDB');
    
    const Admin = mongoose.model('Admin', require('./backend/src/models/coreModels/Admin').schema);
    const Client = mongoose.model('Client', require('./backend/src/models/appModels/Client').schema);
    
    // Find all clients that are missing the new required fields
    const clientsToUpdate = await Client.find({
      $or: [
        { email: { $exists: false } },
        { email: null },
        { email: "" },
        { organizationId: { $exists: false } },
        { userRole: { $exists: false } }
      ],
      removed: false
    });
    
    console.log(`🔍 Found ${clientsToUpdate.length} clients that need migration`);
    
    let updatedCount = 0;
    
    for (const client of clientsToUpdate) {
      console.log(`\n🔧 Processing client: ${client.name}`);
      
      const updateFields = {};
      
      // Try to find matching admin user by name
      if (!client.email) {
        const matchingAdmin = await Admin.findOne({
          name: { $regex: new RegExp(client.name.split(' ')[0], 'i') },
          role: { $in: ['hospital', 'doctor'] }
        });
        
        if (matchingAdmin) {
          updateFields.email = matchingAdmin.email;
          updateFields.linkedUserId = matchingAdmin._id;
          updateFields.userRole = matchingAdmin.role;
          console.log(`   ✅ Matched with admin: ${matchingAdmin.email} (${matchingAdmin.role})`);
        }
      }
      
      // Set organizationId to the first owner admin if not set
      if (!client.organizationId) {
        const ownerAdmin = await Admin.findOne({ role: 'owner' });
        if (ownerAdmin) {
          updateFields.organizationId = ownerAdmin._id;
          console.log(`   📋 Set organizationId to owner: ${ownerAdmin.name}`);
        }
      }
      
      // Update the client if we have fields to update
      if (Object.keys(updateFields).length > 0) {
        await Client.findByIdAndUpdate(client._id, updateFields);
        updatedCount++;
        console.log(`   ✅ Updated client with:`, updateFields);
      } else {
        console.log(`   ⚠️  No matching admin found for client: ${client.name}`);
      }
    }
    
    console.log(`\n🎉 Migration completed! Updated ${updatedCount} out of ${clientsToUpdate.length} clients`);
    
    // Show summary
    const summary = await Client.aggregate([
      { $match: { removed: false } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          withEmail: { $sum: { $cond: [{ $and: [{ $ne: ["$email", null] }, { $ne: ["$email", ""] }] }, 1, 0] } },
          withOrgId: { $sum: { $cond: [{ $ne: ["$organizationId", null] }, 1, 0] } },
          withUserRole: { $sum: { $cond: [{ $ne: ["$userRole", null] }, 1, 0] } }
        }
      }
    ]);
    
    if (summary.length > 0) {
      console.log('\n📈 Client Summary:');
      console.log(`   Total clients: ${summary[0].total}`);
      console.log(`   With email: ${summary[0].withEmail}`);
      console.log(`   With organizationId: ${summary[0].withOrgId}`);
      console.log(`   With userRole: ${summary[0].withUserRole}`);
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📊 Disconnected from MongoDB');
  }
}

// Instructions
console.log('=== CLIENT MIGRATION SCRIPT ===');
console.log('');
console.log('INSTRUCTIONS:');
console.log('1. Update MONGODB_URI with your actual database connection string');
console.log('2. Make sure your ERP server is not running during migration');
console.log('3. Run: node migrate-existing-clients.js');
console.log('');
console.log('This script will:');
console.log('- Find clients missing email, organizationId, or userRole');
console.log('- Try to match them with existing admin users');
console.log('- Update client records with missing fields');
console.log('');

// Uncomment to run automatically
// migrateExistingClients();

module.exports = { migrateExistingClients };
