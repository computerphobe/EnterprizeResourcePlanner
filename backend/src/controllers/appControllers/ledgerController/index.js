// 📁 controllers/clientLedgerController.js
const Invoice = require('mongoose').model('Invoice');
const Payment = require('mongoose').model('Payment');
const Ledger = require('@/models/appModels/Ledger')
const GeneralLedger = require('@/models/appModels/GeneralLedger') // Assuming you have a Ledger model
console.log('Ledger controller loaded');
const getClientLedger = async (req, res) => {
  try {
    const { clientId } = req.params;

    const invoices = await Invoice.find({ client: clientId, removed: false }).lean();
    const payments = await Payment.find({ client: clientId, removed: false }).lean();

    const ledgerEntries = [
      ...invoices.map(inv => ({
        type: 'Invoice',
        date: inv.date,
        number: `INV-${inv.number}/${inv.year}`,
        amount: inv.total,
      })),
      ...payments.map(pay => ({
        type: 'Payment',
        date: pay.date,
        number: `PAY-${pay.number}`,
        amount: -Math.abs(pay.amount),
      }))
    ];

    ledgerEntries.sort((a, b) => new Date(a.date) - new Date(b.date));

    return res.status(200).json({ success: true, result: ledgerEntries });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error' });
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
