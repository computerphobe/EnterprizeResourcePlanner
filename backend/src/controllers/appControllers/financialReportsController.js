const mongoose = require('mongoose');

// Import models
const Order = require('../../models/appModels/Order');
const Invoice = require('../../models/appModels/Invoice');
const Payment = require('../../models/appModels/Payment');
const Returns = require('../../models/appModels/Returns');
const LedgerEntry = require('../../models/appModels/LedgerEntry');

// Get comprehensive financial summary statistics
const getSummaryStats = async (req, res) => {
  try {
    console.log('Fetching financial summary stats...');

    // Get current date for filtering
    const currentDate = new Date();
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const startOfYear = new Date(currentDate.getFullYear(), 0, 1);

    // Parallel fetch for better performance
    const [
      orders,
      invoices,
      payments,
      returns,
      ledgerEntries
    ] = await Promise.all([
      Order.find({ isDeleted: false }).select('status totalAmount createdAt').lean(),
      Invoice.find({ removed: false }).select('status total createdAt').lean(),
      Payment.find({ removed: false }).select('amount status createdAt').lean(),
      Returns.find({}).select('status returnedQuantity createdAt').lean(),
      LedgerEntry.find({ isDeleted: false }).select('type debit credit date').lean()
    ]);

    // Calculate Order Statistics
    const orderStats = {
      total: orders.length,
      completed: orders.filter(o => o.status === 'completed').length,
      collected: orders.filter(o => o.status === 'collected').length,
      pending: orders.filter(o => ['pending', 'processing'].includes(o.status)).length,
      totalValue: orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0),
      monthlyValue: orders
        .filter(o => new Date(o.createdAt) >= startOfMonth)
        .reduce((sum, o) => sum + (o.totalAmount || 0), 0),
      yearlyValue: orders
        .filter(o => new Date(o.createdAt) >= startOfYear)
        .reduce((sum, o) => sum + (o.totalAmount || 0), 0)
    };

    // Calculate Invoice Statistics
    const invoiceStats = {
      total: invoices.length,
      paid: invoices.filter(i => i.status === 'paid').length,
      pending: invoices.filter(i => i.status === 'pending').length,
      draft: invoices.filter(i => i.status === 'draft').length,
      totalAmount: invoices.reduce((sum, i) => sum + (i.total || 0), 0),
      totalPaid: invoices
        .filter(i => i.status === 'paid')
        .reduce((sum, i) => sum + (i.total || 0), 0),
      totalPending: invoices
        .filter(i => i.status === 'pending')
        .reduce((sum, i) => sum + (i.total || 0), 0),
      monthlyAmount: invoices
        .filter(i => new Date(i.createdAt) >= startOfMonth)
        .reduce((sum, i) => sum + (i.total || 0), 0),
      yearlyAmount: invoices
        .filter(i => new Date(i.createdAt) >= startOfYear)
        .reduce((sum, i) => sum + (i.total || 0), 0)
    };

    // Calculate Payment Statistics
    const paymentStats = {
      total: payments.length,
      totalAmount: payments.reduce((sum, p) => sum + (p.amount || 0), 0),
      monthlyAmount: payments
        .filter(p => new Date(p.createdAt) >= startOfMonth)
        .reduce((sum, p) => sum + (p.amount || 0), 0),
      yearlyAmount: payments
        .filter(p => new Date(p.createdAt) >= startOfYear)
        .reduce((sum, p) => sum + (p.amount || 0), 0)
    };

    // Calculate Return Statistics
    const returnStats = {
      total: returns.length,
      available: returns.filter(r => r.status === 'Available for reuse').length,
      used: returns.filter(r => r.status === 'Used').length,
      damaged: returns.filter(r => r.status === 'Damaged').length,
      disposed: returns.filter(r => r.status === 'Disposed').length,
      totalQuantity: returns.reduce((sum, r) => sum + (r.returnedQuantity || 0), 0)
    };

    // Calculate Ledger Statistics
    const ledgerStats = {
      totalEntries: ledgerEntries.length,
      totalRevenue: ledgerEntries
        .filter(l => l.type === 'revenue')
        .reduce((sum, l) => sum + (l.credit || 0), 0),
      totalExpenses: ledgerEntries
        .filter(l => l.type === 'expense')
        .reduce((sum, l) => sum + (l.debit || 0), 0),
      monthlyRevenue: ledgerEntries
        .filter(l => l.type === 'revenue' && new Date(l.date) >= startOfMonth)
        .reduce((sum, l) => sum + (l.credit || 0), 0),
      monthlyExpenses: ledgerEntries
        .filter(l => l.type === 'expense' && new Date(l.date) >= startOfMonth)
        .reduce((sum, l) => sum + (l.debit || 0), 0)
    };    // Calculate Overall Financial Summary
    const totalRevenue = Math.max(
      invoiceStats.totalPaid + orderStats.totalValue,
      ledgerStats.totalRevenue,
      paymentStats.totalAmount
    );
    const totalExpenses = ledgerStats.totalExpenses;
    const netProfit = totalRevenue - totalExpenses;
    const pendingRevenue = invoiceStats.totalPending;

    const summary = {
      revenue: {
        total: totalRevenue,
        pending: pendingRevenue,
        collected: invoiceStats.totalPaid,
        monthly: Math.max(invoiceStats.monthlyAmount, ledgerStats.monthlyRevenue),
        yearly: Math.max(invoiceStats.yearlyAmount, ledgerStats.totalRevenue)
      },
      expenses: {
        total: totalExpenses,
        monthly: ledgerStats.monthlyExpenses
      },
      profit: {
        net: netProfit,
        margin: totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(2) : 0
      },
      invoices: invoiceStats,
      orders: orderStats,
      payments: paymentStats,
      returns: returnStats,
      ledger: ledgerStats,
      summary: {
        totalTransactions: invoiceStats.total + orderStats.total + paymentStats.total,
        averageOrderValue: orderStats.total > 0 ? (orderStats.totalValue / orderStats.total).toFixed(2) : 0,
        averageInvoiceValue: invoiceStats.total > 0 ? (invoiceStats.totalAmount / invoiceStats.total).toFixed(2) : 0,
        conversionRate: invoiceStats.total > 0 ? ((invoiceStats.paid / invoiceStats.total) * 100).toFixed(2) : 0
      }
    };

    console.log('Financial summary calculated successfully');

    return res.status(200).json({
      success: true,
      result: summary,
      message: 'Financial summary retrieved successfully'
    });

  } catch (error) {
    console.error('Error in getSummaryStats:', error);
    return res.status(500).json({
      success: false,
      result: null,
      message: 'Error retrieving financial summary',
      error: error.message
    });
  }
};

module.exports = {
  getSummaryStats
};
