const mongoose = require('mongoose');

const delivererPasswordSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'Deliverer', required: true, unique: true },
    passwordHash: { type: String, required: true },
    loggedSessions: { type: [String], default: [] }, // store active JWT tokens
    removed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('DelivererPassword', delivererPasswordSchema);
