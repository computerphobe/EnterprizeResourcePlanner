const Expense = require('../../../models/appModels/Expenses');
const Ledger = require('@/models/appModels/GeneralLedger');

// Create a new expense
exports.createExpense = async (req, res) => {
  try {
    const { amount, category, description } = req.body;
    const billUrl = req.file?.path;
    const createdBy = req.user.id;

    const expense = new Expense({
      amount,
      category,
      description,
      billUrl,
      createdBy,
    });

    await expense.save();

    // ➕ Ledger entry: Debit Expense
    await Ledger.create({
      date: new Date(),
      account: category,
      type: 'expense',          // fixed enum value
      description,
      debit: amount,            // debit amount here
      credit: 0,
      refId: expense._id,       // optional tracking
      refType: 'expense',
      client: createdBy,
    });

    // ➖ Ledger entry: Credit Cash/Bank (asset account)
    await Ledger.create({
      date: new Date(),
      account: 'Cash',
      type: 'asset',
      description: `Payment for ${category || 'expense'}`,
      debit: 0,
      credit: amount,
      refId: expense._id,
      refType: 'expense',
      client: createdBy,
    });

    res.status(201).json({ success: true, expense });
  } catch (err) {
    console.error('Error creating expense and ledger entry:', err);
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
