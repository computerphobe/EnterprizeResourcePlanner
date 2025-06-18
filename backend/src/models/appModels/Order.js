const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      unique: true,
    },
    items: [
      {
        inventoryItem: {
          type: mongoose.Schema.ObjectId,
          ref: 'Inventory',
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
        },        price: {
          type: Number,
          default: 0,
        },
        total: {
          type: Number,
          default: 0,
        },
        purchaseType: {
          type: String,
          enum: ['buy', 'rent'],
          default: 'buy',
        },
        substitutions: [
          {
            returnId: {
              type: mongoose.Schema.ObjectId,
              ref: 'Returns',
            },
            quantitySubstituted: {
              type: Number,
              required: true,
            },
            substitutedAt: {
              type: Date,
              default: Date.now,
            },
            substitutedBy: {
              type: mongoose.Schema.ObjectId,
              ref: 'Admin',
            },
          },
        ],
      },
    ],
    totalAmount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'picked_up', 'completed', 'cancelled', 'collected'],
      default: 'pending',
    },
    orderType: {
      type: String,
      enum: ['doctor', 'admin'],
      default: 'doctor',
    },
    doctorId: {
      type: mongoose.Schema.ObjectId,
      ref: 'Admin',
    },
    doctorName: {
      type: String,
    },
    hospitalName: {
      type: String,
    },
    delivererId: {
      type: mongoose.Schema.ObjectId,
      ref: 'Admin',
    },
    assignedAt: {
      type: Date,
    },
    pickedUpAt: {
      type: Date,
    },
    deliveredAt: {
      type: Date,
    },
    pickupVerification: {
      photo: String,
      timestamp: Date,
      location: String,
      notes: String,
    },
    deliveryVerification: {
      photo: String,
      timestamp: Date,
      customerSignature: String,
      customerName: String,
      location: String,
      notes: String,
    },
    hasSubstitutions: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'Admin',
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    removed: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Auto-generate order number and calculate totals
orderSchema.pre('save', async function (next) {
  if (this.isNew && !this.orderNumber) {
    try {
      const count = await mongoose.model('Order').countDocuments();
      this.orderNumber = `ORD-${String(count + 1).padStart(6, '0')}`;
    } catch (error) {
      console.error('Error generating order number:', error);
      this.orderNumber = `ORD-${Date.now()}`;
    }
  }

  // Calculate item totals and order total
  let orderTotal = 0;
  this.items.forEach(item => {
    if (!item.total) {
      item.total = (item.price || 0) * (item.quantity || 0);
    }
    orderTotal += item.total;
  });
  
  if (!this.totalAmount) {
    this.totalAmount = orderTotal;
  }

  next();
});

// Update hasSubstitutions field when substitutions are added
orderSchema.pre('save', function (next) {
  let hasSubstitutions = false;
  this.items.forEach(item => {
    if (item.substitutions && item.substitutions.length > 0) {
      hasSubstitutions = true;
    }
  });
  this.hasSubstitutions = hasSubstitutions;
  next();
});

module.exports = mongoose.model('Order', orderSchema);