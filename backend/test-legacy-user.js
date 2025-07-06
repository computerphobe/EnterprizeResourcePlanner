// Test script to validate inventory creation for legacy users
const mongoose = require('mongoose');
const Inventory = require('./src/models/appModels/Inventory');

async function testLegacyUserInventoryCreation() {
  try {
    console.log('🧪 Testing legacy user inventory creation...');
    
    await mongoose.connect('mongodb://localhost:27017/idurar-crm-erp');
    console.log('✅ Connected to database');
    
    // Test data for a legacy user (no organization)
    const testItem = {
      itemName: 'Legacy Test Item',
      quantity: 100,
      category: 'medicines',
      price: 50,
      productCode: 'LEGACY-TEST-001',
      nameAlias: 'Legacy Item',
      material: 'Test Material',
      gstRate: 12,
      description: 'Test item for legacy user validation',
      minimumStock: 10,
      maximumStock: 500,
      unit: 'pieces',
      // Deliberately not setting organizationId or createdBy
      organizationId: null,
      createdBy: null
    };
    
    console.log('🔍 Creating test item for legacy user...');
    console.log('Test data:', JSON.stringify(testItem, null, 2));
    
    const createdItem = await Inventory.create(testItem);
    console.log('✅ Successfully created inventory item for legacy user!');
    console.log('Created item ID:', createdItem._id);
    console.log('Organization ID:', createdItem.organizationId);
    console.log('Created By:', createdItem.createdBy);
    
    // Clean up the test item
    await Inventory.findByIdAndDelete(createdItem._id);
    console.log('🧹 Test item cleaned up');
    
    console.log('\n🎉 Legacy user inventory creation test passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Full error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from database');
  }
}

testLegacyUserInventoryCreation();
