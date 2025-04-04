const mongoose = require('mongoose');

const ReturnsSchema = new mongoose.Schema(
  {
    originalItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Inventory',
      required: true,
    },
    returnedQuantity: {
      type: Number,
      required: true,
    },
    reason: {
      type: String,
    },
    status: {
      type: String,
      enum: ['Available for reuse', 'Disposed', 'Damaged'],
      default: 'Available for reuse',
    },
    recipient: {
      name: { type: String },
      department: { type: String },
      notes: { type: String }
    },
    disposalDate: {
      type: Date
    },
    returnDate: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true, collection: 'returns' } // Specify the collection name
);

module.exports = mongoose.model('Returns', ReturnsSchema);