const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Delivery = require('../models/appModels/Delivery');
const verifyDeliverer = require('../middlewares/verifyDeliverer');
const upload = require('../middleware/uploadMiddleware');
const deliveryController = require('../controllers/deliveryController');

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// GET /api/deliveries/pickup – Deliveries ready for pickup
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

// POST /api/deliveries/:id/pickup – Confirm pickup with photo
router.post(
  '/:id/pickup',
  verifyDeliverer,
  (req, res, next) => {
    upload.single('photo')(req, res, (err) => {
      if (err) {
        console.error('Multer error:', err);
        return res.status(400).json({ error: 'File upload failed' });
      }
      next();
    });
  },
  async (req, res) => {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
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

      if (!req.file) {
        return res.status(400).json({ error: 'Photo is required for pickup confirmation' });
      }

      delivery.status = 'picked_up';
      delivery.pickupPhoto = req.file.path.replace(/\\/g, '/');
      delivery.pickupDetails = {
        pickupConfirmed: true,
        pickupTime: new Date(),
      };

      await delivery.save();

      res.status(200).json({ message: 'Pickup confirmed successfully', delivery });
    } catch (err) {
      console.error('Error confirming pickup:', err);
      res.status(500).json({ error: 'Failed to confirm pickup' });
    }
  }
);


// GET /api/deliveries/pending-delivery – Picked up but not delivered
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
    });
  },
  async (req, res) => {
    const { id } = req.params;
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
  }
);

// GET /api/deliveries/history – Completed deliveries
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

// GET /api/deliveries/current – Active deliveries (pending, picked_up, assigned)
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

// GET /api/deliveries/stats – Delivery stats grouped by status
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
