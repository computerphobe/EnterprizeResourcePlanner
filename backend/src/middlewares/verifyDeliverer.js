const jwt = require('jsonwebtoken');
const mongoose = require('mongoose'); 

const verifyDeliverer = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authorization header missing or malformed' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded JWT:', decoded);

    if (decoded.role !== 'deliverer') {
      return res.status(403).json({ message: 'Access denied: Not a deliverer' });
    }

    if (!decoded.id) {
      return res.status(400).json({ message: 'Invalid token payload: missing ID' });
    }

    req.deliverer = {
      _id: decoded.id,
      email: decoded.email || '',
    };
    console.log('Deliverer attached to request:', req.deliverer);

    next();
  } catch (err) {
    console.error('Token verification failed:', err);
    return res.status(401).json({ message: 'Token is invalid or expired' });
  }
};

module.exports = verifyDeliverer;
