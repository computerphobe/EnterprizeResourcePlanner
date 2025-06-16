const express = require('express');
const { catchErrors } = require('@/handlers/errorHandlers');
const router = express.Router();

const appControllers = require('@/controllers/appControllers');
const { routesList } = require('@/models/utils');

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
    } = req.body;

    // Validate required fields
    if (!orderId || !items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Order ID and return items are required'
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
      const createdReturns = [];

      // Create return entries for each item
      for (const item of items) {
        const returnEntry = new Returns({
          originalItemId: item.originalItemId,
          returnedQuantity: item.returnedQuantity,
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
routesList.forEach(({ entity, controllerName }) => {
  const controller = appControllers[controllerName];
  routerApp(entity, controller);
});
// ✅ REGISTER PRODUCT ROUTES HERE
const productRoutes = require('./productRoutes');
router.use('/productinventory', productRoutes); // ✅ MOUNT IT HERE

module.exports = router;
