const mongoose = require('mongoose');
const { ref } = require('pdfkit');

const returnsSchema = new mongoose.Schema({
  // Reference to the original inventory item
  originalItemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Inventory',
    required: true
  },
  // Quantity returned
  returnedQuantity: {
    type: Number,
    required: true,
    min: 1
  },
  // Reason for return
  reason: {
    type: String,
    default: ''
  },
  // Status of the returned item
  status: {
    type: String,
    enum: ['Available for reuse', 'Used', 'Damaged', 'Disposed'],
    default: 'Available for reuse'
  },
  // Return date
  returnDate: {
    type: Date,
    default: Date.now
  },
  // NEW: Track when item was used
  usedDate: {
    type: Date
  },
  // NEW: Track which orders used this return
  usedInOrders: [{
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order'
    },
    quantityUsed: Number,
    usedAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Return type (admin or doctor)
  returnType: {
    type: String,
    enum: ['admin', 'doctor'],
    default: 'admin'
  },
  returnOrder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
  },  // Doctor information (if return type is doctor)
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  doctorName: String,
  hospitalName: String,  // Who created this return
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  // NEW: Collection metadata for deliverer-collected returns
  collectionMetadata: {
    photo: String, // Base64 encoded photo of returned items
    customerSignature: String, // Base64 encoded customer signature
    customerName: String,
    notes: String,
    collectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin' // The deliverer who collected the return
    },
    collectionDate: Date
  },
  isDeleted: {
    type: Boolean,
    default: false
  }
}, { 
  timestamps: true,
  collection: 'Returns' // Ensure consistent collection name
});

// Index for efficient queries
returnsSchema.index({ originalItemId: 1, status: 1 });
returnsSchema.index({ status: 1 });

module.exports = mongoose.model('Return', returnsSchema);