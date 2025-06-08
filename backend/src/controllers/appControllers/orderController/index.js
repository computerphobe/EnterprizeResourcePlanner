const Order = require('@/models/appModels/Order');
const Admin = require('@/models/coreModels/Admin');
const Inventory = require('@/models/appModels/Inventory');
const Returns = require('@/models/appModels/Returns');
const mongoose = require('mongoose');

console.log("order controller loaded");

const delivererOrders = async (req, res) => {
  console.log('getCurrentOrdersForDeliverer endpoint hit');
  try {
    const delivererId = req.user.id;
    console.log('Fetching current deliveries for deliverer:', delivererId);

    const orders = await Order.find({ delivererId, status: { $in: ['pending', 'processing'] } })
      .populate('doctorId')
      .populate('delivererId')
      .sort({ createdAt: -1 });

    console.log('Current deliveries:', orders.length);
    res.json({ success: true, result: orders });
  } catch (error) {
    console.error('Error fetching current deliveries:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const ownerOrders = async (req, res) => {
  console.log('getOrdersForOwner endpoint hit');
  try {
    const orders = await Order.find({})
      .sort({ createdAt: -1 })
      .populate({
        path: 'doctorId',
        match: { _id: { $ne: null } },
        select: 'name role email'
      })
      .populate({
        path: 'delivererId',
        match: { _id: { $ne: null } },
        select: 'name role email'
      });

    console.log('Owner all orders:', orders);
    res.json({ success: true, result: orders });
  } catch (err) {
    console.log(err);
    console.error('Error fetching all orders for owner:', err);
    res.status(500).json({ success: false, message: err.message || 'Internal server error' });
  }
};

const assignDeliverer = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { delivererId } = req.body;

    const deliverer = await Admin.findById(delivererId);
    if (!deliverer || deliverer.role !== 'deliverer') {
      return res.status(400).json({ success: false, message: 'Invalid deliverer ID or role' });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    order.delivererId = delivererId;
    order.status = 'processing';
    await order.save();

    res.json({ success: true, result: order, message: 'Deliverer assigned successfully' });
  } catch (error) {
    console.error('Error assigning deliverer:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const getPendingInvoices = async (req, res) => {
  try {
    const orders = await Order.find({
      isDeleted: false,
      invoiceId: { $exists: false },
    })
      .populate('doctorId', 'name')
      .populate('delivererId', 'name')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      result: orders,
    });
  } catch (err) {
    console.error('❌ Error fetching pending invoicing orders:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch pending invoicing orders',
    });
  }
};

// Basic read method for single order
const read = async (req, res) => {
  try {
    const { orderId } = req.params;
    
    const order = await Order.findById(orderId)
      .populate('doctorId', 'name role email')
      .populate('delivererId', 'name role email')
      .populate('items.inventoryItem');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    return res.json({ success: true, result: order });
  } catch (error) {
    console.error('Error fetching order:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// NEW: Get order with substitution details (this was missing!)
const getOrderWithSubstitutions = async (req, res) => {
  try {
    const { orderId } = req.params;
    console.log('Fetching order with substitutions for orderId:', orderId);

    const order = await Order.findById(orderId)
      .populate('doctorId', 'name role email')
      .populate('delivererId', 'name role email')
      .populate({
        path: 'items.inventoryItem',
        select: 'itemName category price expiryDate batchNumber'
      })      .populate({
        path: 'items.substitutions.returnId',  // Fixed: use returnId to match schema
        populate: {
          path: 'originalItemId',
          select: 'orderNumber'
        }
      })
      .populate('items.substitutions.substitutedBy', 'name');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    return res.json({ success: true, result: order });
  } catch (error) {
    console.error('Error fetching order with substitutions:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Get order with inventory details and available returns
const getOrderWithInventoryDetails = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId).populate('items.inventoryItem');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Get updated items with current inventory prices and available returns
    const updatedItems = await Promise.all(order.items.map(async (item) => {
      const inventoryItem = await Inventory.findById(item.inventoryItem._id);
      
      // Find available returns for this inventory item
      const availableReturns = await Returns.find({
        originalItemId: item.inventoryItem._id,
        status: 'Available for reuse'
      }).populate('originalItemId', 'itemName category price');

      return {
        _id: item._id,
        inventoryItem: item.inventoryItem,
        quantity: item.quantity,
        price: inventoryItem ? inventoryItem.price : item.price,
        availableReturns: availableReturns.map(ret => ({
          _id: ret._id,
          returnedQuantity: ret.returnedQuantity,
          reason: ret.reason,
          returnDate: ret.returnDate || ret.createdAt
        }))
      };
    }));

    return res.json({
      success: true,
      order: {
        ...order.toObject(),
        items: updatedItems,
      },
    });

  } catch (error) {
    console.error('Error fetching order with inventory details:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// NEW: Get available returned items for substitution
const getAvailableReturnedItems = async (req, res) => {
  try {
    const { inventoryItemId } = req.params;
    console.log('Fetching available returns for inventory item:', inventoryItemId);

    const availableReturns = await Returns.find({
      originalItemId: inventoryItemId,
      status: 'Available for reuse',
      returnedQuantity: { $gt: 0 }
    })
    .populate('originalItemId', 'itemName category price expiryDate batchNumber')
    .populate({
      path: 'returnOrder',
      select: 'orderNumber'
    })
    .sort({ returnDate: -1 });

    return res.json({
      success: true,
      result: availableReturns.map(returnItem => ({
        _id: returnItem._id,
        returnedQuantity: returnItem.returnedQuantity,
        reason: returnItem.reason,
        returnedDate: returnItem.returnDate,
        inventoryItem: returnItem.originalItemId,
        returnOrder: returnItem.returnOrder
      }))
    });

  } catch (error) {
    console.error('Error fetching available returns:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// NEW: Substitute order item with returned item
const substituteOrderItem = async (req, res) => {
  try {
    const { orderId } = req.params;
    console.log("substituting from order : ", orderId)
    const { inventoryItemId, returnItemId, quantityToSubstitute } = req.body;
    console.log('Substitution request:', { orderId, inventoryItemId, returnItemId, quantityToSubstitute });

    // Validate input
    if (!inventoryItemId || !returnItemId || !quantityToSubstitute || quantityToSubstitute <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Inventory item ID, return item ID, and valid quantity are required'
      });
    }

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(inventoryItemId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid inventory item ID format'
      });
    }

    if (!mongoose.Types.ObjectId.isValid(returnItemId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid return item ID format'
      });
    }

    // Find the order
    const order = await Order.findById(orderId).populate('items.inventoryItem');
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    
    if (!order.items || order.items.length === 0) {
      return res.status(400).json({ success: false, message: 'Order has no items' });
    }

    console.log('Order found:', order.id);
    console.log('Order items:', order.items.map(item => ({ 
      orderItemId: item._id.toString(), 
      inventoryItemId: item.inventoryItem?._id.toString(),
      name: item.inventoryItem?.itemName 
    })));
    console.log('Looking for inventory item ID:', inventoryItemId);
    
    // Find the order item by inventory item ID (much more reliable)
    const orderItem = order.items.find(item => 
      item.inventoryItem && item.inventoryItem._id.toString() === inventoryItemId.toString()
    );
    
    console.log('Order item found:', orderItem ? {
      orderItemId: orderItem._id.toString(),
      inventoryItemId: orderItem.inventoryItem._id.toString(),
      name: orderItem.inventoryItem.itemName
    } : null);
    
    if (!orderItem) {
      console.log('Available inventory item IDs:', order.items.map(item => ({
        orderItemId: item._id.toString(),
        inventoryItemId: item.inventoryItem?._id.toString(),
        name: item.inventoryItem?.itemName
      })));
      return res.status(404).json({ 
        success: false, 
        message: 'Order item not found for the specified inventory item',
        debug: {
          receivedInventoryItemId: inventoryItemId,
          availableInventoryItems: order.items.map(item => ({
            orderItemId: item._id.toString(),
            inventoryItemId: item.inventoryItem?._id.toString(),
            name: item.inventoryItem?.itemName
          }))
        }
      });
    }

    // Find the return item
    const returnItem = await Returns.findById(returnItemId)
      .populate('originalItemId')
      .populate('returnOrder', 'orderNumber');
    
    if (!returnItem) {
      return res.status(404).json({ success: false, message: 'Return item not found' });
    }

    // Validate return item
    if (returnItem.status !== 'Available for reuse') {
      return res.status(400).json({ success: false, message: 'Return item is not available for reuse' });
    }

    if (returnItem.returnedQuantity < quantityToSubstitute) {
      return res.status(400).json({ 
        success: false, 
        message: `Insufficient returned quantity. Available: ${returnItem.returnedQuantity}, Requested: ${quantityToSubstitute}` 
      });
    }

    // Validate that return item matches the order item
    if (returnItem.originalItemId._id.toString() !== orderItem.inventoryItem._id.toString()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Return item does not match order item' 
      });
    }    // Start transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Update the return item quantity
      if (returnItem.returnedQuantity === quantityToSubstitute) {
        // Mark entire return as used
        returnItem.status = 'Used';
        returnItem.usedDate = new Date();
        returnItem.returnedQuantity = 0;
      } else {
        // Reduce the returned quantity
        returnItem.returnedQuantity -= quantityToSubstitute;
      }

      await returnItem.save({ session });

      // Add substitution to order item
      if (!orderItem.substitutions) {
        orderItem.substitutions = [];
      }

      orderItem.substitutions.push({
        returnId: returnItemId,  // Fixed: use returnId to match schema
        quantitySubstituted: quantityToSubstitute,
        substitutedAt: new Date(),  // Fixed: use substitutedAt to match schema
        substitutedBy: req.user?.id || req.userId
      });

      // Save the order
      await order.save({ session });

      // Commit transaction
      await session.commitTransaction();
      session.endSession();

      console.log('Substitution completed successfully');

      return res.json({
        success: true,
        message: `Successfully substituted ${quantityToSubstitute} units of ${orderItem.inventoryItem.itemName}`,
        result: {
          inventoryItemId,
          returnItemId,
          quantitySubstituted: quantityToSubstitute,
          itemName: orderItem.inventoryItem.itemName
        }
      });

    } catch (error) {
      // Rollback transaction on error
      console.error('Transaction error:', error);
      await session.abortTransaction();
      session.endSession();
      
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to complete substitution'
      });
    }

  } catch (error) {
    console.error('Error substituting order item:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
};

const getAvailableReturnsForItem = async (req, res) => {
  return getAvailableReturnedItems(req, res);
};

module.exports = {
  assignDeliverer,
  delivererOrders,
  ownerOrders,
  getPendingInvoices,
  read,
  getOrderWithSubstitutions,
  getOrderWithInventoryDetails,
  getAvailableReturnedItems,
  substituteOrderItem,
  getAvailableReturnsForItem,
};
