const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  console.log('🛡️ Received Authorization Header:', authHeader);

  if (!authHeader) {
    console.log('❌ No Authorization header found');
    return res.status(403).json({ message: 'No token provided' });
  }

  const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    console.log('❌ Token missing after split');
    return res.status(403).json({ message: 'Token format invalid' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      console.log('❌ JWT verification failed:', err.message);
      return res.status(403).json({ message: 'Invalid or expired token' });
    }

    console.log('✅ Token verified. User payload:', user);
    req.user = user;
    next();
  });
};

module.exports = authenticateToken;
