const mongoose = require('mongoose');

const ProductInventorySchema = new mongoose.Schema(
  {
    itemName: { type: String, required: true },
    productCode: { type: String, required: true },
    nameAlias: { type: String, required: true },
    material: { type: String, required: true },
    quantity: { type: Number, required: true },
    category: { type: String, required: true },
    price: { type: Number, required: true },

    // ✅ Add this line:
    gstRate: { type: Number, required: true },
  },
  { timestamps: true }
);

// Explicit collection name "ProductInventory"
module.exports =
  mongoose.models.ProductInventory ||
  mongoose.model('ProductInventory', ProductInventorySchema, 'ProductInventory');
