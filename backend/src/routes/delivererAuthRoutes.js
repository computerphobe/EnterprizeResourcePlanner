const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Directly import model modules to ensure they are registered
const Deliverer = require('../models/appModels/Delivery');
const DelivererPassword = require('../models/appModels/DelivererPassword');

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password required' });
    }

    const deliverer = await Deliverer.findOne({ email, removed: false });
    if (!deliverer) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const delivererPassword = await DelivererPassword.findOne({ user: deliverer._id, removed: false });
    if (!delivererPassword) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const validPass = await bcrypt.compare(password, delivererPassword.passwordHash);
    if (!validPass) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: deliverer._id },
      process.env.DELIVERER_JWT_SECRET || process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Store token in loggedSessions array (avoid duplicates)
    if (!delivererPassword.loggedSessions) delivererPassword.loggedSessions = [];
    if (!delivererPassword.loggedSessions.includes(token)) {
      delivererPassword.loggedSessions.push(token);
      await delivererPassword.save();
    }

    return res.json({ success: true, token });
  } catch (err) {
    console.error('Deliverer login error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
