const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Delivery = require('../models/appModels/Delivery');
const verifyDeliverer = require('../middlewares/verifyDeliverer');
const upload = require('../middleware/uploadMiddleware');
const deliveryController = require('../controllers/deliveryController');

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

<<<<<<< HEAD
// ✅ GET /api/deliveries/test → Test route
router.get('/test', (req, res) => {
  res.send('Delivery routes are working!');
});

// ✅ GET /api/deliveries/pickup → Orders pending pickup
=======
// GET /api/deliveries/pickup – Deliveries ready for pickup
>>>>>>> 7927203b67c09f54d1a491b31a2b02557c49d043
router.get('/pickup', verifyDeliverer, async (req, res) => {
  try {
    const deliveries = await Delivery.find({
      assignedTo: req.deliverer._id,
      status: 'pending',
    });
    res.status(200).json(deliveries);
  } catch (err) {
    console.error('Error fetching pickup deliveries:', err);
    res.status(500).json({ error: 'Failed to fetch pickup deliveries' });
  }
});

<<<<<<< HEAD
// PATCH /api/deliveries/:id/item-return → Update returnAmount for single item
router.patch('/:id/item-return', verifyDeliverer, async (req, res) => {
=======
// POST /api/deliveries/:id/pickup – Confirm pickup
router.post('/:id/pickup', verifyDeliverer, async (req, res) => {
>>>>>>> 7927203b67c09f54d1a491b31a2b02557c49d043
  const { id } = req.params;
  const { itemName, returnAmount } = req.body;

  if (!isValidObjectId(id)) {
    return res.status(400).json({ error: 'Invalid delivery ID' });
  }
  if (!itemName || typeof returnAmount !== 'number' || returnAmount < 0) {
    return res.status(400).json({ error: 'Invalid itemName or returnAmount' });
  }

  try {
    const delivery = await Delivery.findOne({
      _id: id,
      assignedTo: req.deliverer._id,
      status: 'pending',
    });

    if (!delivery) {
      return res.status(404).json({ error: 'Delivery not found or unauthorized' });
    }

    let itemFound = false;
    delivery.items = delivery.items.map(item => {
      if (item.name === itemName) {
        item.returnAmount = returnAmount;
        itemFound = true;
      }
      return item;
    });

    if (!itemFound) {
      return res.status(404).json({ error: 'Item not found in delivery' });
    }

    await delivery.save();
    res.status(200).json({ message: 'Return amount updated successfully' });
  } catch (err) {
    console.error('Error updating return amount:', err.message, err.stack);
    res.status(500).json({ error: 'Failed to update return amount', details: err.message });
  }
});

// POST /api/deliveries/:id/pickup-confirm → Confirm pickup
router.post('/:id/pickup-confirm', verifyDeliverer, async (req, res) => {
  const { id } = req.params;
  const { returnItems } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'Invalid delivery ID' });
  }

  try {
    const delivery = await Delivery.findOne({
      _id: id,
      assignedTo: req.deliverer._id,
      status: 'pending',
    });

    if (!delivery) {
      return res.status(404).json({ error: 'Delivery not found or unauthorized' });
    }

    console.log("🟡 Return items received:", returnItems);
    console.log("🟡 Before update:", delivery.items.map(i => ({
      id: i._id.toString(),
      name: i.name,
      returnAmount: i.returnAmount
    })));

    // ✅ Update returnAmount inside each item
    if (Array.isArray(returnItems)) {
      for (let item of delivery.items) {
        const matched = returnItems.find(i => i.itemId === item._id.toString());
        if (matched) {
          item.returnAmount = matched.returnAmount;
        }
      }
    }

    // ✅ Mark as picked-up
    delivery.status = 'picked_up';
    delivery.pickupDetails = {
      pickupConfirmed: true,
<<<<<<< HEAD
      pickupTime: new Date(),
=======
      pickupTime: new Date()
>>>>>>> 7927203b67c09f54d1a491b31a2b02557c49d043
    };

    await delivery.save();
    res.status(200).json({ message: 'Pickup confirmed', delivery });
  } catch (error) {
    console.error('Error confirming pickup:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

<<<<<<< HEAD
// ✅ GET /api/deliveries/pending-delivery → Picked up but not delivered
=======
// GET /api/deliveries/pending-delivery – Picked up but not delivered
>>>>>>> 7927203b67c09f54d1a491b31a2b02557c49d043
router.get('/pending-delivery', verifyDeliverer, async (req, res) => {
  try {
    const deliveries = await Delivery.find({
      assignedTo: req.deliverer._id,
      status: 'picked_up',
    });
    res.status(200).json(deliveries);
  } catch (err) {
    console.error('Error fetching pending deliveries:', err);
    res.status(500).json({ error: 'Failed to fetch pending deliveries' });
  }
});

<<<<<<< HEAD
// ✅ POST /api/deliveries/:id/deliver → Confirm delivery
router.post('/:id/deliver', verifyDeliverer, async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    return res.status(400).json({ error: 'Invalid delivery ID' });
  }

  try {
    const delivery = await Delivery.findOne({
      _id: id,
      assignedTo: req.deliverer._id,
      status: 'picked_up',
=======
// POST /api/deliveries/:id/deliver – Confirm delivery with photo upload
router.post(
  '/:id/deliver',
  verifyDeliverer,
  (req, res, next) => {
    upload.single('photo')(req, res, (err) => {
      if (err) {
        console.error('Multer upload error:', err);
        return res.status(400).json({ error: err.message });
      }
      next();
>>>>>>> 7927203b67c09f54d1a491b31a2b02557c49d043
    });
  },
  async (req, res) => {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: 'Invalid delivery ID' });
    }

<<<<<<< HEAD
    delivery.status = 'delivered';
    delivery.deliveryDetails = {
      deliveryConfirmed: true,
      deliveryTime: new Date(),
    };
    delivery.deliveredAt = new Date();

    await delivery.save();

    res.status(200).json({ message: 'Delivery confirmed successfully', delivery });
  } catch (err) {
    console.error('Error confirming delivery:', err);
    res.status(500).json({ error: 'Failed to confirm delivery' });
=======
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
      delivery.deliveryDetails = {
        deliveryConfirmed: true,
        deliveryTime: new Date()
      };
      delivery.deliveryPhoto = req.file.path.replace(/\\/g, '/');
      delivery.deliveredAt = new Date();

      await delivery.save();
      res.status(200).json({ message: 'Delivery confirmed with photo', delivery });
    } catch (err) {
      console.error('Delivery confirmation error:', err);
      res.status(500).json({ error: 'Failed to confirm delivery' });
    }
>>>>>>> 7927203b67c09f54d1a491b31a2b02557c49d043
  }
);

<<<<<<< HEAD
// ✅ GET /api/deliveries/history → Past deliveries
=======
// GET /api/deliveries/history – Completed deliveries
>>>>>>> 7927203b67c09f54d1a491b31a2b02557c49d043
router.get('/history', verifyDeliverer, async (req, res) => {
  try {
    const deliveries = await Delivery.find({
      assignedTo: req.deliverer._id,
      status: 'delivered',
    }).sort({ 'deliveryDetails.deliveryTime': -1 });
    res.status(200).json(deliveries);
  } catch (err) {
    console.error('Error fetching delivery history:', err);
    res.status(500).json({ error: 'Failed to fetch delivery history' });
  }
});

<<<<<<< HEAD
// ✅ GET /api/deliveries/current → All active orders
=======
// GET /api/deliveries/current – Active deliveries (pending, picked_up, assigned)
>>>>>>> 7927203b67c09f54d1a491b31a2b02557c49d043
router.get('/current', verifyDeliverer, async (req, res) => {
  try {
    const deliveries = await Delivery.find({
      assignedTo: req.deliverer._id,
      status: { $in: ['pending', 'picked_up', 'assigned'] },
    }).sort({ createdAt: -1 });
    res.status(200).json(deliveries);
  } catch (err) {
    console.error('Error fetching current deliveries:', err);
    res.status(500).json({ error: 'Failed to fetch current deliveries' });
  }
});

<<<<<<< HEAD
// ✅ GET /api/deliveries/stats → Aggregated delivery stats
=======
// GET /api/deliveries/stats – Delivery stats grouped by status
>>>>>>> 7927203b67c09f54d1a491b31a2b02557c49d043
router.get('/stats', verifyDeliverer, async (req, res) => {
  try {
    const stats = await Delivery.aggregate([
      { $match: { assignedTo: req.deliverer._id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);
    res.status(200).json(stats);
  } catch (err) {
    console.error('Error fetching delivery stats:', err);
    res.status(500).json({ error: 'Failed to fetch delivery stats' });
  }
});

// ✅ NEW: GET /api/deliveries/dashboard-stats – Dashboard summary stats
router.get('/dashboard-stats', verifyDeliverer, deliveryController.getDashboardStats);

module.exports = router;
