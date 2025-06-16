const Delivery = require('@/models/appModels/Delivery');
const mongoose = require('mongoose');
console.log('Delivery controller initialized');
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);


// POST /api/deliveries/:id/pickup – Confirm pickup
const confirmPickup = async (req, res) => {
  const { id } = req.params;
  console.log("Pickup confirmation initiated for delivery ID:", id);
  if (!isValidObjectId(id)) {
    return res.status(400).json({ error: 'Invalid delivery ID' });
  }

  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Unauthorized: Missing user information' });
    }

    const delivererId = req.user.id;
    const deliveryId = req.params.id;
    const { returnItems } = req.body;

    if (!isValidObjectId(deliveryId)) {
      return res.status(400).json({ message: 'Invalid delivery ID' });
    }

    const delivery = await Delivery.findOne({
      _id: deliveryId,
      assignedTo: req.deliverer._id,
      status: 'pending',
    });

    if (!delivery) {
      return res.status(404).json({ error: 'Delivery not found or unauthorized' });
    }

    // Update delivery status and pickup time
    delivery.status = 'picked_up';
    delivery.pickupDetails = {
      pickupConfirmed: true,
      pickupTime: new Date(),
    };

    // Save returnItems if provided and valid
    if (returnItems && Array.isArray(returnItems)) {
      delivery.returnItems = returnItems;
    }

    await delivery.save();
    res.status(200).json({ message: 'Pickup confirmed', delivery });
  } catch (error) {
    console.error('Error confirming pickup:', error);
    res.status(500).json({ error: 'Failed to confirm pickup' });
  }
};

// POST /api/deliveries/:id/deliver – Confirm delivery with photo
const confirmDelivery = async (req, res) => {
  const { id } = req.params;
  console.log("Delivery confirmation initiated for delivery ID:", id);
  if (!isValidObjectId(id)) {
    return res.status(400).json({ error: 'Invalid delivery ID' });
  }

  try {
    const delivery = await Delivery.findOne({
      _id: id,
      assignedTo: req.deliverer._id,
      status: 'picked_up',
    });

    if (!delivery) {
      return res.status(404).json({ error: 'Delivery not found or unauthorized' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Delivery photo is required' });
    }

    delivery.status = 'delivered';
    delivery.deliveredAt = new Date();
    delivery.deliveryDetails = {
      deliveryConfirmed: true,
      deliveryTime: new Date(),
    };
    delivery.deliveryPhoto = req.file.path.replace(/\\/g, '/');

    await delivery.save();
    res.status(200).json({ message: 'Delivery confirmed with photo', delivery });
  } catch (error) {
    console.error('Error confirming delivery:', error);
    res.status(500).json({ error: 'Failed to confirm delivery' });
  }
};

// GET /api/deliveries/history – Completed deliveries
const getDeliveryHistory = async (req, res) => {
  try {
    const deliveries = await Delivery.find({
      assignedTo: req.deliverer._id,
      status: 'delivered',
    }).sort({ 'deliveryDetails.deliveryTime': -1 });

    res.status(200).json(deliveries);
  } catch (error) {
    console.error('Error fetching delivery history:', error);
    res.status(500).json({ error: 'Failed to fetch delivery history' });
  }
};

// GET /api/deliveries/dashboard-stats – Dashboard summary stats
const getDashboardStats = async (req, res) => {
  try {
    const delivererId = req.deliverer._id;

    const total = await Delivery.countDocuments({ assignedTo: delivererId });
    const pending = await Delivery.countDocuments({ assignedTo: delivererId, status: 'pending' });
    const pickedUp = await Delivery.countDocuments({ assignedTo: delivererId, status: 'picked_up' });
    const delivered = await Delivery.countDocuments({ assignedTo: delivererId, status: 'delivered' });

    res.status(200).json({
      totalDeliveries: total,
      pending,
      pickedUp,
      delivered,
    });
  } catch (error) {
    console.error('Error in getDashboardStats:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
};

module.exports = {
  confirmPickup,
  confirmDelivery,
  getDeliveryHistory,
  getDashboardStats,
};
