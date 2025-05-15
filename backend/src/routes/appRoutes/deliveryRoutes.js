const express = require('express');
const router = express.Router();
const Delivery = require('../../models/Delivery');
const { verifyToken, checkRole } = require('../../middlewares/roleMiddleware');

// Get current deliveries assigned to logged-in deliverer
router.get('/deliveries/current', verifyToken, checkRole('deliverer'), async (req, res) => {
  try {
    const deliveries = await Delivery.find({
      assignedTo: req.userId,
      status: { $in: ['pending', 'pickedUp'] }, // only current deliveries
    });
    res.json({ success: true, deliveries });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Confirm pickup of a delivery
router.post('/deliveries/:id/pickup', verifyToken, checkRole('deliverer'), async (req, res) => {
  try {
    const delivery = await Delivery.findById(req.params.id);

    if (!delivery) {
      return res.status(404).json({ success: false, message: 'Delivery not found' });
    }

    if (delivery.assignedTo.toString() !== req.userId) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this delivery' });
    }

    delivery.status = 'pickedUp';
    delivery.updatedAt = new Date();
    await delivery.save();

    res.json({ success: true, message: 'Pickup confirmed', delivery });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
