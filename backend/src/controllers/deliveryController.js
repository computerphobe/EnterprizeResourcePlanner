const mongoose = require('mongoose');
const Delivery = require('../models/appModels/Delivery');

// Helper to validate MongoDB ObjectId
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// Get current deliveries assigned to logged-in deliverer
exports.getCurrentDeliveries = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Unauthorized: Missing user information' });
    }

    const delivererId = req.user.id;

    const deliveries = await Delivery.find({
      deliverer: delivererId,
      status: { $in: ['assigned', 'picked_up'] },
    }).sort({ createdAt: -1 });

    return res.status(200).json(deliveries);
  } catch (error) {
    console.error('Error getting current deliveries:', error);
    return res.status(500).json({ message: 'Failed to get current deliveries' });
  }
};

// Confirm pickup of a delivery (updated to handle returnItems)
exports.confirmPickup = async (req, res) => {
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
      deliverer: delivererId,
      status: 'assigned',
    });

    if (!delivery) {
      return res.status(404).json({ message: 'Delivery not found or already picked up' });
    }

    // Update delivery status and pickup time
    delivery.status = 'picked_up';
    delivery.pickup_time = new Date();

    // Save returnItems if provided and valid
    if (returnItems && Array.isArray(returnItems)) {
      delivery.returnItems = returnItems;
    }

    await delivery.save();

    return res.status(200).json({ message: 'Pickup confirmed', delivery });
  } catch (error) {
    console.error('Error confirming pickup:', error);
    return res.status(500).json({ message: 'Failed to confirm pickup' });
  }
};

// Confirm delivery completion
exports.confirmDelivery = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Unauthorized: Missing user information' });
    }

    const delivererId = req.user.id;
    const deliveryId = req.params.id;

    if (!isValidObjectId(deliveryId)) {
      return res.status(400).json({ message: 'Invalid delivery ID' });
    }

    const delivery = await Delivery.findOne({
      _id: deliveryId,
      deliverer: delivererId,
      status: 'picked_up',
    });

    if (!delivery) {
      return res.status(404).json({ message: 'Delivery not found or not picked up yet' });
    }

    delivery.status = 'delivered';
    delivery.delivery_time = new Date();

    await delivery.save();

    return res.status(200).json({ message: 'Delivery confirmed', delivery });
  } catch (error) {
    console.error('Error confirming delivery:', error);
    return res.status(500).json({ message: 'Failed to confirm delivery' });
  }
};

// Get delivery history for the deliverer
exports.getDeliveryHistory = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Unauthorized: Missing user information' });
    }

    const delivererId = req.user.id;

    const deliveries = await Delivery.find({
      deliverer: delivererId,
      status: 'delivered',
    }).sort({ delivery_time: -1 });

    return res.status(200).json(deliveries);
  } catch (error) {
    console.error('Error getting delivery history:', error);
    return res.status(500).json({ message: 'Failed to get delivery history' });
  }
};
