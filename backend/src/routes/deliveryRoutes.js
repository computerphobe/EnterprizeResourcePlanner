const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

const Delivery = require('../models/appModels/Delivery');
const verifyDeliverer = require('../middlewares/verifyDeliverer'); // NEW middleware import

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// GET /api/deliveries/current
router.get('/current', verifyDeliverer, async (req, res) => {
  try {
    const deliveries = await Delivery.find({
      assignedTo: req.deliverer._id,
      status: { $in: ['pending', 'picked_up'] },
    });

    res.status(200).json(deliveries);
  } catch (err) {
    console.error('Error fetching current deliveries:', err);
    res.status(500).json({ error: 'Failed to fetch current deliveries' });
  }
});

// POST /api/deliveries/:id/pickup
router.post('/:id/pickup', verifyDeliverer, async (req, res) => {
  const { id } = req.params;
  if (!isValidObjectId(id)) {
    return res.status(400).json({ error: 'Invalid delivery ID' });
  }

  try {
    const delivery = await Delivery.findOne({
      _id: id,
      assignedTo: req.deliverer._id,
    });

    if (!delivery) {
      return res.status(404).json({ error: 'Delivery not found or unauthorized' });
    }

    delivery.status = 'picked_up';
    delivery.pickupDetails.pickupConfirmed = true;
    delivery.pickupDetails.pickupTime = new Date();

    await delivery.save();
    res.status(200).json({ message: 'Pickup confirmed', delivery });
  } catch (err) {
    console.error('Pickup error:', err);
    res.status(500).json({ error: 'Failed to confirm pickup' });
  }
});

// POST /api/deliveries/:id/deliver
router.post('/:id/deliver', verifyDeliverer, async (req, res) => {
  const { id } = req.params;
  if (!isValidObjectId(id)) {
    return res.status(400).json({ error: 'Invalid delivery ID' });
  }

  try {
    const delivery = await Delivery.findOne({
      _id: id,
      assignedTo: req.deliverer._id,
    });

    if (!delivery) {
      return res.status(404).json({ error: 'Delivery not found or unauthorized' });
    }

    delivery.status = 'delivered';
    delivery.deliveryDetails.deliveryConfirmed = true;
    delivery.deliveryDetails.deliveryTime = new Date();

    await delivery.save();
    res.status(200).json({ message: 'Delivery confirmed', delivery });
  } catch (err) {
    console.error('Delivery error:', err);
    res.status(500).json({ error: 'Failed to confirm delivery' });
  }
});

// GET /api/deliveries/stats
router.get('/stats', verifyDeliverer, async (req, res) => {
  try {
    const userId = req.deliverer._id;

    const stats = await Delivery.aggregate([
      { $match: { assignedTo: userId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    res.status(200).json(stats);
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ error: 'Failed to fetch delivery stats' });
  }
});

module.exports = router;
