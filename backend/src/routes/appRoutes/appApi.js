const express = require('express');
const { catchErrors } = require('@/handlers/errorHandlers');
const router = express.Router();

const appControllers = require('@/controllers/appControllers');
const { routesList } = require('@/models/utils');
// console.log('routesList:', routesList);
const deliveryController = require('@/controllers/appControllers/deliveryController');
const orderController = require('@/controllers/appControllers/orderController');
const ledgerController = require('@/controllers/appControllers/ledgerController');
const expenseController = require('@/controllers/appControllers/expenseController');
const historyController = require('@/controllers/appControllers/historyController');
// Import auth and role middlewares
const authenticateToken = require('@/middleware/authMiddleware');
const roleMiddleware = require('@/middleware/roleMiddleware');

// Financial Reports Routes (imported separately)
const financialReportsRoutes = require('@/routes/appRoutes/financialReportsRoutes');

// --- Dynamic CRUD routes generator ---
const routerApp = (entity, controller) => {
  router.route(`/${entity}/create`).post(catchErrors(controller['create']));
  router.route(`/${entity}/read/:id`).get(catchErrors(controller['read']));
  router.route(`/${entity}/update/:id`).patch(catchErrors(controller['update']));
  router.route(`/${entity}/delete/:id`).delete(catchErrors(controller['delete']));
  router.route(`/${entity}/search`).get(catchErrors(controller['search']));
  router.route(`/${entity}/list`).get(catchErrors(controller['list']));
  router.route(`/${entity}/listAll`).get(catchErrors(controller['listAll']));
  router.route(`/${entity}/filter`).get(catchErrors(controller['filter']));
  router.route(`/${entity}/summary`).get(catchErrors(controller['summary']));

  if (entity === 'invoice' || entity === 'quote' || entity === 'payment') {
    router.route(`/${entity}/mail`).post(catchErrors(controller['mail']));
  }
  if (entity === 'quote') {
    router.route(`/${entity}/convert/:id`).get(catchErrors(controller['convert']));
  }  if (entity === 'returns') {
    router.route(`/${entity}/markAsUsed`).post(catchErrors(controller['markAsUsed']));
    // collect route is now handled as a simple route above
  }

  if (entity === 'purchases') {
    router.route(`/${entity}/generatePurchaseBill/:id`).get(catchErrors(controller['generatePurchaseBill']));
  }
};

// --- Accountant Routes ---
router.get(
  '/order/pending-invoice',
  authenticateToken,
  roleMiddleware(['owner', 'admin', 'accountant']),
  catchErrors(orderController.getPendingInvoices)
);

router.get(
  '/order/:orderId/details',
  authenticateToken,
  roleMiddleware(['owner', 'admin', 'accountant']),
  catchErrors(orderController.getOrderWithInventoryDetails)
);

router.get(
  '/ledger/client/:clientId',
  authenticateToken,
  roleMiddleware(['owner', 'admin', 'accountant']),
  catchErrors(ledgerController.getClientLedger)
);

router.get(
  '/ledger/summary',
  authenticateToken,
  roleMiddleware(['owner', 'admin', 'accountant']),
  catchErrors(ledgerController.getLedgerSummary)
);

// --- History Routes ---
router.get(
  '/history',
  authenticateToken,
  roleMiddleware(['owner', 'admin', 'accountant']),
  catchErrors(historyController.getHistory)
);

router.get(
  '/history/filters',
  authenticateToken,
  roleMiddleware(['owner', 'admin', 'accountant']),
  catchErrors(historyController.getHistoryFilters)
);

// --- Deliverer Dashboard Routes ---
// Add logging middleware for debugging
router.use('/order/current', (req, res, next) => {
  console.log('🚀 API /order/current called:', {
    method: req.method,
    url: req.url,
    headers: req.headers,
    user: req.user?.id || 'No user'
  });
  next();
});

router.get(
  '/order/current',
  authenticateToken,
  roleMiddleware(['deliverer']),
  catchErrors(orderController.delivererOrders)
);

// Order-based pickup endpoint for deliverers
router.post(
  '/order/:orderId/mark-pickup',
  authenticateToken,
  roleMiddleware(['deliverer']),
  catchErrors(orderController.markOrderAsPickup)
);

// Order-based delivery confirmation endpoint for deliverers
router.post(
  '/order/:orderId/mark-delivered',
  authenticateToken,
  roleMiddleware(['deliverer']),
  catchErrors(orderController.markOrderAsDelivered)
);

// Get delivered orders history for deliverer
router.get(
  '/order/delivered-history',
  authenticateToken,
  roleMiddleware(['deliverer']),
  catchErrors(orderController.getDeliveredOrdersHistory)
);

// Get all completed orders for return collection (any deliverer can collect returns)
router.get(
  '/order/completed-for-returns',
  authenticateToken,
  roleMiddleware(['deliverer', 'admin', 'owner']),
  catchErrors(orderController.getAllCompletedOrdersForReturns)
);

// Deliverer-specific routes
router.route('/deliveries/pending-delivery')
  .post(authenticateToken, roleMiddleware(['deliverer']), catchErrors(deliveryController.confirmPickup));

// ✅ Delivery confirmation route
router.post(
  '/deliveries/:id/confirm',
  authenticateToken,
  roleMiddleware(['deliverer']),
  catchErrors(deliveryController.confirmDelivery)
);

// 📦 Order Routes
router.get(
  '/order/list',
  authenticateToken,
  roleMiddleware(['owner', 'deliverer']),
  catchErrors(orderController.ownerOrders)
);

router.patch(
  '/order/:orderId/assignDelivery',
  authenticateToken,
  roleMiddleware(['owner', 'admin']),
  catchErrors(orderController.assignDeliverer)
);

// ✅ Optional legacy route
router.patch(
  '/:id/assignDelivery',
  authenticateToken,
  roleMiddleware(['owner']),
  orderController.assignDeliverer
);

// 🆕 Item Substitution Routes
router.get(
  '/order/returns/available/:inventoryItemId',
  authenticateToken,
  roleMiddleware(['owner', 'admin']),
  catchErrors(orderController.getAvailableReturnedItems)
);

router.post(
  '/order/:orderId/pickup', 
  authenticateToken,  
  roleMiddleware(['deliverer']),
  catchErrors(deliveryController.confirmPickup)
);

// Substitute order item with returned item
router.route('/order/:orderId/substitute')
  .post(
    authenticateToken, 
    roleMiddleware(['owner', 'admin']), 
    catchErrors(orderController.substituteOrderItem)
  );

// Get order with substitution details
router.route('/order/:orderId/substitutions')
  .get(
    authenticateToken, 
    roleMiddleware(['owner', 'admin', 'accountant']), 
    catchErrors(orderController.getOrderWithSubstitutions)
  );

// Get basic order by ID (fallback endpoint)
router.route('/order/:orderId')
  .get(
    authenticateToken, 
    roleMiddleware(['owner', 'admin', 'accountant']), 
    catchErrors(orderController.getOrderById)
  );

// --- Legacy fallback route for assigning delivery ---
router.patch(
  '/:id/assignDelivery',
  authenticateToken,
  roleMiddleware(['owner']),
  catchErrors(orderController.assignDeliverer)
);

// --- Expenses Routes ---
router.post(
  '/expenses/create',
  authenticateToken,
  roleMiddleware(['owner', 'admin', 'accountant']),
  catchErrors(expenseController.createExpense)
);

router.get(
  '/expenses/list',
  authenticateToken,
  roleMiddleware(['owner', 'admin', 'accountant']),
  catchErrors(expenseController.getExpenses)
);

router.delete(
  '/expenses/delete/:id',
  authenticateToken,
  roleMiddleware(['owner', 'admin', 'accountant']),
  catchErrors(expenseController.deleteExpense)
);

router.get(
  '/expenses/net-profit',
  authenticateToken,
  roleMiddleware(['owner', 'admin', 'accountant']),
  catchErrors(expenseController.calculateNetProfit)
);

// --- Financial Reports Routes ---
router.use(
  '/financial-reports',
  authenticateToken,
  roleMiddleware(['owner', 'admin', 'accountant']),
  financialReportsRoutes
);

// --- RETURNS COLLECTION ROUTE ---
router.post('/returns/collect', authenticateToken, roleMiddleware(['deliverer', 'admin', 'owner']), async (req, res) => {
  try {
    const Returns = require('@/models/appModels/Returns');
    const mongoose = require('mongoose');
    
    const {
      orderId,
      returnType,
      doctorId,
      doctorName,
      hospitalName,
      items,
      photo,
      customerSignature,
      customerName,
      notes,
      collectedBy,
      collectionDate
    } = req.body;    // Validate required fields
    if (!orderId || !items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Order ID and return items are required'
      });
    }

    // Validate return quantities
    const invalidItems = items.filter(item => !item.returnedQuantity || item.returnedQuantity <= 0);
    if (invalidItems.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'All return items must have a quantity greater than 0'
      });
    }

    if (!photo || !customerSignature || !customerName) {
      return res.status(400).json({
        success: false,
        message: 'Photo, customer signature, and customer name are required'
      });
    }

    // Start transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const createdReturns = [];      // Create return entries for each item
      for (const item of items) {
        const returnedQuantity = parseInt(item.returnedQuantity);
        
        // Double-check quantity is valid
        if (!returnedQuantity || returnedQuantity <= 0) {
          throw new Error(`Invalid return quantity for item: ${returnedQuantity}`);
        }
        
        const returnEntry = new Returns({
          originalItemId: item.originalItemId,
          returnedQuantity: returnedQuantity,
          reason: item.reason,
          status: 'Available for reuse',
          returnType: returnType || 'doctor',
          returnOrder: orderId,
          doctorId: doctorId,
          doctorName: doctorName,
          hospitalName: hospitalName,
          createdBy: collectedBy,
          collectionMetadata: {
            photo: photo,
            customerSignature: customerSignature,
            customerName: customerName,
            notes: notes,
            collectedBy: collectedBy,
            collectionDate: collectionDate ? new Date(collectionDate) : new Date()
          }
        });

        await returnEntry.save({ session });
        createdReturns.push(returnEntry);
      }

      // Commit transaction
      await session.commitTransaction();
      session.endSession();

      return res.status(201).json({
        success: true,
        message: `Successfully collected ${createdReturns.length} return items from order ${orderId}`,
        result: {
          orderId,
          returnsCreated: createdReturns.length,
          returnIds: createdReturns.map(r => r._id)
        }
      });

    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }

  } catch (error) {
    console.error('Error in return collection:', error);
    return res.status(500).json({
      success: false,
      message: 'Error processing return collection',
      error: error.message
    });
  }
});

// --- Register entity-based dynamic routes ---
router.route('/order/:orderId/assignDelivery')
  .patch(authenticateToken, roleMiddleware(['owner', 'admin']), catchErrors(orderController.assignDeliverer));

router.patch('/:id/assignDelivery', authenticateToken, roleMiddleware(['owner']), orderController.assignDeliverer); // optional legacy

// 🏥 Hospital Order Routes
router.route('/hospital/orders')
  .get(authenticateToken, roleMiddleware(['hospital']), catchErrors(orderController.hospitalOrders));

router.route('/hospital/orders/create')
  .post(authenticateToken, roleMiddleware(['hospital']), catchErrors(orderController.createHospitalOrder));

// New endpoint for hospital to get order details
router.route('/hospital/orders/:orderId')
  .get(authenticateToken, roleMiddleware(['hospital']), catchErrors(orderController.getOrderById));

// Hospital and Doctor Sales Bills (Invoices)
router.route('/hospital/sales-bills')
  .get(
    authenticateToken, 
    roleMiddleware(['hospital']),
    (req, res, next) => {
      console.log('🏥 Hospital sales-bills route hit, user:', req.user?.id);
      next();
    },
    catchErrors(appControllers.invoiceController.getClientInvoices)
  );

router.route('/doctor/sales-bills')
  .get(
    authenticateToken, 
    roleMiddleware(['doctor']),
    (req, res, next) => {
      console.log('🧠 Doctor sales-bills route hit, user:', req.user?.id);
      next();
    },
    catchErrors(appControllers.invoiceController.getClientInvoices)
  );

// Direct endpoint for admins to look up invoices by client ID
router.route('/admin/client-invoices/:clientId')
  .get(
    authenticateToken, 
    roleMiddleware(['owner', 'admin', 'accountant']), 
    (req, res, next) => {
      // Override the user ID with the requested client ID
      req.user = { ...req.user, id: req.params.clientId };
      console.log('👨‍💼 Admin looking up invoices for client:', req.params.clientId);
      next();
    },
    catchErrors(appControllers.invoiceController.getClientInvoices)
  );

// Endpoint for admins to manually create/find clients
router.route('/admin/client/find-or-create')
  .post(
    authenticateToken, 
    roleMiddleware(['owner', 'admin']),
    async (req, res) => {
      try {
        const { findOrCreateClientByUserId } = require('@/controllers/appControllers/clientController/clientUtils');
        const { userId, userInfo } = req.body;
        
        if (!userId) {
          return res.status(400).json({
            success: false,
            message: 'userId is required'
          });
        }
        
        const client = await findOrCreateClientByUserId(userId, userInfo || {});
        
        if (client) {
          return res.status(200).json({
            success: true,
            result: client,
            message: `Client ${client.name} found/created successfully`
          });
        } else {
          return res.status(500).json({
            success: false,
            message: 'Failed to find or create client'
          });
        }
      } catch (error) {
        console.error('Error in find-or-create client:', error);
        return res.status(500).json({
          success: false,
          message: 'Server error',
          error: error.message
        });
      }
    }
  );

// 🧠 Doctor Order Routes
router.route('/doctor/orders')
  .get(authenticateToken, roleMiddleware(['doctor']), catchErrors(orderController.doctorOrders));

router.route('/doctor/orders/create')
  .post(authenticateToken, roleMiddleware(['doctor']), catchErrors(orderController.createDoctorOrder));

// 🧠 Register all dynamic entity-based routes
routesList.forEach(({ entity, controllerName }) => {
  const controller = appControllers[controllerName];
  routerApp(entity, controller);
});
// ✅ REGISTER PRODUCT ROUTES HERE
const productRoutes = require('./productRoutes');
router.use('/productinventory', productRoutes); // ✅ MOUNT IT HERE

// PDF generation for orders
router.get(
  '/order/:id/pdf',
  authenticateToken,
  roleMiddleware(['owner', 'admin', 'doctor', 'deliverer']),
  catchErrors(orderController.generateOrderPdf)
);

// console.log('routesList:', routesList);
module.exports = router;
