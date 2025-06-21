const Invoice = require('../../../models/appModels/Invoice');
const Expense = require('../../../models/appModels/Expenses');
const mongoose = require('mongoose');

const getSummaryStats = async (req, res) => {
  try {
    // 1. Total revenue from completed invoices
    const completedInvoices = await Invoice.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, totalRevenue: { $sum: '$amount' } } }
    ]);

    // 2. Total expenses
    const expenses = await Expense.aggregate([
      { $group: { _id: null, totalExpenses: { $sum: '$amount' } } }
    ]);

    const totalRevenue = completedInvoices[0]?.totalRevenue || 0;
    const totalExpenses = expenses[0]?.totalExpenses || 0;

    // 3. Net profit and tax
    const netProfit = totalRevenue - totalExpenses;
    const estimatedTax = +(netProfit * 0.18).toFixed(2);

    // 4. Profit & Loss Overview (monthly)
    // Aggregate invoices and expenses grouped by month-year
    // Format month-year as "YYYY-MM" string for simplicity

    // Monthly revenue from invoices
    const monthlyRevenue = await Invoice.aggregate([
      { $match: { status: 'completed' } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$completedAt" } },
          revenue: { $sum: "$amount" }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Monthly expenses
    const monthlyExpenses = await Expense.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$date" } },
          expenses: { $sum: "$amount" }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Combine revenue and expenses per month
    const monthsSet = new Set();
    monthlyRevenue.forEach(m => monthsSet.add(m._id));
    monthlyExpenses.forEach(m => monthsSet.add(m._id));
    const allMonths = Array.from(monthsSet).sort();

    const profitLoss = allMonths.map(month => {
      const revObj = monthlyRevenue.find(m => m._id === month);
      const expObj = monthlyExpenses.find(m => m._id === month);
      return {
        month,
        revenue: revObj ? revObj.revenue : 0,
        expenses: expObj ? expObj.expenses : 0,
      };
    });

    // 5. Expenses by Category
    const expensesByCategoryAgg = await Expense.aggregate([
      {
        $group: {
          _id: "$category",
          amount: { $sum: "$amount" }
        }
      },
      { $project: { category: "$_id", amount: 1, _id: 0 } }
    ]);

    // 6. Net Profit Trend (monthly)
    // Use same months, calculate netProfit = revenue - expenses
    const netProfitTrend = profitLoss.map(item => ({
      month: item.month,
      netProfit: item.revenue - item.expenses,
    }));

    // 7. Outstanding Payments - invoices not completed (assuming status !== 'completed')
    const outstandingPayments = await Invoice.aggregate([
      { $match: { status: { $ne: 'completed' } } },
      {
        $project: {
          clientName: 1,
          amount: 1,
          dueDate: { $dateToString: { format: "%Y-%m-%d", date: "$dueDate" } },
          ageBucket: {
            $switch: {
              branches: [
                { case: { $lte: [{ $subtract: [new Date(), "$dueDate"] }, 7 * 24 * 60 * 60 * 1000] }, then: '0-7 days' },
                { case: { $lte: [{ $subtract: [new Date(), "$dueDate"] }, 30 * 24 * 60 * 60 * 1000] }, then: '8-30 days' },
                { case: { $lte: [{ $subtract: [new Date(), "$dueDate"] }, 60 * 24 * 60 * 60 * 1000] }, then: '31-60 days' },
              ],
              default: '60+ days'
            }
          }
        }
      }
    ]);

    // Send full response
    res.status(200).json({
      summary: {
        totalRevenue,
        totalExpenses,
        netProfit,
        taxLiability: estimatedTax,
      },
      profitLoss,
      expensesByCategory: expensesByCategoryAgg,
      netProfitTrend,
      outstandingPayments,
    });
  } catch (error) {
    console.error('Error in getSummaryStats:', error);
    res.status(500).json({ message: 'Failed to fetch financial summary' });
  }
};

module.exports = { getSummaryStats };
