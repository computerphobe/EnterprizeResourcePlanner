const mongoose = require('mongoose');

const deliverySchema = new mongoose.Schema(
  {
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Deliverer', required: true, index: true },
    status: {
      type: String,
      enum: ['pending', 'picked_up', 'delivered', 'cancelled'],
      default: 'pending',
    },
    pickupDetails: {
      address: { type: String, required: true },
      contact: { type: String, required: true },
      pickupConfirmed: { type: Boolean, default: false },
      pickupTime: { type: Date },
    },
    deliveryDetails: {
      address: { type: String, required: true },
      contact: { type: String, required: true },
      deliveryConfirmed: { type: Boolean, default: false },
      deliveryTime: { type: Date },
    },
    history: [
      {
        status: {
          type: String,
          enum: ['pending', 'picked_up', 'delivered', 'cancelled'],
          required: true,
        },
        timestamp: { type: Date, default: Date.now },
        updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Deliverer' },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Delivery', deliverySchema);
