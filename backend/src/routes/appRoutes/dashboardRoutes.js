const express = require('express');
const { catchErrors } = require('@/handlers/errorHandlers');
const router = express.Router();

const { dashboardController } = require('@/controllers/appControllers');

// Dashboard routes
router.route('/dashboard').get(catchErrors(dashboardController.getDashboard));
router.route('/dashboard/stats').get(catchErrors(dashboardController.getStats));
router.route('/dashboard/recent-activities').get(catchErrors(dashboardController.getRecentActivities));
router.route('/dashboard/financial-data').get(catchErrors(dashboardController.getFinancialData));

// Ledger entry routes - Note these are mounted directly at the root path because the router itself is mounted at /api
router.route('/dashboard/ledger')
  .get(catchErrors(dashboardController.getLedgerEntries))
  .post(catchErrors(dashboardController.createLedgerEntry));

router.route('/dashboard/ledger/:id')
  .put(catchErrors(dashboardController.updateLedgerEntry))
  .delete(catchErrors(dashboardController.deleteLedgerEntry));

// Add additional explicit routes at different levels in case of URL matching issues
router.route('/ledger')
  .get(catchErrors(dashboardController.getLedgerEntries))
  .post(catchErrors(dashboardController.createLedgerEntry));

router.route('/ledger/:id')
  .put(catchErrors(dashboardController.updateLedgerEntry))
  .delete(catchErrors(dashboardController.deleteLedgerEntry));

// Test endpoint for troubleshooting
router.route('/test/ledger')
  .post((req, res) => {
    try {
      // Log received data
      console.log('Test ledger entry received:', req.body);
      
      // Simulate a successful response
      return res.status(201).json({
        success: true,
        result: {
          _id: 'test_' + Date.now(),
          ...req.body,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        message: 'Test ledger entry created successfully'
      });
    } catch (error) {
      console.error('Error in test ledger route:', error);
      return res.status(500).json({
        success: false,
        message: 'Test endpoint error',
        error: error.message
      });
    }
  });

// Test endpoint for updating ledger entries
router.route('/test/ledger/:id')
  .put((req, res) => {
    try {
      // Log received data
      console.log('Test ledger entry update received for ID:', req.params.id);
      console.log('Update data:', req.body);
      
      // Simulate a successful response
      return res.status(200).json({
        success: true,
        result: {
          _id: req.params.id,
          ...req.body,
          updatedAt: new Date()
        },
        message: 'Test ledger entry updated successfully'
      });
    } catch (error) {
      console.error('Error in test ledger update route:', error);
      return res.status(500).json({
        success: false,
        message: 'Test update endpoint error',
        error: error.message
      });
    }
  });

module.exports = router;
