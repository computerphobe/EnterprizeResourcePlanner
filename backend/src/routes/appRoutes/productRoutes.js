const express = require('express');
const router = express.Router();

// Middleware
const authenticateToken = require('@/middleware/authMiddleware');
const roleMiddleware = require('@/middleware/roleMiddleware');

// Controller
const controller = require('@/controllers/appControllers/inventoryController');

// Error handler wrapper
const { catchErrors } = require('@/handlers/errorHandlers');

// Apply authentication to all routes
router.use(authenticateToken);

// Inventory CRUD routes - Admin/Owner access
router.post('/create', 
    roleMiddleware(['owner', 'admin', 'accountant']), 
    catchErrors(controller.create)
);

router.get('/read/:id', 
    roleMiddleware(['owner', 'admin', 'accountant', 'doctor', 'hospital']), 
    catchErrors(controller.read)
);

router.patch('/update/:id', 
    roleMiddleware(['owner', 'admin', 'accountant']), 
    catchErrors(controller.update)
);

router.delete('/delete/:id', 
    roleMiddleware(['owner', 'admin']), 
    catchErrors(controller.delete)
);

router.get('/list', 
    roleMiddleware(['owner', 'admin', 'accountant', 'doctor', 'hospital', 'deliverer']), 
    catchErrors(controller.list)
);

router.get('/listAll', 
    roleMiddleware(['owner', 'admin', 'accountant', 'doctor', 'hospital']), 
    catchErrors(controller.listAll)
);

// Search and filter routes
router.get('/search', 
    roleMiddleware(['owner', 'admin', 'accountant', 'doctor', 'hospital']), 
    catchErrors(controller.search)
);

router.get('/filter', 
    roleMiddleware(['owner', 'admin', 'accountant', 'doctor', 'hospital']), 
    catchErrors(controller.filter)
);

// Summary/dashboard route
router.get('/summary', 
    roleMiddleware(['owner', 'admin', 'accountant']), 
    catchErrors(controller.summary)
);

// Simple summary for debugging
router.get('/summarySimple', 
    roleMiddleware(['owner', 'admin', 'accountant']), 
    catchErrors(controller.summarySimple)
);

// Stock management routes
router.patch('/updateStock/:id', 
    roleMiddleware(['owner', 'admin', 'accountant']), 
    catchErrors(controller.updateStock)
);

router.get('/lowStock', 
    roleMiddleware(['owner', 'admin', 'accountant']), 
    catchErrors(controller.getLowStock)
);

// Legacy routes for backward compatibility
router.get('/searchByCode', 
    roleMiddleware(['owner', 'admin', 'accountant', 'doctor', 'hospital']), 
    catchErrors(controller.searchByCode)
);

router.get('/filterByCategory', 
    roleMiddleware(['owner', 'admin', 'accountant', 'doctor', 'hospital']), 
    catchErrors(controller.filterByCategory)
);

// Test route
router.get('/test', 
    roleMiddleware(['owner', 'admin', 'accountant']), 
    catchErrors(controller.test)
);

// Simple create route for debugging
router.post('/createSimple', 
    roleMiddleware(['owner', 'admin', 'accountant']), 
    catchErrors(controller.createSimple)
);

module.exports = router;
