const mongoose = require('mongoose');

const generalLedgerSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  account: { type: String, required: true },
  type: {
    type: String,
    enum: ['revenue', 'expense', 'asset', 'liability'],
    required: true
  },
  description: { type: String },
  debit: { type: Number, default: 0 },
  credit: { type: Number, default: 0 },
  invoiceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice' },

  // Optional refs for traceability
  refId: { type: mongoose.Schema.Types.ObjectId },
  refType: { type: String },
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
});

module.exports = mongoose.model('GeneralLedger', generalLedgerSchema);
