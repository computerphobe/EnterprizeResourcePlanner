// Debug middleware to decode and log JWT tokens
const jwt = require('jsonwebtoken');

const debugToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  console.log('=== TOKEN DEBUG ===');
  console.log('1. Auth Header:', authHeader);
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    console.log('2. Token extracted:', token);
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('3. Decoded token:', JSON.stringify(decoded, null, 2));
      
      // Add to request for next middleware
      req.user = decoded;
      req.tokenDebug = {
        token,
        decoded,
        role: decoded.role,
        roleType: typeof decoded.role
      };
      
    } catch (error) {
      console.log('4. Token decode error:', error.message);
    }
  } else {
    console.log('2. No valid Bearer token found');
  }
  
  console.log('=== END TOKEN DEBUG ===');
  next();
};

module.exports = debugToken;
