const jwt = require('jsonwebtoken');

const roleMiddleware = (roles) => {
  return (req, res, next) => {
    const authHeader = req.headers['authorization'];

    if (!authHeader) {
      console.log('🚫 No Authorization header provided');
      return res.status(401).json({
        success: false,
        result: null,
        message: 'Unauthorized: No Authorization header provided',
      });
    }

    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;

    if (!token) {
      console.log('🚫 Bearer token missing');
      return res.status(401).json({
        success: false,
        result: null,
        message: 'Unauthorized: Bearer token missing',
      });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;

      console.log('✅ Decoded user:', req.user);
      console.log('👤 Role of the user:', req.user.role);

      if (!roles.includes(req.user.role)) {
        console.log('⛔ User role not permitted:', req.user.role);
        return res.status(403).json({
          success: false,
          result: null,
          message: 'Forbidden: Insufficient role',
        });
      }

      next();
    } catch (error) {
      console.log('❌ Token validation error:', error.message);
      return res.status(401).json({
        success: false,
        result: null,
        message: 'Unauthorized: Invalid or expired token',
      });
    }
  };
};

module.exports = roleMiddleware;
