// models/appModels/Expenses.js
const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: true,
  },
  category: {
    type: String,
    required: true,
    enum: [
      'general',
      'rent',
      'salary',
      'utilities',
      'equipment',
      'marketing',
      'miscellaneous'
    ], // Extend categories as needed
  },
  description: {
    type: String,
    default: '',
  },
  billUrl: {
    type: String, // URL to uploaded bill/document
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin', // assuming the admin/accountant user
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  removed: {
    type: Boolean,
    default: false,
  }
});

// ✅ Register model with plural name to match controller usage
module.exports = mongoose.model('Expenses', expenseSchema);
