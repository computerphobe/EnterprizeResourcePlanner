const express = require('express');
const router = express.Router();
const Delivery = require('../models/Delivery');
const { authenticateDeliverer } = require('../middleware/auth');

// GET /deliveries/current
router.get('/current', authenticateDeliverer, async (req, res) => {
  try {
    const deliveries = await Delivery.find({
      assignedTo: req.user._id,
      status: { $in: ['pending', 'picked-up'] }
    });
    res.status(200).json(deliveries);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch current deliveries' });
  }
});

// POST /deliveries/:id/pickup
router.post('/:id/pickup', authenticateDeliverer, async (req, res) => {
  try {
    const delivery = await Delivery.findOne({
      _id: req.params.id,
      assignedTo: req.user._id
    });

    if (!delivery) {
      return res.status(404).json({ error: 'Delivery not found or unauthorized' });
    }

    delivery.status = 'picked-up';
    delivery.updatedAt = new Date();
    await delivery.save();

    res.status(200).json({ message: 'Pickup confirmed', delivery });
  } catch (err) {
    res.status(500).json({ error: 'Failed to confirm pickup' });
  }
});

module.exports = router;
