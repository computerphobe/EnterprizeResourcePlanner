// Quick debug script to check current inventory items in database
require('dotenv').config();
const mongoose = require('mongoose');
const path = require('path');

// Set up path aliases like the main app
const moduleAlias = require('module-alias');
moduleAlias.addAlias('@', __dirname + '/src');

const Inventory = require('./src/models/appModels/Inventory');

async function debugInventory() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.DATABASE || 'mongodb://127.0.0.1:27017/idurarcrm';
    await mongoose.connect(mongoUri);
    
    console.log('✅ Connected to MongoDB');
    
    // Get all inventory items
    const items = await Inventory.find({}).select('_id itemName quantity price category organizationId').lean();
    
    console.log(`📋 Found ${items.length} inventory items:`);
    items.forEach((item, index) => {
      console.log(`${index + 1}. ID: ${item._id} | Name: ${item.itemName} | Price: ₹${item.price} | Qty: ${item.quantity}`);
    });
    
    if (items.length > 0) {
      console.log('\n🔍 Testing specific ID from your logs:');
      const testId = '6866672bfa2ca3d64aa4fd12';
      const foundItem = await Inventory.findById(testId);
      console.log(`Looking for ID "${testId}": ${foundItem ? 'FOUND' : 'NOT FOUND'}`);
      
      console.log('\n✅ Available IDs to use in frontend:');
      items.slice(0, 5).forEach(item => {
        console.log(`"${item._id}" - ${item.itemName}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔚 Database connection closed');
  }
}

debugInventory();
