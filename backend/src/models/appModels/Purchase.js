const mongoose = require('mongoose');

const purchaseSchema = new mongoose.Schema(
  {
    supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', required: true },
    purchaseNumber: { type: String, required: true },
    purchaseDate: { type: Date, required: true },
    items: [{
      inventoryItem: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Inventory',
        required: true
      },
      quantity: { type: Number, required: true },
      price: { type: Number, required: true }
    }],
    subtotal: { type: Number, required: true },
    taxRate: { type: Number, required: true },
    taxAmount: { type: Number, required: true },
    totalAmount: { type: Number, required: true },
    status: { type: String, default: 'Pending' },
    paymentStatus: { type: String, default: 'Unpaid' },
    notes: String,
    isDeleted: { type: Boolean, default: false }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Purchase', purchaseSchema);
