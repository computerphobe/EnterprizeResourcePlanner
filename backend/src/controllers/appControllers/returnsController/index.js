const Returns = require('@/models/appModels/Returns');
const Inventory = require('@/models/appModels/Inventory');
console.log('loaded returns controller')

// List all returns
const list = async (req, res) => {
  console.log('Fetching returns list...');
  try {
    const returns = await Returns.find()
      .populate({
        path: 'originalItemId',
        select: 'itemName quantity category price'
      })
      .lean();

    console.log('Found returns:', returns);

    // Map the returns to ensure all fields are properly formatted
    const mappedReturns = returns.map(item => ({
      _id: item._id,
      originalItemId: {
        _id: item.originalItemId?._id,
        itemName: item.originalItemId?.itemName || 'N/A',
        quantity: item.originalItemId?.quantity || 0,
        category: item.originalItemId?.category || 'N/A',
        price: item.originalItemId?.price || 0
      },
      returnedQuantity: item.returnedQuantity,
      reason: item.reason || '',
      status: item.status || 'Available for reuse',
      returnDate: item.returnDate || item.createdAt,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      // Include collection metadata for deliverer-collected returns
      collectionMetadata: item.collectionMetadata,
      returnType: item.returnType,
      doctorName: item.doctorName,
      hospitalName: item.hospitalName
    }));

    return res.status(200).json({
      success: true,
      result: mappedReturns,
      message: mappedReturns.length > 0 ? 'Returns retrieved successfully' : 'No returns found'
    });
  } catch (error) {
    console.error('Error fetching returns:', error);
    return res.status(500).json({
      success: false,
      result: [],
      message: 'Error fetching returns',
      error: error.message
    });
  }
};

// Create a return entry
const create = async (req, res) => {
  console.log('request body:', req.body);
  try {
    const { originalItemId, returnedQuantity, reason } = req.body;

    if (!originalItemId || !returnedQuantity) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const inventoryItem = await Inventory.findById(originalItemId);
    if (!inventoryItem) {
      return res.status(404).json({ success: false, message: 'Inventory item not found' });
    }

    const newReturn = new Returns({
      originalItemId,
      returnedQuantity,
      reason,
      status: 'Available for reuse',
    });

    await newReturn.save();

    res.status(201).json({ success: true, message: 'Return recorded successfully', data: newReturn });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error recording return', error: error.message });
  }
};

// Mark a return as used
const markAsUsed = async (req, res) => {
  try {
    const { returnId } = req.body;
    
    if (!returnId) {
      return res.status(400).json({
        success: false,
        message: 'Return ID is required'
      });
    }

    const returnItem = await Returns.findById(returnId);
    if (!returnItem) {
      return res.status(404).json({
        success: false,
        message: 'Return not found'
      });
    }

    if (returnItem.status !== 'Available for reuse') {
      return res.status(400).json({
        success: false,
        message: 'This item is not available for reuse'
      });
    }

    returnItem.status = 'Used';
    await returnItem.save();

    res.status(200).json({
      success: true,
      message: 'Return marked as used successfully',
      result: returnItem
    });
  } catch (error) {
    console.error('Error marking return as used:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking return as used',
      error: error.message
    });
  }
};

// NEW: Collect returns during delivery
const collectReturns = async (req, res) => {
  console.log('=== BACKEND: COLLECT RETURNS ENDPOINT CALLED ===');
  console.log('Request method:', req.method);
  console.log('Request URL:', req.url);
  console.log('Request headers:', req.headers);
  console.log('Request body keys:', Object.keys(req.body || {}));
  console.log('Request body:', JSON.stringify(req.body, null, 2));
  
  try {
    const {
      orderId,
      returnType,
      doctorId,
      doctorName,
      hospitalName,
      items,
      photo,
      customerSignature,
      customerName,
      notes,
      collectedBy,
      collectionDate
    } = req.body;

    console.log('Return collection request:', { 
      orderId, 
      items: items?.length, 
      returnType,
      hasPhoto: !!photo,
      hasSignature: !!customerSignature,
      customerName,
      collectedBy
    });

    // Validate required fields
    if (!orderId || !items || items.length === 0) {
      console.log('Validation failed: Missing orderId or items');
      return res.status(400).json({
        success: false,
        message: 'Order ID and return items are required'
      });
    }

    if (!photo || !customerSignature || !customerName) {
      console.log('Validation failed: Missing photo, signature, or customer name');
      return res.status(400).json({
        success: false,
        message: 'Photo, customer signature, and customer name are required'
      });
    }

    console.log('Validation passed, starting transaction...');

    // Start transaction
    const mongoose = require('mongoose');
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const createdReturns = [];

      console.log('Processing items:', items);

      // Create return entries for each item
      for (const item of items) {
        console.log('Creating return entry for item:', item);
        
        const returnEntry = new Returns({
          originalItemId: item.originalItemId,
          returnedQuantity: item.returnedQuantity,
          reason: item.reason,
          status: 'Available for reuse',
          returnType: returnType || 'doctor',
          returnOrder: orderId,
          doctorId: doctorId,
          doctorName: doctorName,
          hospitalName: hospitalName,
          createdBy: collectedBy,
          // Add collection metadata
          collectionMetadata: {
            photo: photo,
            customerSignature: customerSignature,
            customerName: customerName,
            notes: notes,
            collectedBy: collectedBy,
            collectionDate: collectionDate ? new Date(collectionDate) : new Date()
          }
        });

        console.log('Saving return entry...');
        await returnEntry.save({ session });
        console.log('Return entry saved successfully');
        createdReturns.push(returnEntry);
      }

      // Commit transaction
      await session.commitTransaction();
      session.endSession();

      console.log(`Successfully created ${createdReturns.length} return entries for order ${orderId}`);

      return res.status(201).json({
        success: true,
        message: `Successfully collected ${createdReturns.length} return items from order ${orderId}`,
        result: {
          orderId,
          returnsCreated: createdReturns.length,
          returnIds: createdReturns.map(r => r._id)
        }
      });

    } catch (error) {
      // Rollback transaction on error
      console.error('Transaction error during return collection:', error);
      console.error('Error stack:', error.stack);
      await session.abortTransaction();
      session.endSession();
      throw error;
    }

  } catch (error) {
    console.error('Error collecting returns:', error);
    console.error('Error stack:', error.stack);
    return res.status(500).json({
      success: false,
      message: 'Error processing return collection',
      error: error.message
    });
  }
};

module.exports = {
  list,
  create,
  markAsUsed,
  collectReturns
}