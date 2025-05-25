const jwt = require('jsonwebtoken');

const verifyDeliverer = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authorization header missing or malformed' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.deliverer = decoded;

    if (!req.deliverer._id) {
      return res.status(403).json({ message: 'Invalid token payload: _id missing' });
    }

    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token is invalid or expired' });
  }
};

module.exports = verifyDeliverer;
