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
  },
  // Doctor information (if return type is doctor)
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: function() { return this.returnType === 'doctor'; }
  },
  doctorName: String,
  hospitalName: String,
  // Who created this return
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
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