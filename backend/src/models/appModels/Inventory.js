const mongoose = require('mongoose');

// Remove old cached model if it exists
const inventorySchema = new mongoose.Schema({
    itemName: { type: String, required: true },  // Change 'name' to 'itemName'
    quantity: { type: Number, required: true },
    category: { type: String, required: true },  // Change 'description' to 'category'
    price: { type: Number, required: true },
}, { timestamps: true, collection: 'Inventory' });

module.exports = mongoose.model('Inventory', inventorySchema);
