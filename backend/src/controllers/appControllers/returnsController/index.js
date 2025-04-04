const Returns = require('@/models/appModels/Returns');
const Inventory = require('@/models/appModels/Inventory');
console.log('loaded returns controller')

// List all returns
exports.list = async (req, res) => {
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
      updatedAt: item.updatedAt
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
exports.create = async (req, res) => {
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
exports.markAsUsed = async (req, res) => {
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
