// controllers/coreControllers/delivererAuth.js
const jwt = require('jsonwebtoken');
const Deliverer = require('../../models/appModels/Deliverer'); // Adjust if your path differs

const isValidAuthToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization token missing or invalid' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // Ensure JWT_SECRET is set in your .env

    const deliverer = await Deliverer.findById(decoded.id);
    if (!deliverer) {
      return res.status(401).json({ error: 'Invalid token: deliverer not found' });
    }

    req.deliverer = deliverer; // ✅ Attach to request
    next();
  } catch (err) {
    console.error('Token verification error:', err);
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

module.exports = { isValidAuthToken };
