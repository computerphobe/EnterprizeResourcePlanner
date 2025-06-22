const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.DATABASE, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;

db.on('error', console.error.bind(console, 'Connection error:'));
db.once('open', async () => {
  console.log('✅ Connected to MongoDB');
  
  try {
    // List all collections
    const collections = await db.db.listCollections().toArray();
    console.log('\n📂 Available collections:');
    collections.forEach(col => {
      console.log(`  - ${col.name}`);
    });
    
    // Check different possible collection names for inventory
    const possibleCollections = ['inventory', 'Inventory', 'inventories', 'Inventories'];
    
    for (const collectionName of possibleCollections) {
      try {
        const collection = db.db.collection(collectionName);
        const count = await collection.countDocuments();
        console.log(`\n🔍 Collection "${collectionName}": ${count} documents`);
        
        if (count > 0) {
          const sample = await collection.findOne();
          console.log(`📄 Sample document from "${collectionName}":`, JSON.stringify(sample, null, 2));
        }
      } catch (err) {
        console.log(`❌ Error checking collection "${collectionName}":`, err.message);
      }
    }
    
    // Test the Inventory model directly
    const Inventory = require('./src/models/appModels/Inventory');
    console.log(`\n🏷️  Model info:`);
    console.log(`  - Model name: ${Inventory.modelName}`);
    console.log(`  - Collection name: ${Inventory.collection.name}`);
    
    const modelItems = await Inventory.find({}).lean();
    console.log(`  - Items found via model: ${modelItems.length}`);
    
    if (modelItems.length > 0) {
      console.log(`  - Sample item via model:`, JSON.stringify(modelItems[0], null, 2));
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.connection.close();
  }
});
