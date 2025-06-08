const mongoose = require('mongoose');

const Model = mongoose.model('Invoice');
const GeneralLedger = require('@/models/appModels/GeneralLedger');  // Import your GeneralLedger model

const { calculate } = require('@/helpers');
const { increaseBySettingKey } = require('@/middlewares/settings');
const schema = require('./schemaValidate');

const create = async (req, res) => {
  try {
    let body = req.body;
    console.log('Invoice create request body:', body);

    // Validate input
    const { error, value } = schema.validate(body);
    if (error) {
      const { details } = error;
      return res.status(400).json({
        success: false,
        result: null,
        message: details[0]?.message,
      });
    }

    const { items = [], taxRate = 0, discount = 0 } = value;

    // Calculate subtotal and total
    let subTotal = 0;
    items.forEach((item) => {
      let itemTotal = calculate.multiply(item['quantity'], item['price']);
      subTotal = calculate.add(subTotal, itemTotal);
      item['total'] = itemTotal;
    });

    const taxTotal = calculate.multiply(subTotal, taxRate / 100);
    const totalBeforeDiscount = calculate.add(subTotal, taxTotal);
    const total = calculate.sub(totalBeforeDiscount, discount);

    body['subTotal'] = subTotal;
    body['taxTotal'] = taxTotal;
    body['total'] = total;
    body['items'] = items;

    // Determine payment status based on discount and total
    const paymentStatus = total <= 0 ? 'paid' : 'unpaid';
    body['paymentStatus'] = paymentStatus;

    // Track creator admin ID
    body['createdBy'] = req.admin._id;

    // Save invoice
    const result = await new Model(body).save();

    // Generate PDF file name and update the invoice record
    const fileId = `invoice-${result._id}.pdf`;
    const updateResult = await Model.findByIdAndUpdate(
      result._id,
      { pdf: fileId },
      { new: true }
    );

    // Increase last invoice number setting (don't await to speed up response)
    increaseBySettingKey({ settingKey: 'last_invoice_number' }).catch((err) => {
      console.error('Failed to increase invoice number setting:', err.message);
    });

    // Create ledger entry for revenue using GeneralLedger
    try {
      await GeneralLedger.create({
        date: new Date(),
        account: body.account || 'Invoice Revenue',
        description: `Invoice generated: ${updateResult.invoiceNumber || updateResult._id}`,
        type: 'revenue',
        debit: 0,
        credit: total,
        invoiceId: updateResult._id,
      });
    } catch (ledgerErr) {
      console.error('Failed to create ledger entry:', ledgerErr.message);
      // Do NOT block invoice creation if ledger fails
    }

    return res.status(200).json({
      success: true,
      result: updateResult,
      message: 'Invoice created successfully',
    });
  } catch (err) {
    console.error('Invoice creation error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = create;
