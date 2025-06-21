// Script to add organizationId to existing invoices
const mongoose = require('mongoose');

// Update this with your actual MongoDB connection string
const MONGODB_URI = 'mongodb://localhost:27017/your-database-name';

async function fixInvoiceOrganizations() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('📊 Connected to MongoDB');
    
    const Admin = mongoose.model('Admin', require('./backend/src/models/coreModels/Admin').schema);
    const Invoice = mongoose.model('Invoice', require('./backend/src/models/appModels/Invoice').schema);
    
    // Find the owner admin
    const owner = await Admin.findOne({ role: 'owner' });
    
    if (!owner) {
      console.log('❌ No owner found. Please run fix-admin-organization.js first');
      return;
    }
    
    console.log(`👑 Found owner: ${owner.name} (${owner.email})`);
    
    // Find all invoices without organizationId
    const invoicesWithoutOrg = await Invoice.find({
      $or: [
        { organizationId: { $exists: false } },
        { organizationId: null }
      ],
      removed: false
    });
    
    console.log(`🔍 Found ${invoicesWithoutOrg.length} invoices without organizationId`);
    
    // Update them to use the owner's organization
    let updatedCount = 0;
    for (const invoice of invoicesWithoutOrg) {
      await Invoice.findByIdAndUpdate(invoice._id, {
        organizationId: owner._id
      });
      updatedCount++;
      
      if (updatedCount % 10 === 0) {
        console.log(`✅ Updated ${updatedCount} invoices...`);
      }
    }
    
    console.log(`\n🎉 Migration completed! Updated ${invoicesWithoutOrg.length} invoices`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📊 Disconnected from MongoDB');
  }
}

// Run the migration
if (require.main === module) {
  fixInvoiceOrganizations().then(() => {
    process.exit(0);
  }).catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });
}

module.exports = fixInvoiceOrganizations;
