const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  // Existing fields
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  // Add role field
  role: {
    type: String,
    enum: ['admin', 'doctor', 'hospital', 'deliverer', 'distributor'],
    default: 'admin'
  },
  // Doctor specific fields (only required if role is doctor)
  hospitalName: {
    type: String,
    required: function() { return this.role === 'doctor'; }
  },
  specialization: {
    type: String,
    required: function() { return this.role === 'doctor'; }
  },
  registrationNumber: {
    type: String,
    required: function() { return this.role === 'doctor'; }
  },
  isDeleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema); 