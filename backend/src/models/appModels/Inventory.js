const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
  itemName: { type: String, required: true },
  quantity: { type: Number, required: true },
  category: { type: String, required: true },
  price: { type: Number, required: true }
}, {
  timestamps: true,
  collection: 'inventory' // ✅ lowercase 'inventory' to match your MongoDB collection name
});

// ✅ Ensure model name is 'Inventory' and matches MongoDB collection 'inventory'
module.exports = mongoose.models.Inventory || mongoose.model('Inventory', inventorySchema);
