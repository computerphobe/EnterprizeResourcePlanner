const mongoose = require('mongoose');

const ledgerEntrySchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  account: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['revenue', 'expense', 'asset', 'liability'],
    required: true
  },
  debit: {
    type: Number,
    default: 0
  },
  credit: {
    type: Number,
    default: 0
  },
  reference: {
    type: String
  },
  createdBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Admin'
  },
  isDeleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Add text index for searching
ledgerEntrySchema.index(
  { 
    account: 'text', 
    description: 'text', 
    reference: 'text' 
  }
);

module.exports = mongoose.model('LedgerEntry', ledgerEntrySchema); 