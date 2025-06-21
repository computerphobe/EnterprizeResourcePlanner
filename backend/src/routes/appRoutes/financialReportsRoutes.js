const express = require('express');
const router = express.Router();

// Import the controller
const { getSummaryStats } = require('../../controllers/appControllers/financialReportsController');

// Import accountant auth middleware (array of middlewares)
const verifyAccountant = require('../../controllers/middlewaresControllers/createAuthMiddleware/authAccountant');

// ✅ Confirm route file is loaded
console.log('✅ financialReportsRoutes.js loaded');

// ✅ Debug test route to verify this file is mounted
router.get('/test', (req, res) => {
  res.status(200).send('✅ Financial Reports Test Route Working');
});

// ✅ Main summary route with accountant auth middleware
router.get('/summary', ...verifyAccountant, async (req, res, next) => {
  try {
    await getSummaryStats(req, res);
  } catch (error) {
    console.error('❌ Error in /summary route:', error);
    next(error);
  }
});

module.exports = router;
