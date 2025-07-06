// Debug script to check both inventory collections and models
const mongoose = require('mongoose');

async function debugInventoryCollections() {
  try {
    console.log('🔍 Debugging inventory collections and models...');
    
    await mongoose.connect('mongodb+srv://aryan:aryank2005@cluster0.1vuau7m.mongodb.net/test');
    console.log('✅ Connected to database');
    
    // Check what collections exist in the database
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('\n📋 All collections in database:');
    collections.forEach(col => {
      console.log(`  - ${col.name}`);
    });
    
    // Check for inventory-related collections specifically
    const inventoryCollections = collections.filter(col => 
      col.name.toLowerCase().includes('inventory') || 
      col.name.toLowerCase().includes('product')
    );
    
    console.log('\n🎯 Inventory-related collections:');
    inventoryCollections.forEach(col => {
      console.log(`  - ${col.name}`);
    });
    
    // Check data in each inventory-related collection
    for (const col of inventoryCollections) {
      const collection = mongoose.connection.db.collection(col.name);
      const count = await collection.countDocuments();
      console.log(`\n📊 Collection "${col.name}": ${count} documents`);
      
      if (count > 0) {
        const sample = await collection.findOne({});
        console.log(`   Sample document:`, {
          _id: sample._id,
          itemName: sample.itemName,
          quantity: sample.quantity,
          isActive: sample.isActive,
          organizationId: sample.organizationId
        });
      }
    }
    
    // Now test both models
    console.log('\n🧪 Testing both inventory models...');
    
    // Test Inventory model
    try {
      const Inventory = require('./src/models/appModels/Inventory');
      const inventoryItems = await Inventory.find({}).limit(3);
      console.log(`✅ Inventory model: Found ${inventoryItems.length} items`);
      if (inventoryItems.length > 0) {
        console.log(`   Sample: ${inventoryItems[0].itemName}`);
      }
    } catch (error) {
      console.log(`❌ Inventory model error: ${error.message}`);
    }
    
    // Test ProductInventory model
    try {
      const ProductInventory = require('./src/models/appModels/ProductInventory');
      const productItems = await ProductInventory.find({}).limit(3);
      console.log(`✅ ProductInventory model: Found ${productItems.length} items`);
      if (productItems.length > 0) {
        console.log(`   Sample: ${productItems[0].itemName}`);
      }
    } catch (error) {
      console.log(`❌ ProductInventory model error: ${error.message}`);
    }
    
    // Check which collection each model is actually using
    console.log('\n🔍 Model collection mappings:');
    try {
      const Inventory = require('./src/models/appModels/Inventory');
      console.log(`Inventory model uses collection: "${Inventory.collection.name}"`);
    } catch (error) {
      console.log(`❌ Cannot get Inventory collection name: ${error.message}`);
    }
    
    try {
      const ProductInventory = require('./src/models/appModels/ProductInventory');
      console.log(`ProductInventory model uses collection: "${ProductInventory.collection.name}"`);
    } catch (error) {
      console.log(`❌ Cannot get ProductInventory collection name: ${error.message}`);
    }
    
  } catch (error) {
    console.error('❌ Debug error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from database');
  }
}

debugInventoryCollections();
