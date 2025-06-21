const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    contactPerson: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true },
    gstin: String,
    paymentTerms: String,
    address: String,
    isDeleted: { type: Boolean, default: false }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Supplier', supplierSchema);
