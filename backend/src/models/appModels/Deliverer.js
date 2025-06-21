const mongoose = require('mongoose');

const delivererSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    removed: { type: Boolean, default: false },
    // Add more fields like address, vehicle info, etc. if needed
  },
  { timestamps: true }
);

module.exports = mongoose.model('Deliverer', delivererSchema);
