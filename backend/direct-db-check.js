// Direct database check - bypasses server issues
const mongoose = require('mongoose');

async function directDatabaseCheck() {
  try {
    console.log('🔍 Connecting directly to database...');
    
    // Get the connection string from the environment or use default
    const connectionString = process.env.DATABASE || 'mongodb+srv://aryan:aryank2005@cluster0.1vuau7m.mongodb.net/test';
    console.log('📡 Connection string:', connectionString.replace(/\/\/.*:.*@/, '//***:***@')); // Hide credentials
    
    await mongoose.connect(connectionString);
    console.log('✅ Connected to database');
    
    // List all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('\n📋 All collections:');
    collections.forEach(col => console.log(`  - ${col.name}`));
    
    // Check inventory-related collections
    const inventoryCollections = collections.filter(col => 
      col.name.toLowerCase().includes('inventory') || 
      col.name.toLowerCase().includes('product')
    );
    
    console.log('\n🎯 Inventory-related collections:');
    
    for (const col of inventoryCollections) {
      console.log(`\n📊 Collection: ${col.name}`);
      const collection = mongoose.connection.db.collection(col.name);
      const count = await collection.countDocuments();
      console.log(`   Count: ${count} documents`);
      
      if (count > 0) {
        // Get a sample document
        const sample = await collection.findOne({});
        console.log('   Sample document:');
        console.log('     _id:', sample._id);
        console.log('     itemName:', sample.itemName || 'NOT_SET');
        console.log('     quantity:', sample.quantity || 'NOT_SET');
        console.log('     isActive:', sample.isActive);
        console.log('     organizationId:', sample.organizationId || 'NOT_SET');
        console.log('     createdBy:', sample.createdBy || 'NOT_SET');
        
        // Check how many have organization/user data
        const withOrg = await collection.countDocuments({ organizationId: { $ne: null } });
        const withCreatedBy = await collection.countDocuments({ createdBy: { $ne: null } });
        const withoutOrg = await collection.countDocuments({ 
          $or: [
            { organizationId: null },
            { organizationId: { $exists: false } }
          ]
        });
        
        console.log('   Data analysis:');
        console.log(`     With organizationId: ${withOrg}`);
        console.log(`     With createdBy: ${withCreatedBy}`);
        console.log(`     Without organizationId: ${withoutOrg}`);
      }
    }
    
    // Check if there are other potential collections
    const allDocs = await Promise.all(
      collections.map(async (col) => {
        const count = await mongoose.connection.db.collection(col.name).countDocuments();
        return { name: col.name, count };
      })
    );
    
    console.log('\n📈 All collections with counts:');
    allDocs
      .filter(doc => doc.count > 0)
      .sort((a, b) => b.count - a.count)
      .forEach(doc => console.log(`   ${doc.name}: ${doc.count} documents`));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.message.includes('ECONNREFUSED')) {
      console.log('💡 Tip: Make sure MongoDB is running');
    }
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from database');
  }
}

directDatabaseCheck();
