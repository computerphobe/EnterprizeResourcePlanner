const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    required: true,
    unique: true,
  },
  items: [{
    inventoryItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Inventory',
      required: true
    },
    quantity: Number,
    price: Number,
    // NEW: Track substitutions made for this item
    substitutions: [{
      returnId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Return'
      },
      quantitySubstituted: Number,
      substitutedAt: {
        type: Date,
        default: Date.now
      },
      substitutedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin'
      }
    }]
  }],
  totalAmount: Number,
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'cancelled'],
    default: 'pending'
  },
  orderType: {
    type: String,
    enum: ['admin', 'doctor'],
    default: 'admin'
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: function () { return this.orderType === 'doctor'; }
  },
  doctorName: String,
  hospitalName: String,
  delivererId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    default: null
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  invoiceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Invoice',
    default: null
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  // NEW: Track if any items have been substituted
  hasSubstitutions: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

// Auto-generate order number
orderSchema.pre('save', async function (next) {
  if (!this.orderNumber) {
    const prefix = this.orderType === 'doctor' ? 'DO' : 'AO';
    const count = await mongoose.model('Order').countDocuments();
    this.orderNumber = `${prefix}${String(count + 1).padStart(6, '0')}`;
  }

  // Update hasSubstitutions flag
  this.hasSubstitutions = this.items.some(item => 
    item.substitutions && item.substitutions.length > 0
  );

  next();
});

module.exports = mongoose.model('Order', orderSchema);