const Expense = require('../../../models/appModels/Expenses');

// Create a new expense
exports.createExpense = async (req, res) => {
  try {
    const { amount, category, description } = req.body;
    const billUrl = req.file?.path; // assuming file upload middleware like multer is used
    const createdBy = req.user._id; // assuming auth middleware sets req.user

    const expense = new Expense({
      amount,
      category,
      description,
      billUrl,
      createdBy,
    });

    await expense.save();
    res.status(201).json({ success: true, expense });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get all expenses (excluding removed)
exports.getExpenses = async (req, res) => {
  try {
    const expenses = await Expense.find({ removed: false }).populate('createdBy', 'name email');
    res.status(200).json({ success: true, expenses });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Soft delete an expense
exports.deleteExpense = async (req, res) => {
  try {
    await Expense.findByIdAndUpdate(req.params.id, { removed: true });
    res.status(200).json({ success: true, message: 'Expense removed' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Calculate net profit (revenue - expenses)
exports.calculateNetProfit = async (req, res) => {
  try {
    const expenses = await Expense.aggregate([
      { $match: { removed: false } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);

    const totalExpenses = expenses[0]?.total || 0;

    // Placeholder for revenue; replace with real revenue fetch logic
    const revenue = 100000;

    const netProfit = revenue - totalExpenses;

    res.status(200).json({ success: true, netProfit, totalExpenses, revenue });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
