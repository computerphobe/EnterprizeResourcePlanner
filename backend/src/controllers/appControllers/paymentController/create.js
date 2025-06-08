const mongoose = require('mongoose');

const PaymentModel = mongoose.model('Payment');
const InvoiceModel = mongoose.model('Invoice');
const GeneralLedger = require('@/models/appModels/GeneralLedger'); // Use the correct path to your model

const { calculate } = require('@/helpers');

const create = async (req, res) => {
  try {
    const { amount, invoice: invoiceId, account } = req.body;

    if (amount === 0) {
      return res.status(400).json({
        success: false,
        result: null,
        message: "The minimum amount can't be 0",
      });
    }

    // Fetch invoice to validate
    const currentInvoice = await InvoiceModel.findOne({ _id: invoiceId, removed: false });
    if (!currentInvoice) {
      return res.status(404).json({
        success: false,
        result: null,
        message: 'Invoice not found',
      });
    }

    const { total, discount, credit: previousCredit } = currentInvoice;
    const maxAmount = calculate.sub(calculate.sub(total, discount), previousCredit);

    if (amount > maxAmount) {
      return res.status(400).json({
        success: false,
        result: null,
        message: `The maximum amount you can add is ${maxAmount}`,
      });
    }

    req.body.createdBy = req.admin._id;

    // Create payment
    const payment = await PaymentModel.create(req.body);

    // Update PDF path on payment
    const fileId = `payment-${payment._id}.pdf`;
    const updatedPayment = await PaymentModel.findByIdAndUpdate(
      payment._id,
      { pdf: fileId },
      { new: true }
    );

    // Calculate new payment status
    const updatedCredit = calculate.add(previousCredit, amount);
    let paymentStatus = 'unpaid';
    if (calculate.sub(total, discount) === updatedCredit) {
      paymentStatus = 'paid';
    } else if (updatedCredit > 0) {
      paymentStatus = 'partially';
    }

    // Update invoice with new payment info
    await InvoiceModel.findByIdAndUpdate(
      invoiceId,
      {
        $push: { payment: payment._id },
        $inc: { credit: amount },
        $set: { paymentStatus },
      },
      { new: true, runValidators: true }
    );

    // Create general ledger entry for this payment
    // Payments are usually debit entries on cash/bank (asset), credit on revenue or accounts receivable.
    // Assuming here debit increases assets (cash/bank), so debit = amount, credit = 0
    try {
      await GeneralLedger.create({
        date: new Date(),
        account: account || 'Cash/Bank',
        type: 'asset',  // Payment received increases asset
        description: `Payment recorded for Invoice ${invoiceId}`,
        debit: amount,    // Debit since cash received
        credit: 0,
        invoiceId,
      });
    } catch (ledgerErr) {
      console.error('Failed to create general ledger entry:', ledgerErr.message);
      // Do not block response
    }

    return res.status(200).json({
      success: true,
      result: updatedPayment,
      message: 'Payment created successfully',
    });
  } catch (err) {
    console.error('Payment creation error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = create;
