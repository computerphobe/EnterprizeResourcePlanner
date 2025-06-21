// 📁 models/ClientLedgerEntry.js
const mongoose = require('mongoose');

const clientLedgerSchema = new mongoose.Schema({
  client: {
    type: mongoose.Schema.ObjectId,
    ref: 'Client',
    required: true,
    autopopulate: true,
  },
  type: {
    type: String,
    enum: ['Invoice', 'Payment'],
    required: true,
  },
  refId: {
    type: mongoose.Schema.ObjectId,
    refPath: 'type',
  },
  date: {
    type: Date,
    required: true,
  },
  number: {
    type: String,
  },
  amount: {
    type: Number,
    required: true,
  },
});

clientLedgerSchema.plugin(require('mongoose-autopopulate'));
module.exports = mongoose.model('Ledger', clientLedgerSchema);
