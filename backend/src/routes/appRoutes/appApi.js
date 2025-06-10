const express = require('express');
const { catchErrors } = require('@/handlers/errorHandlers');
const router = express.Router();

const appControllers = require('@/controllers/appControllers');
const { routesList } = require('@/models/utils');

const deliveryController = require('@/controllers/appControllers/deliveryController');
const orderController = require('@/controllers/appControllers/orderController');
const ledgerController = require('@/controllers/appControllers/ledgerController');
const expenseController = require('@/controllers/appControllers/expenseController');

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
  }

  if (entity === 'returns') {
    router.route(`/${entity}/markAsUsed`).post(catchErrors(controller['markAsUsed']));
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

// --- Deliverer Dashboard Routes ---
router.get(
  '/order/current',
  authenticateToken,
  roleMiddleware(['deliverer']),
  catchErrors(orderController.delivererOrders)
);

router.post(
  '/deliveries/pending-delivery',
  authenticateToken,
  roleMiddleware(['deliverer']),
  catchErrors(deliveryController.confirmPickup)
);

router.post(
  '/deliveries/:id/confirm',
  authenticateToken,
  roleMiddleware(['deliverer']),
  catchErrors(deliveryController.confirmDelivery)
);

// --- Order Management ---
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
// --- NEW: Item Substitution Routes ---
// Get available returned items for substitution
router.route('/order/returns/available/:inventoryItemId')
  .get(
    authenticateToken, 
    roleMiddleware(['owner', 'admin']), 
    catchErrors(orderController.getAvailableReturnedItems)
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

// --- Register entity-based dynamic routes ---
routesList.forEach(({ entity, controllerName }) => {
  const controller = appControllers[controllerName];
  routerApp(entity, controller);
});

module.exports = router;