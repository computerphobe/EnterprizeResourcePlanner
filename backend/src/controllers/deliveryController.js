const Delivery = require('../models/appModels/Delivery');
const mongoose = require('mongoose');

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// GET /api/deliveries/current – Active deliveries
const getCurrentDeliveries = async (req, res) => {
  try {
    if (!req.deliverer || !req.deliverer._id) {
      return res.status(401).json({ error: 'Unauthorized: Deliverer not authenticated' });
    }

    const deliveries = await Delivery.find({
      assignedTo: req.deliverer._id,
      status: { $in: ['pending', 'picked_up', 'assigned'] },
    }).sort({ createdAt: -1 });

    res.status(200).json(deliveries);
  } catch (error) {
    console.error('Error fetching current deliveries:', error);
    res.status(500).json({ error: 'Failed to fetch current deliveries' });
  }
};

// POST /api/deliveries/:id/pickup – Confirm pickup
const handleConfirmPickup = async () => {
  const formData = new FormData();
  formData.append('orderId', selectedOrder.id);
  formData.append('clientName', selectedOrder.clientName);
  formData.append('address', selectedOrder.address);
  formData.append('items', JSON.stringify(
    selectedOrder.items.map(item => ({
      name: item.name,
      deliveredQty: item.deliveredQty,
      price: item.price,
      returnQty: Number(returnQuantities[item.name] || 0),
    }))
  ));
  if (photoFile) {
    formData.append('photo', photoFile);
  }

  try {
    const res = await fetch('http://localhost:5000/api/pickup/confirm', {
      method: 'POST',
      body: formData,
    });

    const data = await res.json();
    if (res.ok) {
      alert('Pickup confirmed successfully.');
      handleCloseDialog();
    } else {
      console.error(data);
      alert('Failed to confirm pickup.');
    }
  } catch (err) {
    console.error(err);
    alert('Error during pickup confirmation.');
  }
};


// POST /api/deliveries/:id/deliver – Confirm delivery with photo
const confirmDelivery = async (req, res) => {
  const { id } = req.params;

  if (!req.deliverer || !req.deliverer._id) {
    return res.status(401).json({ error: 'Unauthorized: Deliverer not authenticated' });
  }

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
    if (!req.deliverer || !req.deliverer._id) {
      return res.status(401).json({ error: 'Unauthorized: Deliverer not authenticated' });
    }

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
    if (!req.deliverer || !req.deliverer._id) {
      return res.status(401).json({ error: 'Unauthorized: Deliverer not authenticated' });
    }

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
  getCurrentDeliveries,
  handleConfirmPickup,
  confirmDelivery,
  getDeliveryHistory,
  getDashboardStats,
};
