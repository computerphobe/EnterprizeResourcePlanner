const { quantity } = require('@/locale/translation/en_us');
const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  name: String,
  quantity: Number,
  price: Number,
  returnAmount: {type: Number, default: 0 },
});

const deliverySchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: [true, 'Order ID is required'],
      index: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Deliverer',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'picked_up', 'delivered', 'cancelled'],
      default: 'pending',
    },
    pickupDetails: {
      address: { type: String, required: false },
      contact: { type: String, required: false },
      pickupConfirmed: { type: Boolean, default: false },
      pickupTime: { type: Date },
    },
    deliveryDetails: {
      address: { type: String, required: false },
      contact: { type: String, required: false },
      deliveryConfirmed: { type: Boolean, default: false },
      deliveryTime: { type: Date },
    },
    items: [itemSchema],
    client: {
      name: { type: String, required: true },
    },
    deliveryPhoto: { type: String }, // path to delivery photo
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
