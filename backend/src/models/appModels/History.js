const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  removed: {
    type: Boolean,
    default: false,
  },
  enabled: {
    type: Boolean,
    default: true,
  },

  // Activity Details
  activityType: {
    type: String,
    required: true,
    enum: [
      'order_created', 'order_updated', 'order_delivered', 'order_cancelled',
      'invoice_created', 'invoice_paid', 'invoice_sent', 'invoice_cancelled',
      'return_collected', 'return_processed', 'return_reused', 'return_disposed',
      'inventory_updated', 'client_created', 'client_updated'
    ]
  },
  
  description: {
    type: String,
    required: true,
  },

  // References
  relatedId: {
    type: mongoose.Schema.ObjectId,
    required: true, // ID of the related document (order, invoice, return, etc.)
  },
  
  relatedModel: {
    type: String,
    required: true,
    enum: ['Order', 'Invoice', 'Returns', 'Inventory', 'Client']
  },

  // User who performed the action
  performedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'Admin',
    required: true,
  },

  // Client involved (if applicable)
  client: {
    type: mongoose.Schema.ObjectId,
    ref: 'Client',
  },

  // Financial details (if applicable)
  amount: {
    type: Number,
    default: 0,
  },

  currency: {
    type: String,
    default: 'USD',
  },

  // Status information
  previousStatus: String,
  newStatus: String,

  // Additional metadata
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },

  // Timestamps
  activityDate: {
    type: Date,
    default: Date.now,
  },
  
  created: {
    type: Date,
    default: Date.now,
  },
  updated: {
    type: Date,
    default: Date.now,
  },
});

// Indexes for better query performance
schema.index({ activityType: 1, activityDate: -1 });
schema.index({ relatedModel: 1, relatedId: 1 });
schema.index({ client: 1, activityDate: -1 });
schema.index({ performedBy: 1, activityDate: -1 });
schema.index({ activityDate: -1 });

schema.plugin(require('mongoose-autopopulate'));

module.exports = mongoose.model('History', schema);
