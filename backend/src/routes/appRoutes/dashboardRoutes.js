const express = require('express');
const { catchErrors } = require('@/handlers/errorHandlers');
const router = express.Router();

const { dashboardController } = require('@/controllers/appControllers');

// Dashboard routes
router.route('/dashboard').get(catchErrors(dashboardController.getDashboard));
router.route('/dashboard/stats').get(catchErrors(dashboardController.getStats));
router.route('/dashboard/recent-activities').get(catchErrors(dashboardController.getRecentActivities));

module.exports = router;
