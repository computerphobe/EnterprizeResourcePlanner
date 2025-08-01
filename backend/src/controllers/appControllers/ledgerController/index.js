// 📁 controllers/clientLedgerController.js
const Invoice = require('mongoose').model('Invoice');
const Payment = require('mongoose').model('Payment');
const Ledger = require('@/models/appModels/Ledger')
const GeneralLedger = require('@/models/appModels/GeneralLedger') // Assuming you have a Ledger model
console.log('Ledger controller loaded');
const getClientLedger = async (req, res) => {
  try {
    console.log('🏥 [LEDGER] getClientLedger called');
    console.log('🏥 [LEDGER] Client ID from params:', req.params.clientId);
    console.log('🏥 [LEDGER] User organization:', req.admin?.organization);
    
    const { clientId } = req.params;
    
    if (!clientId) {
      console.log('❌ [LEDGER] No clientId provided');
      return res.status(400).json({ success: false, message: 'Client ID is required' });
    }

    console.log('🔍 [LEDGER] Fetching invoices...');
    const invoices = await Invoice.find({ 
      client: clientId, 
      removed: false,
      ...(req.admin?.organization && { organization: req.admin.organization })
    })
    .populate('client', 'name email');
    
    console.log('🔍 [LEDGER] Found invoices:', invoices.length);

    console.log('🔍 [LEDGER] Fetching payments...');
    const payments = await Payment.find({ 
      client: clientId, 
      removed: false,
      ...(req.admin?.organization && { organization: req.admin.organization })
    })
    .populate('client', 'name email')
    .populate('invoice', 'number');
    
    console.log('🔍 [LEDGER] Found payments:', payments.length);
    
    console.log('🔍 [LEDGER] Found payments:', payments.length);

    const ledgerEntries = [
      ...invoices.map(inv => ({
        _id: inv._id,
        type: 'Invoice',
        date: inv.date,
        number: `INV-${inv.number}/${inv.year}`,
        description: `Invoice #${inv.number}`,
        amount: inv.total || 0,
        debit: inv.total || 0,
        credit: 0,
        client: inv.client,
      })),
      ...payments.map(pay => ({
        _id: pay._id,
        type: 'Payment',
        date: pay.date,
        number: `PAY-${pay.number}`,
        description: `Payment ${pay.number}`,
        amount: -Math.abs(pay.amount || 0),
        debit: 0,
        credit: Math.abs(pay.amount || 0),
        client: pay.client,
      }))
    ];

    ledgerEntries.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Calculate running balance
    let runningBalance = 0;
    ledgerEntries.forEach(entry => {
      runningBalance += entry.debit - entry.credit;
      entry.balance = runningBalance;
    });

    console.log('✅ [LEDGER] Returning ledger entries:', ledgerEntries.length);
    console.log('✅ [LEDGER] Final balance:', runningBalance);

    return res.status(200).json({ 
      success: true, 
      result: ledgerEntries,
      totalEntries: ledgerEntries.length,
      currentBalance: runningBalance,
    });
  } catch (err) {
    console.error('❌ [LEDGER] Error in getClientLedger:', err);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error: ' + err.message 
    });
  }
};

const getLedgerSummary = async (req, res) => {
  try {
    console.log('in getLedgerSummary controller');

    const ledgerEntries = await GeneralLedger.find().sort({ date: -1 }).lean();
    console.log('Fetched ledger entries:', ledgerEntries.length);

    const totalRevenue = ledgerEntries
      .filter((e) => e.type === 'revenue')
      .reduce((acc, e) => acc + (e.credit || 0), 0);

    const totalExpenses = ledgerEntries
      .filter((e) => e.type === 'expense')
      .reduce((acc, e) => acc + (e.debit || 0), 0);

    const netProfit = totalRevenue - totalExpenses;
    const estimatedTax = netProfit * 0.18;

    res.json({
      success: true,
      result: {
        totalRevenue,
        totalExpenses,
        netProfit,
        estimatedTax,
        entries: ledgerEntries,
      },
    });
  } catch (error) {
    console.error('Ledger summary error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch ledger summary' });
  }
};
module.exports = { getClientLedger, getLedgerSummary };
