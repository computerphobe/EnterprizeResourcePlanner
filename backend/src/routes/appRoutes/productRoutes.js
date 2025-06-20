const express = require('express');
const router = express.Router();

// Middleware
const authenticateToken = require('@/middleware/authMiddleware');
const roleMiddleware = require('@/middleware/roleMiddleware');

// Controller
const controller = require('@/controllers/appControllers/inventoryController');

// Error handler wrapper
const { catchErrors } = require('@/handlers/errorHandlers');

// Only allow admin to access these routes
router.use(authenticateToken, roleMiddleware(['admin']));

// Inventory routes
router.post('/create', catchErrors(controller.create));         // Add new inventory item
router.get('/read/:id', catchErrors(controller.read));          // Get item by ID
router.patch('/update/:id', catchErrors(controller.update));    // Update item by ID
router.delete('/delete/:id', catchErrors(controller.delete));   // Delete item by ID
router.get('/list', catchErrors(controller.list));              // Get all items
router.get('/search', catchErrors(controller.searchByCode));   // Search by product code
router.get('/filter', catchErrors(controller.filterByCategory)); // Filter by nameAlias/material

module.exports = router;
