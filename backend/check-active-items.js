// Check active items in both collections
const mongoose = require('mongoose');

async function checkActiveItems() {
  try {
    const connectionString = process.env.DATABASE || 'mongodb+srv://aryan:aryank2005@cluster0.1vuau7m.mongodb.net/test';
    await mongoose.connect(connectionString);
    console.log('✅ Connected to database');
    
    // Check inventory collection
    console.log('\n📊 Inventory collection analysis:');
    const inventoryCollection = mongoose.connection.db.collection('inventory');
    const totalInventory = await inventoryCollection.countDocuments();
    const activeInventory = await inventoryCollection.countDocuments({ 
      $or: [
        { isActive: true },
        { isActive: { $exists: false } }, // Missing isActive field
        { isActive: null }
      ]
    });
    const withQuantity = await inventoryCollection.countDocuments({ quantity: { $gt: 0 } });
    
    console.log(`  Total: ${totalInventory}`);
    console.log(`  Active (or undefined): ${activeInventory}`);
    console.log(`  With quantity > 0: ${withQuantity}`);
    
    // Sample active items
    const sampleInventory = await inventoryCollection.find({
      $or: [
        { isActive: true },
        { isActive: { $exists: false } },
        { isActive: null }
      ]
    }).limit(3).toArray();
    
    console.log('  Sample active items:');
    sampleInventory.forEach((item, i) => {
      console.log(`    ${i + 1}. ${item.itemName} (qty: ${item.quantity}, active: ${item.isActive})`);
    });
    
    // Check productinventories collection
    console.log('\n📊 ProductInventories collection analysis:');
    const productCollection = mongoose.connection.db.collection('productinventories');
    const totalProduct = await productCollection.countDocuments();
    const activeProduct = await productCollection.countDocuments({ 
      $or: [
        { isActive: true },
        { isActive: { $exists: false } },
        { isActive: null }
      ]
    });
    const productWithQuantity = await productCollection.countDocuments({ quantity: { $gt: 0 } });
    
    console.log(`  Total: ${totalProduct}`);
    console.log(`  Active (or undefined): ${activeProduct}`);
    console.log(`  With quantity > 0: ${productWithQuantity}`);
    
    // Sample active items
    const sampleProduct = await productCollection.find({
      $or: [
        { isActive: true },
        { isActive: { $exists: false } },
        { isActive: null }
      ]
    }).limit(3).toArray();
    
    console.log('  Sample active items:');
    sampleProduct.forEach((item, i) => {
      console.log(`    ${i + 1}. ${item.itemName} (qty: ${item.quantity}, active: ${item.isActive})`);
    });
    
    // Conclusion
    console.log('\n🎯 Conclusion:');
    if (activeInventory > 0) {
      console.log(`✅ Inventory collection has ${activeInventory} active items - should work`);
    }
    if (activeProduct > 0) {
      console.log(`✅ ProductInventories collection has ${activeProduct} active items - fallback available`);
    }
    
    if (activeInventory === 0 && activeProduct === 0) {
      console.log('❌ No active items in either collection');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from database');
  }
}

checkActiveItems();
