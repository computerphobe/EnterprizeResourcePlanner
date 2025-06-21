const Purchase = require('@/models/appModels/Purchase');
const Supplier = require('@/models/appModels/Supplier');
const Inventory = require('@/models/appModels/Inventory');
const { generatePdf } = require('@/controllers/pdfController');
const path = require('path');
const fs = require('fs');
const express = require('express');
const PDFDocument = require('pdfkit');
// necessary log to check if the controlelr has loaded or not
console.log('Purchase controller added successfully!')

const list = async (req, res) => {
  try {
    const purchases = await Purchase.find({ isDeleted: false })
      .populate({
        path: 'supplier',
        select: 'name phone email gstin address'
      })
      .populate({
        path: 'items.inventoryItem',
        select: 'name price'
      })
      .sort('-createdAt');
    
    return res.status(200).json({
      success: true,
      result: purchases,
      message: "Successfully fetched purchases list",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      result: null,
      message: error.message,
    });
  }
};

const create = async (req, res) => {
  try {
    const newPurchase = new Purchase(req.body);
    const savedPurchase = await newPurchase.save();
    return res.status(201).json({
      success: true,
      result: savedPurchase,
      message: "Successfully created purchase",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      result: null,
      message: error.message,
    });
  }
};

const update = async (req, res) => {
  try {
    const updatedPurchase = await Purchase.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    return res.status(200).json({
      success: true,
      result: updatedPurchase,
      message: "Successfully updated purchase",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      result: null,
      message: error.message,
    });
  }
};

const remove = async (req, res) => {
  try {
    await Purchase.findByIdAndUpdate(req.params.id, { isDeleted: true });
    return res.status(200).json({
      success: true,
      result: null,
      message: "Successfully deleted purchase",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      result: null,
      message: error.message,
    });
  }
};

const getPurchases = async (req, res) => {
  try {
    const purchases = await Purchase.find()
      .populate('supplier', 'name contact')
      .populate('items.inventoryItem', 'itemName price')
      .lean();

    res.status(200).json({ success: true, data: purchases });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching purchases', error: error.message });
  }
};

const updatePurchaseStatus = async (req, res) => {
  try {
    const { purchaseId, status } = req.body;

    if (!purchaseId || !status) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const purchase = await Purchase.findById(purchaseId);
    if (!purchase) return res.status(404).json({ success: false, message: 'Purchase not found' });

    purchase.status = status;
    await purchase.save();

    res.status(200).json({ success: true, message: 'Purchase status updated', data: purchase });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating purchase status', error: error.message });
  }
};

const generatePurchaseBill = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Generating bill for purchase:', id);

    const purchase = await Purchase.findById(id)
      .populate({
        path: 'supplier',
        strictPopulate: false
      })
      .populate({
        path: 'items.inventoryItem',
        strictPopulate: false
      })
      .lean();

    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: 'Purchase not found'
      });
    }

    // Format date properly
    let formattedDate = 'N/A';
    if (purchase.date) {
      try {
        const purchaseDate = new Date(purchase.date);
        if (!isNaN(purchaseDate.getTime())) {
          formattedDate = purchaseDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });
        }
      } catch (err) {
        console.error("Date formatting error:", err);
      }
    }

    // Create PDF document
    const doc = new PDFDocument({
      margin: 50,
      size: 'A4'
    });
    
    // Set headers for direct download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=purchase_${id}.pdf`);
    
    // Pipe the PDF directly to the response
    doc.pipe(res);

    // Define colors
    const textColor = '#333333';
    const accentColor = '#555555';
    
    // Set up document
    doc.font('Helvetica');
    
    // Add header
    doc.fontSize(22).fillColor(textColor)
       .text('PURCHASE ORDER', { align: 'center' });
       
    doc.fontSize(12).fillColor(accentColor)
       .text(`Order #: ${purchase._id}`, { align: 'center' });
       
    doc.moveDown(0.5);
    doc.fontSize(10)
       .text(`Date: ${formattedDate}`, { align: 'center' });
    
    doc.moveDown(1);
    
    // Add horizontal line
    doc.moveTo(50, doc.y)
       .lineTo(doc.page.width - 50, doc.y)
       .stroke('#cccccc');
    
    doc.moveDown(1);
    
    // Supplier and Purchase info in two columns
    const leftColumnX = 50;
    const rightColumnX = 300;
    const startY = doc.y;
    
    // Left column - Supplier info
    if (purchase.supplier) {
      doc.fontSize(12).fillColor(textColor)
         .text('Supplier:', leftColumnX, startY, { continued: true })
         .font('Helvetica-Bold')
         .text(` ${purchase.supplier.name || 'N/A'}`);
      
      doc.moveDown(0.5);
      doc.font('Helvetica').fontSize(10).fillColor(accentColor)
         .text(`Contact: ${purchase.supplier.phone || 'N/A'}`, leftColumnX);
      
      doc.moveDown(0.3);
      doc.text(`Email: ${purchase.supplier.email || 'N/A'}`, leftColumnX);
      
      doc.moveDown(0.3);
      doc.text(`GSTIN: ${purchase.supplier.gstin || 'N/A'}`, leftColumnX);
    } else {
      doc.fontSize(12).fillColor(textColor)
         .text('Supplier: Not specified', leftColumnX, startY);
    }
    
    // Right column - Purchase info
    doc.fontSize(12).fillColor(textColor)
       .text('Order Details:', rightColumnX, startY);
    
    doc.moveDown(0.5);
    doc.font('Helvetica').fontSize(10).fillColor(accentColor)
       .text(`Status: ${purchase.status || 'Pending'}`, rightColumnX);
    
    doc.moveDown(0.3);
    doc.text(`Payment Terms: ${purchase.paymentTerms || 'Standard'}`, rightColumnX);
    
    // Find the lower of the two columns to continue
    doc.y = Math.max(doc.y, startY + 80);
    
    doc.moveDown(1);
    
    // Add horizontal line
    doc.moveTo(50, doc.y)
       .lineTo(doc.page.width - 50, doc.y)
       .stroke('#cccccc');
    
    doc.moveDown(1);
    
    // Items table
    doc.fontSize(12).fillColor(textColor)
       .text('Items', { align: 'center' });
    
    doc.moveDown(0.5);
    
    // Table headers
    const tableTop = doc.y;
    const nameX = 50;
    const qtyX = 350;
    const priceX = 420;
    const totalX = 490;
    
    doc.font('Helvetica-Bold').fontSize(10).fillColor(accentColor);
    doc.text('Item', nameX, tableTop);
    doc.text('Qty', qtyX, tableTop, { width: 50, align: 'center' });
    doc.text('Price', priceX, tableTop, { width: 50, align: 'right' });
    doc.text('Total', totalX, tableTop, { width: 50, align: 'right' });
    
    doc.moveDown(0.3);
    
    // Draw header underline
    doc.moveTo(50, doc.y)
       .lineTo(doc.page.width - 50, doc.y)
       .stroke('#cccccc');
       
    doc.moveDown(0.3);
    
    // Table rows
    let totalAmount = 0;
    doc.font('Helvetica').fontSize(10).fillColor(textColor);
    
    purchase.items.forEach((item, index) => {
      const itemName = item.inventoryItem?.name || `Item ${index+1}`;
      const quantity = item.quantity || 0;
      const price = item.price || 0;
      const itemTotal = quantity * price;
      totalAmount += itemTotal;
      
      // Check if we need a new page
      if (doc.y > 700) {
        doc.addPage();
        doc.font('Helvetica').fontSize(10).fillColor(textColor);
      }
      
      // Draw item row
      doc.text(itemName, nameX, doc.y, { width: 280 });
      doc.text(quantity.toString(), qtyX, doc.y, { width: 50, align: 'center' });
      doc.text(`$${price.toFixed(2)}`, priceX, doc.y, { width: 50, align: 'right' });
      doc.text(`$${itemTotal.toFixed(2)}`, totalX, doc.y, { width: 50, align: 'right' });
      
      doc.moveDown(0.5);
    });
    
    // Add total line
    doc.moveDown(0.5);
    doc.moveTo(50, doc.y)
       .lineTo(doc.page.width - 50, doc.y)
       .stroke('#cccccc');
       
    doc.moveDown(0.5);
    
    // Subtotal
    doc.font('Helvetica-Bold').fillColor(textColor)
       .text('Subtotal:', 380, doc.y)
       .font('Helvetica')
       .text(`$${totalAmount.toFixed(2)}`, totalX, doc.y, { width: 50, align: 'right' });
       
    doc.moveDown(0.5);
    
    // Tax
    const taxRate = 5;
    const taxAmount = totalAmount * (taxRate / 100);
    
    doc.font('Helvetica-Bold').fillColor(textColor)
       .text(`Tax (${taxRate}%):`, 380, doc.y)
       .font('Helvetica')
       .text(`$${taxAmount.toFixed(2)}`, totalX, doc.y, { width: 50, align: 'right' });
       
    doc.moveDown(0.5);
    
    // Total
    const grandTotal = totalAmount + taxAmount;
    
    doc.moveTo(380, doc.y)
       .lineTo(doc.page.width - 50, doc.y)
       .stroke('#cccccc');
       
    doc.moveDown(0.5);
    
    doc.font('Helvetica-Bold').fontSize(12).fillColor(textColor)
       .text('TOTAL:', 380, doc.y)
       .text(`$${grandTotal.toFixed(2)}`, totalX, doc.y, { width: 50, align: 'right' });
    
    // Notes section
    doc.moveDown(2);
    doc.font('Helvetica-Bold').fontSize(11).fillColor(textColor)
       .text('Notes:');
       
    doc.moveDown(0.5);
    doc.font('Helvetica').fontSize(10).fillColor(accentColor)
       .text('All goods to be delivered to the main warehouse unless specified otherwise.');
    
    // Footer
    const footerPosition = doc.page.height - 50;
    
    doc.fontSize(8).fillColor('#999999')
       .text('Thank you for your business.', 50, footerPosition, { align: 'center' });
       
    doc.moveDown(0.3);
    doc.text(`Generated on ${new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric'
    })}`, { align: 'center' });

    // Finalize PDF
    doc.end();

  } catch (error) {
    console.error('Error in generatePurchaseBill:', error);
    return res.status(500).json({
      success: false,
      message: 'Error generating PDF',
      error: error.message
    });
  }
};

module.exports = {
  list,
  create,
  update,
  remove,
  getPurchases,
  updatePurchaseStatus,
  generatePurchaseBill
}