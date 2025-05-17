const jwt = require('jsonwebtoken');

const roleMiddleware = (roles) => {
  return (req, res, next) => {
    // Extract token from Authorization header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    // Check if token is missing
    if (!token) {
      return res.status(401).json({
        success: false,
        result: null,
        message: 'Unauthorized: No token provided'
      });
    }

    try {
      // Verify and decode the JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Attach decoded user data to the request object
      req.user = decoded;
      console.log('Decoded user:', req.user);
      // Check if the user's role matches one of the allowed roles
      if (!roles.includes(req.user.role)) {

        return res.status(403).json({
          success: false,
          result: null,
          message: 'Forbidden: Insufficient role'
        });
      }

      // Continue to the next middleware or route handler
      next();
    } catch (error) {
      // Handle errors related to JWT verification (invalid or expired token)
      return res.status(401).json({
        success: false,
        result: null,
        message: 'Unauthorized: Invalid or expired token'
      });
    }
  };
};

module.exports = roleMiddleware;
