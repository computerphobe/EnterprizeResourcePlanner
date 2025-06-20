const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  removed: {
    type: Boolean,
    default: false,
  },
  enabled: {
    type: Boolean,
    default: true,
  },  organizationId: {
    type: mongoose.Schema.ObjectId,
    ref: 'Admin', // References the owner admin
    required: false, // Make optional for backward compatibility
    default: null
  },
  name: {
    type: String,
    required: true,
  },
  phone: String,
  country: String,
  address: String,
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  linkedUserId: {
    type: mongoose.Schema.ObjectId,
    ref: 'Admin', // References the user account (hospital/doctor)
    required: false
  },
  userRole: {
    type: String,
    enum: ['hospital', 'doctor', 'distributor', null],
    required: false
  },  createdBy: { type: mongoose.Schema.ObjectId, ref: 'Admin' },
  assigned: { type: mongoose.Schema.ObjectId, ref: 'Admin' },
  created: {
    type: Date,
    default: Date.now,
  },
  updated: {
    type: Date,
    default: Date.now,
  },
});

schema.plugin(require('mongoose-autopopulate'));

module.exports = mongoose.model('Client', schema);
