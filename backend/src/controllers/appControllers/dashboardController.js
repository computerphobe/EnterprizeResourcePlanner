const mongoose = require('mongoose');

// Import necessary models if they exist
const Invoice = mongoose.model('Invoice');
const Quote = mongoose.model('Quote');
// const Client = mongoose.model('Client');
const Payment = mongoose.model('Payment');
const LedgerEntry = require('../../models/appModels/LedgerEntry');

// Dashboard controller methods
exports.getDashboard = async (req, res) => {
  try {
    // This is a simulated data - in a real app, you'd fetch from your database
    const data = {
      success: true,
      result: {
        message: 'Dashboard data retrieved successfully',
        stats: {
          totalSales: 157500,
          totalInvoices: 124,
          totalClients: 48,
          totalExpenses: 87500,
          netProfit: 70000,
          recentActivities: [
            { id: 1, type: 'invoice', description: 'New invoice #INV-2025-042 created', amount: 1250, date: new Date() },
            { id: 2, type: 'payment', description: 'Payment received for #INV-2025-041', amount: 3450, date: new Date(Date.now() - 86400000) },
            { id: 3, type: 'quote', description: 'Quote #QT-2025-021 accepted', amount: 5500, date: new Date(Date.now() - 172800000) },
          ]
        }
      }
    };
    
    return res.status(200).json(data);
  } catch (error) {
    console.error('Error in getDashboard:', error);
    return res.status(500).json({
      success: false,
      result: null,
      message: 'Error retrieving dashboard data',
      error: error.message
    });
  }
};

exports.getStats = async (req, res) => {
  try {
    // Simulated statistics data
    const stats = {
      success: true,
      result: {
        totalRevenue: 158750.00,
        revenueChange: 12.5,
        totalExpenses: 87500.00,
        expensesChange: 8.2,
        netProfit: 71250.00,
        netProfitChange: 15.3,
        taxLiability: 17812.50,
        taxLiabilityChange: -3.1,
        totalInvoices: 124, 
        totalClients: 48,
        averagePaymentTime: 14
      }
    };
    
    return res.status(200).json(stats);
  } catch (error) {
    console.error('Error in getStats:', error);
    return res.status(500).json({
      success: false,
      result: null,
      message: 'Error retrieving stats',
      error: error.message
    });
  }
};

exports.getRecentActivities = async (req, res) => {
  try {
    // Simulated recent activities
    const activities = {
      success: true,
      result: [
        { id: 1, type: 'invoice', description: 'New invoice #INV-2025-042 created', amount: 1250, date: new Date() },
        { id: 2, type: 'payment', description: 'Payment received for #INV-2025-041', amount: 3450, date: new Date(Date.now() - 86400000) },
        { id: 3, type: 'quote', description: 'Quote #QT-2025-021 accepted', amount: 5500, date: new Date(Date.now() - 172800000) },
        { id: 4, type: 'expense', description: 'Office supplies expense recorded', amount: 850, date: new Date(Date.now() - 259200000) },
        { id: 5, type: 'invoice', description: 'Invoice #INV-2025-040 sent to client', amount: 2100, date: new Date(Date.now() - 345600000) }
      ]
    };
    
    return res.status(200).json(activities);
  } catch (error) {
    console.error('Error in getRecentActivities:', error);
    return res.status(500).json({
      success: false,
      result: null,
      message: 'Error retrieving recent activities',
      error: error.message
    });
  }
};

exports.getFinancialData = async (req, res) => {
  try {
    // Get ledger entries for analysis
    const ledgerEntries = await LedgerEntry.find({ isDeleted: false })
      .sort({ date: -1 })
      .limit(100)
      .lean();
      
    // Calculate financial summary
    let totalRevenue = 0;
    let totalExpenses = 0;
    
    // Calculate expense categories from ledger
    const expenseCategoriesMap = {};
    let totalExpenseAmount = 0;
    
    // Calculate revenue sources from ledger
    const revenueSourcesMap = {};
    let totalRevenueAmount = 0;
    
    // Process ledger entries to calculate summaries
    ledgerEntries.forEach(entry => {
      if (entry.type === 'revenue') {
        totalRevenue += entry.credit || 0;
        totalRevenueAmount += entry.credit || 0;
        
        // Add to revenue sources
        if (!revenueSourcesMap[entry.account]) {
          revenueSourcesMap[entry.account] = 0;
        }
        revenueSourcesMap[entry.account] += entry.credit || 0;
      }
      
      if (entry.type === 'expense') {
        totalExpenses += entry.debit || 0;
        totalExpenseAmount += entry.debit || 0;
        
        // Add to expense categories
        if (!expenseCategoriesMap[entry.account]) {
          expenseCategoriesMap[entry.account] = 0;
        }
        expenseCategoriesMap[entry.account] += entry.debit || 0;
      }
    });
    
    // Calculate net profit and tax liability
    const netProfit = totalRevenue - totalExpenses;
    const taxLiability = netProfit * 0.18; // Assuming 18% tax rate
    
    // Format revenue sources
    const revenueSources = Object.entries(revenueSourcesMap)
      .map(([source, amount], index) => ({
        key: (index + 1).toString(),
        source,
        amount,
        percentage: totalRevenueAmount > 0 ? Math.round((amount / totalRevenueAmount) * 100 * 10) / 10 : 0,
        change: Math.round((Math.random() * 30 - 5) * 10) / 10 // Random change as example
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 4); // Top 4 sources
      
    // Format expense categories
    const expenseCategories = Object.entries(expenseCategoriesMap)
      .map(([name, value]) => ({
        name,
        value: totalExpenseAmount > 0 ? Math.round((value / totalExpenseAmount) * 100) : 0
      }))
      .sort((a, b) => b.value - a.value);
    
    // Default values if no data exists
    if (expenseCategories.length === 0) {
      expenseCategories.push(
        { name: 'Salaries and Benefits', value: 35 },
        { name: 'Operations and Maintenance', value: 20 },
        { name: 'Marketing and Advertising', value: 15 },
        { name: 'Office Supplies and Equipment', value: 15 },
        { name: 'Other Expenses', value: 15 }
      );
    }
    
    // Default values if no revenue sources
    if (revenueSources.length === 0) {
      revenueSources.push(
        {
          key: '1',
          source: 'Product Sales',
          amount: 85000,
          percentage: 53.5,
          change: 8.7,
        },
        {
          key: '2',
          source: 'Service Contracts',
          amount: 45000,
          percentage: 28.3,
          change: 15.2,
        }
      );
    }
    
    // Construct the response
    const financialData = {
      success: true,
      result: {
        summary: {
          totalRevenue,
          revenueChange: 5.2, // Example value
          totalExpenses,
          expensesChange: 3.1, // Example value
          netProfit,
          netProfitChange: 7.5, // Example value
          taxLiability,
          taxLiabilityChange: -2.1 // Example value
        },
        revenueSources,
        expenseCategories,
        ledgerEntries: ledgerEntries.map(entry => ({
          id: entry._id,
          date: entry.date,
          account: entry.account,
          description: entry.description,
          type: entry.type,
          debit: entry.debit,
          credit: entry.credit
        }))
      }
    };
    
    return res.status(200).json(financialData);
  } catch (error) {
    console.error('Error in getFinancialData:', error);
    return res.status(500).json({
      success: false,
      result: null,
      message: 'Error retrieving financial data',
      error: error.message
    });
  }
};

// New controller method to create ledger entries
exports.createLedgerEntry = async (req, res) => {
  try {
    const { date, account, description, type, debit, credit, reference } = req.body;
    
    const newEntry = new LedgerEntry({
      date,
      account,
      description,
      type,
      debit: type === 'expense' || type === 'asset' ? debit : 0,
      credit: type === 'revenue' || type === 'liability' ? credit : 0,
      reference,
      createdBy: req.admin ? req.admin._id : null
    });
    
    const savedEntry = await newEntry.save();
    
    return res.status(201).json({
      success: true,
      result: savedEntry,
      message: 'Ledger entry created successfully'
    });
  } catch (error) {
    console.error('Error creating ledger entry:', error);
    return res.status(500).json({
      success: false,
      result: null,
      message: 'Error creating ledger entry',
      error: error.message
    });
  }
};

// Get ledger entries
exports.getLedgerEntries = async (req, res) => {
  try {
    const { page = 1, limit = 10, type, account, startDate, endDate } = req.query;
    
    // Build query
    const query = { isDeleted: false };
    
    if (type) query.type = type;
    if (account) query.account = account;
    
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    } else if (startDate) {
      query.date = { $gte: new Date(startDate) };
    } else if (endDate) {
      query.date = { $lte: new Date(endDate) };
    }
    
    // Execute query
    const entries = await LedgerEntry.find(query)
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();
      
    // Get total count for pagination
    const total = await LedgerEntry.countDocuments(query);
    
    return res.status(200).json({
      success: true,
      result: {
        entries,
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      },
      message: 'Ledger entries retrieved successfully'
    });
  } catch (error) {
    console.error('Error retrieving ledger entries:', error);
    return res.status(500).json({
      success: false,
      result: null,
      message: 'Error retrieving ledger entries',
      error: error.message
    });
  }
};

// Update ledger entry
exports.updateLedgerEntry = async (req, res) => {
  try {
    const { id } = req.params;
    const { date, account, description, type, debit, credit, reference } = req.body;
    
    const updatedEntry = await LedgerEntry.findByIdAndUpdate(
      id,
      {
        date,
        account,
        description,
        type,
        debit: type === 'expense' || type === 'asset' ? debit : 0,
        credit: type === 'revenue' || type === 'liability' ? credit : 0,
        reference
      },
      { new: true }
    );
    
    if (!updatedEntry) {
      return res.status(404).json({
        success: false,
        result: null,
        message: 'Ledger entry not found'
      });
    }
    
    return res.status(200).json({
      success: true,
      result: updatedEntry,
      message: 'Ledger entry updated successfully'
    });
  } catch (error) {
    console.error('Error updating ledger entry:', error);
    return res.status(500).json({
      success: false,
      result: null,
      message: 'Error updating ledger entry',
      error: error.message
    });
  }
};

// Delete ledger entry (soft delete)
exports.deleteLedgerEntry = async (req, res) => {
  try {
    const { id } = req.params;
    
    const deletedEntry = await LedgerEntry.findByIdAndUpdate(
      id,
      { isDeleted: true },
      { new: true }
    );
    
    if (!deletedEntry) {
      return res.status(404).json({
        success: false,
        result: null,
        message: 'Ledger entry not found'
      });
    }
    
    return res.status(200).json({
      success: true,
      result: deletedEntry,
      message: 'Ledger entry deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting ledger entry:', error);
    return res.status(500).json({
      success: false,
      result: null,
      message: 'Error deleting ledger entry',
      error: error.message
    });
  }
};
