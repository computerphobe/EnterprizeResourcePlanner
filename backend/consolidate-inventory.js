// Consolidate everything to 'inventory' collection
const mongoose = require('mongoose');

async function consolidateToInventoryCollection() {
  try {
    const connectionString = process.env.DATABASE || 'mongodb+srv://aryan:aryank2005@cluster0.1vuau7m.mongodb.net/test';
    await mongoose.connect(connectionString);
    console.log('✅ Connected to database');
    
    const db = mongoose.connection.db;
    const inventoryCollection = db.collection('inventory');
    const productInventoriesCollection = db.collection('productinventories');
    
    // Check current state
    const inventoryCount = await inventoryCollection.countDocuments();
    const productInventoriesCount = await productInventoriesCollection.countDocuments();
    
    console.log('\n📊 Current state:');
    console.log(`  - inventory collection: ${inventoryCount} items`);
    console.log(`  - productinventories collection: ${productInventoriesCount} items`);
    
    if (productInventoriesCount === 0) {
      console.log('✅ No data to migrate from productinventories');
      return;
    }
    
    // Get all items from productinventories
    const productItems = await productInventoriesCollection.find({}).toArray();
    console.log(`\n🔄 Found ${productItems.length} items to migrate from productinventories`);
    
    let migratedCount = 0;
    let skippedCount = 0;
    
    for (const item of productItems) {
      try {
        // Check if item already exists in inventory collection (by itemName and similar properties)
        const existingItem = await inventoryCollection.findOne({
          $or: [
            { _id: item._id },
            { 
              itemName: item.itemName, 
              category: item.category,
              price: item.price
            }
          ]
        });
        
        if (existingItem) {
          console.log(`⚠️  Skipping duplicate: ${item.itemName}`);
          skippedCount++;
          continue;
        }
        
        // Transform and insert into inventory collection
        const inventoryItem = {
          ...item,
          // Ensure consistent field names
          isActive: item.isActive !== false, // Default to true if undefined
          organizationId: item.organizationId || null,
          createdBy: item.createdBy || null,
          lastUpdatedBy: item.lastUpdatedBy || item.createdBy || null
        };
        
        await inventoryCollection.insertOne(inventoryItem);
        console.log(`✅ Migrated: ${item.itemName}`);
        migratedCount++;
        
      } catch (error) {
        console.error(`❌ Error migrating ${item.itemName}:`, error.message);
      }
    }
    
    console.log(`\n📈 Migration summary:`);
    console.log(`  - Items migrated: ${migratedCount}`);
    console.log(`  - Items skipped (duplicates): ${skippedCount}`);
    console.log(`  - Total items processed: ${productItems.length}`);
    
    // Verify final count
    const finalInventoryCount = await inventoryCollection.countDocuments();
    console.log(`\n📊 Final inventory collection count: ${finalInventoryCount} items`);
    
    // Create backup of productinventories before removing
    console.log('\n🗂️  Creating backup of productinventories...');
    try {
      await db.collection('productinventories_backup').drop().catch(() => {}); // Ignore error if doesn't exist
      if (productItems.length > 0) {
        await db.collection('productinventories_backup').insertMany(productItems);
        console.log('✅ Backup created: productinventories_backup');
      }
    } catch (backupError) {
      console.error('⚠️  Backup creation failed:', backupError.message);
    }
    
    // Clear productinventories collection (but don't drop it yet for safety)
    console.log('\n🧹 Clearing productinventories collection...');
    const deleteResult = await productInventoriesCollection.deleteMany({});
    console.log(`✅ Cleared ${deleteResult.deletedCount} items from productinventories`);
    
    console.log('\n🎉 Consolidation completed!');
    console.log('📝 Next steps:');
    console.log('  1. Restart the backend server');
    console.log('  2. Test inventory listing and creation');
    console.log('  3. If everything works, you can drop productinventories_backup collection');
    
  } catch (error) {
    console.error('❌ Consolidation failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from database');
  }
}

console.log('🚀 Starting inventory consolidation to single collection...');
consolidateToInventoryCollection();
