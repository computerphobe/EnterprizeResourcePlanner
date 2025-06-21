const authenticateToken = require('@/middleware/authMiddleware');
const roleMiddleware = require('@/middleware/roleMiddleware');

const authAccountant = [
  authenticateToken,
  roleMiddleware(['owner', 'admin', 'accountant']),
];

module.exports = authAccountant;
