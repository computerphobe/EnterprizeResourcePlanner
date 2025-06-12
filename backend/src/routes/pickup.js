const express = require('express');
const router = express.Router();
const Order = require('./models/appModels/pickup');

// GET /api/orders/for-pickup
router.get('/for-pickup', async (req, res) => {
  try {
    const orders = await Order.find({ pickupConfirmed: false });
    res.json(pickups);
  } catch (err) {
    console.error('Error fetching orders:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
