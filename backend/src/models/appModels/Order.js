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
    // Add substitutions array to track substituted items
    substitutions: [{
      returnId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Returns',
        required: true
      },
      quantitySubstituted: {
        type: Number,
        required: true,
        min: 1
      },
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
    enum: ['pending', 'processing', 'picked_up', 'completed', 'cancelled'],
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
  },  doctorName: String,
  hospitalName: String,
  patientName: {
    type: String,
    trim: true,
    required: false // Optional field for patient name
  },
  delivererId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    default: null
  },  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  // Photo verification fields
  pickedUpAt: {
    type: Date
  },
  deliveredAt: {
    type: Date
  },
  pickupVerification: {
    photo: {
      type: String // Base64 encoded photo
    },
    timestamp: {
      type: Date
    },
    notes: {
      type: String
    },
    location: {
      address: String,
      coordinates: {
        lat: Number,
        lng: Number
      }
    }
  },
  deliveryVerification: {
    photo: {
      type: String // Base64 encoded photo
    },
    timestamp: {
      type: Date
    },
    customerSignature: {
      type: String // Base64 encoded signature
    },
    customerName: {
      type: String
    },
    notes: {
      type: String
    },
    location: {
      address: String,
      coordinates: {
        lat: Number,
        lng: Number
      }
    }
  },
  isDeleted: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

// Auto-generate order number and calculate totals
orderSchema.pre('save', async function (next) {
  try {
    if (!this.orderNumber) {
      console.log('Generating orderNumber for new order');
      const prefix = this.orderType === 'doctor' ? 'DO' : 'AO';
      const count = await mongoose.model('Order').countDocuments();
      this.orderNumber = `${prefix}${String(count + 1).padStart(6, '0')}`;
      console.log('Generated orderNumber:', this.orderNumber);
    }
    next();
  } catch (error) {
    console.error('Error in Order pre-save hook:', error);
    next(error);
  }
});

module.exports = mongoose.model('Order', orderSchema);