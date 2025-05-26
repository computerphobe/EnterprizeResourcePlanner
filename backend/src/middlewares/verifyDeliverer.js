const jwt = require('jsonwebtoken');

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

    req.deliverer = {
      _id: decoded.id,
      email: decoded.email,
    };

    next();
  } catch (err) {
    console.error('Token verification failed:', err);
    return res.status(401).json({ message: 'Token is invalid or expired' });
  }
};

module.exports = verifyDeliverer;
