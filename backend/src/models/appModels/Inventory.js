const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
  itemName: { type: String, required: true },
  quantity: { type: Number, required: true },
  category: { type: String, required: true },
  price: { type: Number, required: true },
  // Added fields from ProductInventory model
  productCode: { type: String, required: false, default: '' },
  nameAlias: { type: String, required: false, default: '' },
  material: { type: String, required: false, default: '' },
  gstRate: { type: Number, required: false, default: 5 },
  // Optional additional fields for future use
  manufacturer: { type: String, required: false },
  description: { type: String, required: false },
  expiryDate: { type: Date, required: false },
  batchNumber: { type: String, required: false },
}, {
  timestamps: true,
  collection: 'inventory' // ✅ lowercase 'inventory' to match your MongoDB collection name
});

// ✅ Ensure model name is 'Inventory' and matches MongoDB collection 'inventory'
module.exports = mongoose.models.Inventory || mongoose.model('Inventory', inventorySchema);
