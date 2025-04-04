const mongoose = require('mongoose');

const returnSchema = new mongoose.Schema({
  // Existing fields
  returnNumber: {
    type: String,
    required: true,
    unique: true
  },
  items: [{
    inventoryItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Inventory',
      required: true
    },
    quantity: Number,
    reason: String
  }],
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  // New fields for doctor returns
  returnType: {
    type: String,
    enum: ['admin', 'doctor'],
    default: 'admin'
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: function() { return this.returnType === 'doctor'; }
  },
  doctorName: String,
  hospitalName: String,
  // Existing fields
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  isDeleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Auto-generate return number
returnSchema.pre('save', async function(next) {
  if (!this.returnNumber) {
    const prefix = this.returnType === 'doctor' ? 'DR' : 'AR'; // DR for Doctor Return, AR for Admin Return
    const count = await mongoose.model('Return').countDocuments();
    this.returnNumber = `${prefix}${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Return', returnSchema); 