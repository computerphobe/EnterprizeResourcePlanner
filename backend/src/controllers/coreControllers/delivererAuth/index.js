const jwt = require('jsonwebtoken');

// Import models directly to avoid MissingSchemaError
const Deliverer = require('../../../models/appModels/Deliverer');
const DelivererPassword = require('../../../models/appModels/DelivererPassword');

const isValidAuthToken = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers['authorization'];
    console.log('🧪 Authorization Header:', authHeader);

    const token = authHeader && authHeader.startsWith('Bearer ')
      ? authHeader.split(' ')[1]
      : null;

    if (!token) {
      console.warn('❌ No token provided');
      return res.status(401).json({
        success: false,
        message: 'No authentication token, authorization denied.',
        jwtExpired: true,
      });
    }

    // Verify token
    let verified;
    try {
      verified = jwt.verify(token, process.env.DELIVERER_JWT_SECRET || process.env.JWT_SECRET);
      console.log('🧩 Decoded Token:', verified);
    } catch (verifyErr) {
      console.warn('❌ Token verification failed:', verifyErr.message);
      return res.status(401).json({
        success: false,
        message: 'Token verification failed, authorization denied.',
        jwtExpired: true,
      });
    }

    // Fetch deliverer and password record
    const [deliverer, delivererPassword] = await Promise.all([
      Deliverer.findOne({ _id: verified.id, removed: false }),
      DelivererPassword.findOne({ user: verified.id, removed: false }),
    ]);

    if (!deliverer) {
      console.warn('❌ Deliverer not found in database');
      return res.status(401).json({
        success: false,
        message: "Deliverer doesn't exist, authorization denied.",
        jwtExpired: true,
      });
    }

    if (!delivererPassword) {
      console.warn('❌ DelivererPassword not found');
      return res.status(401).json({
        success: false,
        message: 'Password record not found, authorization denied.',
        jwtExpired: true,
      });
    }

    // Debugging logs for session validation
    console.log('🔐 Token from header:', token);
    console.log('📚 Stored sessions:', delivererPassword.loggedSessions);

    if (!delivererPassword.loggedSessions.includes(token)) {
      console.warn('❌ Token not in loggedSessions (session expired or user logged out)');
      return res.status(401).json({
        success: false,
        message: 'Session expired or logged out, authorization denied.',
        jwtExpired: true,
      });
    }

    // ✅ Fix: Attach deliverer to both req.deliverer and req.user
    req.deliverer = deliverer;
    req.user = deliverer; // 🔥 This makes req.user._id available in routes

    console.log('✅ Deliverer authenticated:', deliverer._id);
    next();

  } catch (error) {
    console.error('🔥 Unexpected error in isValidAuthToken:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during authentication.',
      error: error.message,
      jwtExpired: true,
    });
  }
};

module.exports = { isValidAuthToken };
