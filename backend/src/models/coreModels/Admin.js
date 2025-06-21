const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const adminSchema = new Schema({
  removed: {
    type: Boolean,
    default: false,
  },
  enabled: {
    type: Boolean,
    default: true,
  },
  organizationId: {
    type: mongoose.Schema.ObjectId,
    ref: 'Admin', // References the main admin/owner
    required: false // Only required for non-owner roles
  },
  email: {
    type: String,
    lowercase: true,
    trim: true,
    required: true,
  },
  name: { type: String, required: true },
  surname: { type: String },  photo: {
    type: String,
    trim: true,
  },
  hospitalName: {
    type: String,
    trim: true,
    required: false // Only required for doctors
  },
  created: {
    type: Date,
    default: Date.now,
  },
  role: {
    type: String,
    default: 'owner',
    enum: ['owner','doctor', 'hospital', 'distributor', 'deliverer', 'accountant'],
  },
});

module.exports = mongoose.model('Admin', adminSchema);
