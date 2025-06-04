const Order = require('@/models/appModels/Order');
const Admin = require('@/models/coreModels/Admin');
const mongoose = require('mongoose')
console.log("order controller loaded")
const delivererOrders = async ( req, res ) => {
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
}

const ownerOrders = async (req, res) => {
  console.log('getOrdersForOwner endpoint hit');
  try {
    const orders = await Order.find({})
      .sort({ createdAt: -1 })
      .populate({
        path: 'doctorId',
        match: { _id: { $ne: null } },  // only populate if not null
        select: 'name role email'        // specify needed fields
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
      
      if (!item.purchaseType || !['buy', 'rent'].includes(item.purchaseType)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid purchase type. Must be either "buy" or "rent"'
        });
      }
    }

    // Create the order
    const order = new Order({
      items,
      totalAmount: totalAmount || 0,
      status: 'pending',
      orderType: 'doctor',
      doctorId: hospitalId,
      doctorName: req.user.name,
      hospitalName: req.user.hospitalName,
      createdBy: hospitalId
    });

    await order.save();
    console.log('Hospital order created:', order);
    res.json({ success: true, result: order });
  } catch (error) {
    console.error('Error creating hospital order:', error);
    res.status(500).json({ success: false, message: error.message || 'Internal server error' });
  }
};

module.exports = {
  assignDeliverer,
  delivererOrders,
  ownerOrders,
  hospitalOrders,
  createHospitalOrder
};
