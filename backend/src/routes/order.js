const express = require('express');
const router = express.Router();
const Order = require('../models/Order');

// Get all orders
router.get('/', async (req, res) => {
  try {
    const orders = await Order.find();
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update return quantities of items in an order
router.patch('/:id/return-quantities', async (req, res) => {
  try {
    const { returnQuantities } = req.body; 
    // returnQuantities is expected to be an array of { itemId, returnQuantity }

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    // Update returnQuantity for each item
    returnQuantities.forEach(({ itemId, returnQuantity }) => {
      const item = order.items.id(itemId);
      if (item) {
        item.returnQuantity = returnQuantity;
      }
    });

    await order.save();
    res.json(order);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Confirm pickup
router.patch('/:id/confirm-pickup', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    order.pickupConfirmed = true;
    await order.save();
    res.json(order);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
