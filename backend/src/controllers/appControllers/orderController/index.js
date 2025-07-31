const Order = require('@/models/appModels/Order');
const Admin = require('@/models/coreModels/Admin');
const Inventory = require('@/models/appModels/Inventory');
const Return = require('@/models/appModels/Returns'); // Fixed: Use singular "Return" to match model name
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const { generatePdf } = require('@/controllers/pdfController');

console.log("order controller loaded");

const delivererOrders = async (req, res) => {
  console.log('getCurrentOrdersForDeliverer endpoint hit');
  try {
    const delivererId = req.user.id;
    console.log('Fetching current deliveries for deliverer:', delivererId);

    // Include completed orders so deliverers can see return information
    const orders = await Order.find({ 
      delivererId, 
      status: { $in: ['pending', 'processing', 'picked_up', 'completed'] } 
    })
      .populate('doctorId', 'name role email hospitalName')
      .populate('delivererId', 'name role email')
      .populate({
        path: 'items.inventoryItem',
        select: 'itemName category price expiryDate batchNumber'
      })
      .populate({
        path: 'items.substitutions.returnId',
        populate: {
          path: 'originalItemId',
          select: 'itemName category batchNumber expiryDate price'
        }
      })
      .populate('items.substitutions.substitutedBy', 'name')
      .sort({ createdAt: -1 });

    console.log('Current deliveries:', orders.length);
    
    // Add substitution summary and return information for deliverers
    const ordersWithEnhancedDetails = await Promise.all(orders.map(async (order) => {
      const orderObj = order.toObject();
      
      // Ensure hospitalName is set properly - use fallback logic
      if (!orderObj.hospitalName && orderObj.doctorId?.hospitalName) {
        orderObj.hospitalName = orderObj.doctorId.hospitalName;
      } else if (!orderObj.hospitalName) {
        orderObj.hospitalName = 'Unknown Hospital';
      }
      
      // Add substitution counts and details
      orderObj.substitutionSummary = {
        totalSubstitutions: 0,
        itemsWithSubstitutions: 0,
        details: []
      };

      // Add return information
      let totalOriginalQuantity = 0;
      let totalReturnedQuantity = 0;
      let totalReturnedValue = 0;
      let itemsWithReturns = 0;
      const returnDetails = [];

      for (const item of orderObj.items) {
        totalOriginalQuantity += item.quantity;

        // Handle substitutions
        if (item.substitutions && item.substitutions.length > 0) {
          orderObj.substitutionSummary.itemsWithSubstitutions++;
          orderObj.substitutionSummary.totalSubstitutions += item.substitutions.length;
          
          item.substitutions.forEach(sub => {
            orderObj.substitutionSummary.details.push({
              originalItem: (item.inventoryItem && item.inventoryItem.itemName) ? item.inventoryItem.itemName : 'Unknown Item',
              quantitySubstituted: sub.quantitySubstituted,
              substitutedAt: sub.substitutedAt,
              substitutedBy: sub.substitutedBy?.name || 'Unknown',
              returnedItem: sub.returnId?.originalItemId?.itemName || 'Unknown Item'
            });
          });
        }

        // Find returns for this item
        if (item.inventoryItem && item.inventoryItem._id) {
          const returnedItems = await Return.find({
            originalItemId: item.inventoryItem._id,
            returnOrder: order._id,
            status: { $in: ['Available for reuse', 'Used', 'Damaged', 'Disposed'] }
          });

          const itemReturnedQuantity = returnedItems.reduce((sum, returnItem) => {
            return sum + (returnItem.returnedQuantity || 0);
          }, 0);

          if (itemReturnedQuantity > 0) {
            itemsWithReturns++;
            totalReturnedQuantity += itemReturnedQuantity;
            
            const itemPrice = item.price || item.inventoryItem.price || 0;
            const itemReturnedValue = itemReturnedQuantity * itemPrice;
            totalReturnedValue += itemReturnedValue;

            returnDetails.push({
              itemName: item.inventoryItem.itemName,
              originalQuantity: item.quantity,
              returnedQuantity: itemReturnedQuantity,
              itemPrice: itemPrice,
              returnedValue: itemReturnedValue,
              returns: returnedItems.map(ret => ({
                quantity: ret.returnedQuantity,
                status: ret.status,
                reason: ret.reason,
                returnedAt: ret.returnedAt
              }))
            });
          }
        }
      }

      // Add return information to order object
      orderObj.returnInfo = {
        hasReturns: itemsWithReturns > 0,
        totalItems: orderObj.items.length,
        itemsWithReturns,
        totalOriginalQuantity,
        totalReturnedQuantity,
        totalReturnedValue,
        returnDetails
      };

      return orderObj;
    }));

    res.json({ success: true, result: ordersWithEnhancedDetails });
  } catch (error) {
    console.error('Error fetching current deliveries:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const ownerOrders = async (req, res) => {
  console.log('getOrdersForOwner endpoint hit - ENHANCED VERSION');
  try {
    const orders = await Order.find({})
      .sort({ createdAt: -1 })
      // Populate full doctor details with all fields
      .populate({
        path: 'doctorId',
        match: { _id: { $ne: null } }
        // No select to get all fields
      })
      // Populate full deliverer details
      .populate({
        path: 'delivererId',
        match: { _id: { $ne: null } }
        // No select to get all fields
      })
      // Populate inventory items with all necessary details
      .populate({
        path: 'items.inventoryItem',
        select: 'itemName category price expiryDate batchNumber manufacturer description'
      })
      // Populate any substitutions that might exist
      .populate({
        path: 'items.substitutions.returnId',
        populate: {
          path: 'originalItemId',
          select: 'itemName category batchNumber expiryDate price'
        }
      })
      .populate('items.substitutions.substitutedBy', 'name role email');

    console.log(`✅ Owner fetched ${orders.length} orders with enhanced customer and inventory details`);
    
    // Add some additional information/processing if needed
    const enhancedOrders = orders.map(order => {
      const orderObj = order.toObject();
      
      // Ensure hospitalName is properly set - use fallback logic
      if (!orderObj.hospitalName && orderObj.doctorId?.hospitalName) {
        orderObj.hospitalName = orderObj.doctorId.hospitalName;
      } else if (!orderObj.hospitalName && orderObj.doctorId?.name) {
        // If doctor doesn't have hospitalName, use doctor's name as fallback
        orderObj.hospitalName = orderObj.doctorId.name;
      } else if (!orderObj.hospitalName) {
        orderObj.hospitalName = 'Unknown Hospital';
      }
      
      // Add complete item details summary
      if (orderObj.items && orderObj.items.length > 0) {
        orderObj.itemsSummary = {
          totalItems: orderObj.items.length,
          categories: [...new Set(orderObj.items
            .filter(item => item.inventoryItem && item.inventoryItem.category)
            .map(item => item.inventoryItem.category))]
        };
      }
      
      return orderObj;
    });

    res.json({ success: true, result: enhancedOrders });
  } catch (err) {
    console.error('Error fetching enhanced orders for owner:', err);
    res.status(500).json({ success: false, message: err.message || 'Internal server error' });
  }
};

const assignDeliverer = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { delivererId } = req.body;

    const deliverer = await Admin.findById(delivererId);
    console.log(deliverer)
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
    // Only fetch COMPLETED orders that don't have invoices yet
    const orders = await Order.find({
      isDeleted: false,
      status: 'completed', // Only completed orders should be pending for invoice
      invoiceId: { $exists: false },
    })
      .populate('doctorId', 'name')
      .populate('delivererId', 'name')
      .populate('items.inventoryItem', 'itemName')
      .sort({ completedAt: -1, createdAt: -1 });

    console.log(`Found ${orders.length} completed orders pending invoice`);

    // Add return information to each order
    const ordersWithReturnInfo = await Promise.all(orders.map(async (order) => {
      let totalOriginalQuantity = 0;
      let totalReturnedQuantity = 0;
      let itemsWithReturns = 0;

      for (const item of order.items) {
        totalOriginalQuantity += item.quantity;

        // Find returns for this item in this order
        let returnedItems = [];
        if (item.inventoryItem && item.inventoryItem._id) {
          returnedItems = await Return.find({
            originalItemId: item.inventoryItem._id,
            returnOrder: order._id,
            status: { $in: ['Available for reuse', 'Used', 'Damaged', 'Disposed'] }
          });
        } else {
          console.warn('Skipping return lookup: missing inventoryItem on order', order._id, 'item:', item._id);
        }

        const itemReturnedQuantity = returnedItems.reduce((sum, returnItem) => {
          return sum + (returnItem.returnedQuantity || 0);
        }, 0);

        if (itemReturnedQuantity > 0) {
          itemsWithReturns++;
          totalReturnedQuantity += itemReturnedQuantity;
        }
      }

      const orderObj = order.toObject();
      orderObj.returnInfo = {
        hasReturns: totalReturnedQuantity > 0,
        totalOriginalQuantity,
        totalReturnedQuantity,
        totalUsedQuantity: totalOriginalQuantity - totalReturnedQuantity,
        itemsWithReturns,
        totalItems: order.items.length
      };

      return orderObj;
    }));

    return res.status(200).json({
      success: true,
      result: ordersWithReturnInfo,
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

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      console.error('Invalid order ID format:', orderId);
      return res.status(400).json({ success: false, message: 'Invalid order ID format' });
    }

    console.log('Looking for order with ID:', orderId);
    const order = await Order.findById(orderId)
      // Fully populate doctorId with all fields for complete customer data
      .populate('doctorId')
      .populate('delivererId')
      .populate({
        path: 'items.inventoryItem',
        select: 'itemName category price expiryDate batchNumber manufacturer'
      })
      .populate({
        path: 'items.substitutions.returnId',
        populate: [
          {
            path: 'originalItemId',
            select: 'itemName category batchNumber expiryDate'
          },
          {
            path: 'returnOrder',
            select: 'orderNumber'
          }
        ]
      })
      .populate('items.substitutions.substitutedBy', 'name role email');

    if (!order) {
      console.error('Order not found with ID:', orderId);
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    console.log('✅ Successfully retrieved order with ID:', orderId);
    console.log('✅ Order type:', order.orderType);
    console.log('✅ Order number:', order.orderNumber);
    console.log('✅ Items count:', order.items?.length || 0);
    
    // Log substitution data for debugging
    if (order.items) {
      let totalSubstitutions = 0;
      order.items.forEach(item => {
        if (item.substitutions && item.substitutions.length > 0) {
          console.log(`Item ${item.inventoryItem.itemName} has ${item.substitutions.length} substitutions`);
          totalSubstitutions += item.substitutions.length;
        }
      });
      console.log(`Total substitution records: ${totalSubstitutions}`);
    }

    return res.json({ success: true, result: order });
  } catch (error) {
    console.error('Error fetching order with substitutions:', error);
    return res.status(500).json({ success: false, message: error.message || 'Internal server error' });
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

    // Get updated items with current inventory prices and calculate used quantities
    const updatedItems = await Promise.all(order.items.map(async (item) => {
      const inventoryItem = await Inventory.findById(item.inventoryItem._id);
      
      // Find available returns for this inventory item
      const availableReturns = await Return.find({
        originalItemId: item.inventoryItem._id,
        status: 'Available for reuse'
      }).populate('originalItemId', 'itemName category price');

      // Calculate total returned quantity for this order item
      const returnedItems = await Return.find({
        originalItemId: item.inventoryItem._id,
        returnOrder: orderId,
        status: { $in: ['Available for reuse', 'Used', 'Damaged', 'Disposed'] }
      });

      const totalReturnedQuantity = returnedItems.reduce((sum, returnItem) => {
        return sum + (returnItem.returnedQuantity || 0);
      }, 0);

      // Calculate used quantity (original quantity - returned quantity)
      const usedQuantity = Math.max(0, item.quantity - totalReturnedQuantity);

      console.log(`Order ${orderId}, Item ${item.inventoryItem.itemName}: Original: ${item.quantity}, Returned: ${totalReturnedQuantity}, Used: ${usedQuantity}`);

      return {
        _id: item._id,
        inventoryItem: item.inventoryItem,
        quantity: usedQuantity, // This is now the "used" quantity for invoice purposes
        originalQuantity: item.quantity, // Keep original for reference
        returnedQuantity: totalReturnedQuantity, // Track returned amount
        price: inventoryItem ? inventoryItem.price : item.price,
        availableReturns: availableReturns.map(ret => ({
          _id: ret._id,
          returnedQuantity: ret.returnedQuantity,
          reason: ret.reason,
          returnDate: ret.returnDate || ret.createdAt
        }))
      };
    }));    // Filter out items where used quantity is 0 (completely returned)
    const itemsWithUsedQuantity = updatedItems.filter(item => item.quantity > 0);

    // Find or create a client for this doctor/hospital
    const Client = mongoose.model('Client');
    let client = null;

    if (order.doctorName && order.hospitalName) {
      // Try to find existing client by name and hospital
      client = await Client.findOne({
        name: order.doctorName,
        address: order.hospitalName,
        removed: false
      });

      // If no client found, create one
      if (!client) {
        try {
          client = await Client.create({
            name: order.doctorName,
            address: order.hospitalName,
            phone: '', // Could be enhanced with doctor contact info
            email: '', // Could be enhanced with doctor contact info
            enabled: true,
            createdBy: order.createdBy || null
          });
          console.log(`Created new client for doctor: ${order.doctorName} at ${order.hospitalName}`);
        } catch (clientError) {
          console.warn('Failed to create client:', clientError.message);
          // Continue without client - the invoice form will require manual selection
        }
      }
    }

    return res.json({
      success: true,
      order: {
        ...order.toObject(),
        items: itemsWithUsedQuantity,
        originalItemCount: updatedItems.length, // Track how many items before filtering
        filteredItemCount: updatedItems.length - itemsWithUsedQuantity.length, // How many were filtered out
        hasReturns: updatedItems.some(item => item.returnedQuantity > 0),
      },
      // Add client information for invoice creation
      doctorName: order.doctorName,
      hospitalName: order.hospitalName,
      client: client, // The actual client record for the invoice
      clientInfo: {
        name: order.doctorName || 'Unknown Doctor',
        address: order.hospitalName || 'Unknown Hospital',
        phone: client?.phone || '',
        email: client?.email || '',
        type: 'doctor'
      }
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

    const availableReturns = await Return.find({
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
    const returnItem = await Return.findById(returnItemId)
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

// NEW: Mark order as picked up by deliverer with photo verification
const markOrderAsPickup = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { photo, notes, location } = req.body;
    const delivererId = req.user.id;
    
    console.log('=== ORDER PICKUP VERIFICATION ===');
    console.log('Order ID:', orderId);
    console.log('Deliverer ID:', delivererId);
    console.log('Photo received:', photo ? `YES (${photo.length} chars)` : 'NO');
    console.log('Photo starts with data:image:', photo ? photo.startsWith('data:image/') : 'N/A');
    console.log('Notes:', notes);
    console.log('Location:', location);
    
    // Validate base64 photo format
    if (photo && typeof photo === 'string' && !photo.startsWith('data:image/')) {
      console.log('❌ Invalid photo format detected');
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid photo format. Please provide a valid image.' 
      });
    }
    
    // Find the order
    const order = await Order.findById(orderId);
    if (!order) {
      console.log('❌ Order not found');
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    
    // Verify the order is assigned to this deliverer
    if (order.delivererId?.toString() !== delivererId) {
      console.log('❌ Order not assigned to this deliverer');
      return res.status(403).json({ 
        success: false, 
        message: 'This order is not assigned to you' 
      });
    }
    
    // Verify order is in correct status for pickup
    if (order.status !== 'pending' && order.status !== 'processing') {
      console.log('❌ Order not in correct status for pickup, current status:', order.status);
      return res.status(400).json({ 
        success: false, 
        message: 'Order is not available for pickup' 
      });
    }
    
    // Update order with pickup verification
    order.status = 'picked_up';
    order.pickedUpAt = new Date();
    order.pickupVerification = {
      photo: photo,
      timestamp: new Date(),
      notes: notes || '',
      location: location || null
    };
    
    console.log('✅ Saving pickup verification data...');
    await order.save();
    
    console.log('✅ Order marked as picked up with verification');
    console.log('Pickup verification saved:', {
      hasPhoto: !!order.pickupVerification.photo,
      photoLength: order.pickupVerification.photo?.length || 0,
      timestamp: order.pickupVerification.timestamp
    });
    
    res.json({ 
      success: true, 
      message: 'Order marked as picked up successfully with photo verification',
      result: order 
    });
    
  } catch (error) {
    console.error('❌ Error marking order as picked up:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
};

// NEW: Mark order as delivered by deliverer with photo and signature verification
const markOrderAsDelivered = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { photo, customerSignature, customerName, notes, location } = req.body;
    const delivererId = req.user.id;
    
    console.log('=== ORDER DELIVERY VERIFICATION ===');
    console.log('Order ID:', orderId);
    console.log('Deliverer ID:', delivererId);
    console.log('Photo received:', photo ? `YES (${photo.length} chars)` : 'NO');
    console.log('Photo starts with data:image:', photo ? photo.startsWith('data:image/') : 'N/A');
    console.log('Customer signature received:', customerSignature ? `YES (${customerSignature.length} chars)` : 'NO');
    console.log('Customer signature starts with data:image:', customerSignature ? customerSignature.startsWith('data:image/') : 'N/A');
    console.log('Customer name:', customerName);
    console.log('Notes:', notes);
    console.log('Location:', location);
    
    // Validate required verification data
    if (!photo) {
      return res.status(400).json({ 
        success: false, 
        message: 'Photo verification is required for delivery confirmation' 
      });
    }
    
    if (!customerSignature || !customerName) {
      return res.status(400).json({ 
        success: false, 
        message: 'Customer signature and name are required for delivery verification' 
      });
    }
    
    // Validate base64 photo and signature format
    if (!photo.startsWith('data:image/')) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid photo format. Please provide a valid image.' 
      });
    }
    
    // Find the order
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    
    // Verify the order is assigned to this deliverer
    if (order.delivererId?.toString() !== delivererId) {
      return res.status(403).json({ 
        success: false, 
        message: 'This order is not assigned to you' 
      });
    }
    
    // Verify the order was picked up first
    if (order.status !== 'picked_up') {
      return res.status(400).json({ 
        success: false, 
        message: 'Order must be picked up before it can be delivered' 
      });
    }
    
    // Update order with delivery verification
    order.status = 'completed';
    order.deliveredAt = new Date();
    order.deliveryVerification = {
      photo: photo, // Base64 encoded photo
      timestamp: new Date(),
      customerSignature: customerSignature, // Base64 encoded signature
      customerName: customerName,
      notes: notes || '',
      location: location || null
    };
    
    await order.save();
    
    console.log('Order marked as delivered with verification:', orderId);
    
    res.json({ 
      success: true, 
      message: 'Order marked as delivered successfully with verification',
      result: order 
    });
    
  } catch (error) {
    console.error('Error marking order as delivered:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
};

// NEW: Get delivered orders history for deliverer
const getDeliveredOrdersHistory = async (req, res) => {
  try {
    const delivererId = req.user.id;
    console.log('Fetching delivered orders history for deliverer:', delivererId);

    const deliveredOrders = await Order.find({ 
      delivererId, 
      status: 'completed',
      deliveredAt: { $exists: true }
    })
      .populate('doctorId', 'name role email')
      .populate('delivererId', 'name role email')
      .populate({
        path: 'items.inventoryItem',
        select: 'itemName category price expiryDate batchNumber'
      })
      .populate({
        path: 'items.substitutions.returnId',
        populate: {
          path: 'originalItemId',
          select: 'itemName category batchNumber expiryDate'
        }
      })
      .populate('items.substitutions.substitutedBy', 'name')
      .sort({ deliveredAt: -1 });

    console.log('Delivered orders found:', deliveredOrders.length);
    
    // Add substitution summary for each delivered order
    const ordersWithSubstitutionDetails = deliveredOrders.map(order => {
      const orderObj = order.toObject();
      
      // Add substitution counts and details
      orderObj.substitutionSummary = {
        totalSubstitutions: 0,
        itemsWithSubstitutions: 0,
        details: []
      };

      orderObj.items.forEach(item => {
        if (item.substitutions && item.substitutions.length > 0) {
          orderObj.substitutionSummary.itemsWithSubstitutions++;
          orderObj.substitutionSummary.totalSubstitutions += item.substitutions.length;
          
          item.substitutions.forEach(sub => {
            orderObj.substitutionSummary.details.push({
              originalItem: (item.inventoryItem && item.inventoryItem.itemName) ? item.inventoryItem.itemName : 'Unknown Item',
              quantitySubstituted: sub.quantitySubstituted,
              substitutedAt: sub.substitutedAt,
              substitutedBy: sub.substitutedBy?.name || 'Unknown',
              returnedItem: sub.returnId?.originalItemId?.itemName || 'Unknown Item'
            });
          });
        }
      });

      return orderObj;
    });

    res.json({ success: true, result: ordersWithSubstitutionDetails });
  } catch (error) {
    console.error('Error fetching delivered orders history:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
const hospitalOrders = async (req, res) => {
  console.log('getOrdersForHospital endpoint hit');
  try {
    const hospitalId = req.user.id;
    console.log('Fetching orders for hospital:', hospitalId);

    const orders = await Order.find({ 
      doctorId: hospitalId,
      isDeleted: false 
    })
      .sort({ createdAt: -1 })
      .populate({
        path: 'delivererId',
        match: { _id: { $ne: null } },
        select: 'name role email'
      })
      .populate({
        path: 'items.inventoryItem',
        select: 'itemName category price description expiryDate batchNumber manufacturer unit minimumStock maximumStock'
      });

    console.log('Hospital orders:', orders.length);
    res.json({ success: true, result: orders });
  } catch (error) {
    console.error('Error fetching hospital orders:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const createHospitalOrder = async (req, res) => {
  console.log('createHospitalOrder endpoint hit');
  try {
    const { items, totalAmount } = req.body;
    const hospitalId = req.user.id;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Order must contain at least one item' 
      });
    }

    // Validate inventoryItem IDs and purchase types
    for (const item of items) {
      if (!mongoose.Types.ObjectId.isValid(item.inventoryItem)) {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid inventory item ID' 
        });
      }
      
      // Verify the inventory item exists and is active
      const inventoryItem = await Inventory.findOne({
        _id: item.inventoryItem,
        isActive: { $ne: false }
      });
      
      if (!inventoryItem) {
        return res.status(400).json({
          success: false,
          message: `Inventory item not found or inactive: ${item.inventoryItem}`
        });
      }
      
      if (!item.purchaseType || !['buy', 'rent'].includes(item.purchaseType)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid purchase type. Must be either "buy" or "rent"'
        });
      }
    }    // Create the order with orderNumber explicitly set
    const orderCount = await Order.countDocuments();
    const orderNumber = `DO${String(orderCount + 1).padStart(6, '0')}`;
    
    // Get hospital name - for doctors, use their hospitalName field; for hospitals, use their name
    let hospitalName = 'Unknown Hospital';
    if (req.user.role === 'doctor' && req.user.hospitalName) {
      hospitalName = req.user.hospitalName;
    } else if (req.user.role === 'hospital') {
      hospitalName = req.user.name || 'Unknown Hospital';
    } else {
      // Try to get from user name as fallback
      hospitalName = req.user.name || 'Unknown Hospital';
    }
    
    const order = new Order({
      orderNumber, // Set explicitly to avoid the error
      items,
      totalAmount: totalAmount || 0,
      status: 'pending',
      orderType: 'doctor',
      doctorId: hospitalId,
      doctorName: req.user.name,
      hospitalName: hospitalName,
      createdBy: hospitalId
    });

    try {
      await order.save();
      console.log('Hospital order created:', order);
      res.json({ success: true, result: order });
    } catch (saveError) {
      console.error('Error saving hospital order:', saveError.message);
      res.status(500).json({ success: false, message: saveError.message || 'Error saving order' });
    }
  } catch (error) {
    console.error('Error creating hospital order:', error);
    res.status(500).json({ success: false, message: error.message || 'Internal server error' });
  }
};

// Get a single order by ID (basic endpoint for fallback)
const getOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;
    console.log('Fetching order by ID:', orderId);

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      console.error('Invalid order ID format:', orderId);
      return res.status(400).json({ success: false, message: 'Invalid order ID format' });
    }

    const order = await Order.findById(orderId)
      .populate('doctorId')
      .populate('delivererId')
      .populate({
        path: 'items.inventoryItem',
        select: 'itemName category price expiryDate batchNumber manufacturer'
      });

    if (!order) {
      console.error('Order not found with ID:', orderId);
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    console.log('✅ Successfully retrieved basic order with ID:', orderId);
    return res.json({ success: true, result: order });
  } catch (error) {
    console.error('Error fetching order by ID:', error);
    return res.status(500).json({ success: false, message: error.message || 'Internal server error' });
  }
};

const doctorOrders = async (req, res) => {
  console.log('getDoctorOrders endpoint hit');
  try {
    const doctorId = req.user.id;
    console.log('Fetching orders for doctor:', doctorId);

    const orders = await Order.find({ 
      doctorId: doctorId,
      isDeleted: false 
    })
      .sort({ createdAt: -1 })
      .populate({
        path: 'delivererId',
        match: { _id: { $ne: null } },
        select: 'name role email'
      })
      .populate({
        path: 'items.inventoryItem',
        select: 'itemName category price description expiryDate batchNumber manufacturer unit minimumStock maximumStock'
      });

    console.log('Doctor orders found:', orders.length);
    
    // Enhance orders with hospitalName fallback
    const enhancedOrders = orders.map(order => {
      const orderObj = order.toObject();
      
      // Ensure hospitalName is properly set
      if (!orderObj.hospitalName && req.user.hospitalName) {
        orderObj.hospitalName = req.user.hospitalName;
      } else if (!orderObj.hospitalName && req.user.role === 'hospital') {
        orderObj.hospitalName = req.user.name || 'Unknown Hospital';
      } else if (!orderObj.hospitalName) {
        orderObj.hospitalName = 'Unknown Hospital';
      }
      
      return orderObj;
    });
    
    res.json({ success: true, orders: enhancedOrders });
  } catch (error) {
    console.error('Error fetching doctor orders:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const createDoctorOrder = async (req, res) => {
  console.log('createDoctorOrder endpoint hit');
  try {
    const { items, totalAmount, notes, orderNotes } = req.body;
    const doctorId = req.user.id;

    console.log('🔍 Doctor order request:', JSON.stringify({ items, totalAmount, doctorId }, null, 2));

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Order must contain at least one item' 
      });
    }

    // Validate inventoryItem IDs and purchase types, and fetch actual prices
    const processedItems = [];
    let calculatedTotalAmount = 0;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      console.log(`🔍 Processing item ${i + 1}:`, {
        inventoryItem: item.inventoryItem,
        quantity: item.quantity,
        purchaseType: item.purchaseType,
        isValidObjectId: mongoose.Types.ObjectId.isValid(item.inventoryItem)
      });
      
      if (!mongoose.Types.ObjectId.isValid(item.inventoryItem)) {
        console.log(`❌ Invalid ObjectId for item ${i + 1}: "${item.inventoryItem}"`);
        return res.status(400).json({ 
          success: false, 
          message: `Invalid inventory item ID for item ${i + 1}` 
        });
      }
      
      if (!item.purchaseType || !['regular', 'emergency'].includes(item.purchaseType)) {
        return res.status(400).json({
          success: false,
          message: `Invalid purchase type for item ${i + 1}. Must be either "regular" or "emergency"`
        });
      }

      if (!item.quantity || item.quantity <= 0) {
        return res.status(400).json({
          success: false,
          message: `Invalid quantity for item ${i + 1}. Must be greater than 0`
        });
      }

      // Fetch the inventory item to get the actual price
      console.log(`🔍 Looking up inventory item: ${item.inventoryItem}`);
      
      // For doctors/hospitals, find inventory item without strict organization filtering
      // since they should be able to order from the available inventory
      const inventoryItem = await Inventory.findOne({
        _id: item.inventoryItem,
        isActive: { $ne: false } // Only check if item is active
      });
      
      console.log(`🔍 Inventory lookup result:`, inventoryItem ? {
        _id: inventoryItem._id,
        itemName: inventoryItem.itemName,
        price: inventoryItem.price,
        quantity: inventoryItem.quantity
      } : 'NOT FOUND');
      
      if (!inventoryItem) {
        // Let's also try to find any inventory item to see if the database has data
        const anyItem = await Inventory.findOne().select('_id itemName');
        console.log(`🔍 Sample Inventory item in database:`, anyItem);
        console.log(`🔍 Total Inventory items in database:`, await Inventory.countDocuments());
        
        return res.status(400).json({
          success: false,
          message: `Inventory item not found for item ${i + 1}`
        });
      }

      const itemPrice = inventoryItem.price || 0;
      const itemTotal = itemPrice * item.quantity;
      calculatedTotalAmount += itemTotal;

      processedItems.push({
        inventoryItem: item.inventoryItem,
        quantity: item.quantity,
        price: itemTotal, // Store total price for the quantity
        purchaseType: item.purchaseType,
        notes: item.notes || ''
      });

      console.log(`Item ${i + 1}: ${inventoryItem.itemName} - Unit: ₹${itemPrice}, Qty: ${item.quantity}, Total: ₹${itemTotal}`);
    }

    console.log(`Calculated total amount: ₹${calculatedTotalAmount}`);

    // Create the order with orderNumber
    const orderCount = await Order.countDocuments();
    const orderNumber = `DO${String(orderCount + 1).padStart(6, '0')}`;
    
    // Get hospital name properly
    let hospitalName = 'Unknown Hospital';
    if (req.user.role === 'doctor' && req.user.hospitalName) {
      hospitalName = req.user.hospitalName;
    } else if (req.user.role === 'hospital') {
      hospitalName = req.user.name || 'Unknown Hospital';
    } else {
      hospitalName = req.user.name || 'Unknown Hospital';
    }
    
    const order = new Order({
      orderNumber,
      items: processedItems,
      totalAmount: calculatedTotalAmount,
      status: 'pending',
      orderType: 'doctor',
      doctorId: doctorId,
      doctorName: req.user.name || 'Unknown Doctor',
      hospitalName: hospitalName,
      createdBy: doctorId,
      notes: notes || orderNotes || ''
    });

    await order.save();
    console.log('Doctor order created successfully:', order.orderNumber, `Total: ₹${calculatedTotalAmount}`);
    
    // Populate the created order before sending response
    const populatedOrder = await Order.findById(order._id)
      .populate({
        path: 'items.inventoryItem',
        select: 'name itemName productName sku code description price'
      });

    res.json({ 
      success: true, 
      result: populatedOrder,
      message: `Order ${order.orderNumber} created successfully with ${items.length} item(s)`
    });
  } catch (error) {
    console.error('Error creating doctor order:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Error creating order' 
    });
  }
};

// Get detailed doctor order by ID (for viewing specific order with verification photos)
const getDoctorOrderDetails = async (req, res) => {
  try {
    const { orderId } = req.params;
    const doctorId = req.user._id;

    console.log('🔍 [Backend] getDoctorOrderDetails called:', { 
      orderId, 
      doctorId, 
      userRole: req.user.role,
      userInfo: { id: req.user._id, name: req.user.name }
    });

    // Validate ObjectId format
    if (!orderId || !orderId.match(/^[0-9a-fA-F]{24}$/)) {
      console.log('❌ [Backend] Invalid ObjectId format:', orderId);
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID format'
      });
    }

    console.log('🔍 [Backend] Searching for order with criteria:', {
      _id: orderId,
      orderType: 'doctor',
      doctorId: doctorId
    });

    // Fetch the order with full population including verification data
    const order = await Order.findOne({
      _id: orderId,
      orderType: 'doctor',
      doctorId: doctorId
    })
      .populate('doctorId', 'name role email hospital')
      .populate('delivererId', 'name role email phone')
      .populate({
        path: 'items.inventoryItem',
        select: 'name itemName productName sku code description price category batchNumber expiryDate manufacturer'
      })
      .populate({
        path: 'items.substitutions.returnId',
        populate: {
          path: 'originalItemId',
          select: 'itemName category batchNumber expiryDate price'
        }
      })
      .populate('items.substitutions.substitutedBy', 'name role')
      .populate('assignedHospitalOrganization', 'name address phone')
      .lean();

    console.log('🔍 [Backend] Order search result:', {
      found: !!order,
      orderNumber: order?.orderNumber,
      orderType: order?.orderType,
      doctorMatch: order?.doctorId?.toString() === doctorId.toString()
    });

    if (!order) {
      // Let's also check if the order exists at all (regardless of doctor)
      const anyOrder = await Order.findById(orderId).lean();
      console.log('🔍 [Backend] Order exists but access denied:', {
        orderExists: !!anyOrder,
        actualOrderType: anyOrder?.orderType,
        actualDoctorId: anyOrder?.doctorId
      });
      
      return res.status(404).json({
        success: false,
        message: 'Order not found or access denied'
      });
    }

    console.log('✅ [Backend] Doctor order details found:', {
      orderNumber: order.orderNumber,
      status: order.status,
      itemCount: order.items?.length || 0,
      hasPickupVerification: !!order.pickupVerification,
      hasDeliveryVerification: !!order.deliveryVerification
    });

    // Ensure verification objects exist even if empty
    if (!order.pickupVerification) {
      order.pickupVerification = {};
    }
    if (!order.deliveryVerification) {
      order.deliveryVerification = {};
    }

    res.json({
      success: true,
      result: order,
      message: 'Order details retrieved successfully'
    });

  } catch (error) {
    console.error('❌ [Backend] Error fetching doctor order details:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching order details'
    });
  }
};

// NEW: Get all completed orders for return collection (any deliverer can collect returns)
const getAllCompletedOrdersForReturns = async (req, res) => {
  try {
    console.log('Fetching all completed orders for return collection');

    const completedOrders = await Order.find({ 
      status: 'completed',
      deliveredAt: { $exists: true }
    })
      .populate('doctorId', 'name role email')
      .populate('delivererId', 'name role email')
      .populate({
        path: 'items.inventoryItem',
        select: 'itemName category price expiryDate batchNumber'
      })
      .populate({
        path: 'items.substitutions.returnId',
        populate: {
          path: 'originalItemId',
          select: 'itemName category batchNumber expiryDate'
        }
      })
      .populate('items.substitutions.substitutedBy', 'name')
      .sort({ deliveredAt: -1 });

    console.log('All completed orders found:', completedOrders.length);
    
    // Add substitution summary for each completed order
    const ordersWithSubstitutionDetails = completedOrders.map(order => {
      const orderObj = order.toObject();
      
      // Add substitution counts and details
      orderObj.substitutionSummary = {
        totalSubstitutions: 0,
        itemsWithSubstitutions: 0,
        details: []
      };

      // Add hasSubstitutions flag for easy checking
      orderObj.hasSubstitutions = false;

      orderObj.items.forEach(item => {
        if (item.substitutions && item.substitutions.length > 0) {
          orderObj.hasSubstitutions = true;
          orderObj.substitutionSummary.itemsWithSubstitutions++;
          orderObj.substitutionSummary.totalSubstitutions += item.substitutions.length;
          
          item.substitutions.forEach(sub => {
            orderObj.substitutionSummary.details.push({
              originalItem: (item.inventoryItem && item.inventoryItem.itemName) ? item.inventoryItem.itemName : 'Unknown Item',
              quantitySubstituted: sub.quantitySubstituted,
              substitutedAt: sub.substitutedAt,
              substitutedBy: sub.substitutedBy?.name || 'Unknown',
              returnedItem: sub.returnId?.originalItemId?.itemName || 'Unknown Item'
            });
          });
        }
      });

      return orderObj;
    });

    res.json({ success: true, result: ordersWithSubstitutionDetails });
  } catch (error) {
    console.error('Error fetching all completed orders for returns:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// PDF generation for orders
const generateOrderPdf = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Find the order with populated data
    const order = await Order.findById(id)
      .populate('doctorId', 'name role email hospitalName')
      .populate('delivererId', 'name role email')
      .populate({
        path: 'items.inventoryItem',
        select: 'itemName category price expiryDate batchNumber'
      });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Authorization check
    if (userRole === 'doctor' && order.doctorId._id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    if (userRole === 'deliverer' && order.delivererId?._id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Prepare order data for PDF
    const orderData = {
      ...order.toObject(),
      hospitalName: order.doctorId?.hospitalName || 'Unknown Hospital'
    };

    // Generate unique filename
    const filename = `order_${order.orderNumber}_${Date.now()}.pdf`;
    const targetLocation = path.join(process.cwd(), 'public', 'pdf', filename);

    // Ensure the public/pdf directory exists
    const pdfDir = path.dirname(targetLocation);
    if (!fs.existsSync(pdfDir)) {
      fs.mkdirSync(pdfDir, { recursive: true });
    }

    // Generate PDF
    await generatePdf(
      'order',
      {
        filename,
        format: 'A4',
        targetLocation
      },
      orderData,
      () => {
        // PDF generated successfully
        const fileUrl = `/pdf/${filename}`;
        res.json({
          success: true,
          result: {
            url: fileUrl,
            filename
          },
          message: 'Order PDF generated successfully'
        });
      }
    );

  } catch (error) {
    console.error('Error generating order PDF:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating PDF',
      error: error.message
    });
  }
};

module.exports = {  assignDeliverer,
  delivererOrders,  ownerOrders,
  getPendingInvoices,
  read,
  getOrderWithSubstitutions,
  getOrderWithInventoryDetails,
  getAvailableReturnedItems,
  substituteOrderItem,
  getAvailableReturnsForItem,
  markOrderAsPickup,
  markOrderAsDelivered,
  getDeliveredOrdersHistory,
  getAllCompletedOrdersForReturns,
  hospitalOrders,
  createHospitalOrder,
  doctorOrders,
  createDoctorOrder,
  getDoctorOrderDetails, // NEW: Get specific doctor order with verification data
  getOrderById, // Expose the new fallback endpoint
  getAllCompletedOrdersForReturns, // NEW: Endpoint to get all completed orders for return collection
  generateOrderPdf // NEW: PDF generation endpoint
};
