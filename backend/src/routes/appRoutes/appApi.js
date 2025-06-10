const express = require('express');
const { catchErrors } = require('@/handlers/errorHandlers');
const router = express.Router();

const appControllers = require('@/controllers/appControllers');
const { routesList } = require('@/models/utils');
const deliveryController = require('@/controllers/appControllers/deliveryController');
const roleMiddleware = require('@/middleware/roleMiddleware');
const authenticateToken = require('@/middleware/authMiddleware');
const orderController = require('@/controllers/appControllers/orderController');
const ledgerController = require('@/controllers/appControllers/ledgerController');
const expenseController = require('@/controllers/appControllers/expenseController');

// Dynamic CRUD routes generator
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

// --- Accountant routes ---
router.route('/order/pending-invoice').get(
  authenticateToken, roleMiddleware(['owner', 'admin', 'accountant']), 
  catchErrors(orderController.getPendingInvoices)
);

router.route('/order/:orderId/details')
  .get(authenticateToken, roleMiddleware(['owner', 'admin', 'accountant']), catchErrors(orderController.getOrderWithInventoryDetails));

router.route('/ledger/client/:clientId')
  .get(authenticateToken, roleMiddleware(['owner', 'admin', 'accountant']), catchErrors(ledgerController.getClientLedger));

router.route('/ledger/summary')
  .get(
    authenticateToken, 
    roleMiddleware(['owner', 'admin', 'accountant']), 
    catchErrors(ledgerController.getLedgerSummary)
  );

// --- Deliverer Dashboard Routes ---
router.route('/order/current')
  .get(authenticateToken, roleMiddleware(['deliverer']), catchErrors(orderController.delivererOrders));

router.route('/deliveries/:id/confirm')
  .get(authenticateToken, roleMiddleware(['deliverer']), catchErrors(deliveryController.confirmDelivery));

router.route('/deliveries/pending-delivery')
  .post(authenticateToken, roleMiddleware(['deliverer']), catchErrors(deliveryController.confirmPickup));

router.route('/deliveries/:id/confirm')
  .post(authenticateToken, roleMiddleware(['deliverer']), catchErrors(deliveryController.confirmDelivery));

// --- Order Routes ---
router.route('/order/list')
  .get(authenticateToken, roleMiddleware(['owner', 'deliverer']), catchErrors(orderController.ownerOrders));

router.route('/order/:orderId/assignDelivery')
  .patch(authenticateToken, roleMiddleware(['owner', 'admin']), catchErrors(orderController.assignDeliverer));

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

router.patch('/:id/assignDelivery', authenticateToken, roleMiddleware(['owner']), orderController.assignDeliverer); // optional legacy

// --- Expenses Module routes ---

// Create expense
router.post(
  '/expenses/create',
  authenticateToken,
  roleMiddleware(['owner', 'admin', 'accountant']),
  catchErrors(expenseController.createExpense)
);

// Get all expenses
router.get(
  '/expenses/list',
  authenticateToken,
  roleMiddleware(['owner', 'admin', 'accountant']),
  catchErrors(expenseController.getExpenses)
);

// Soft delete expense
router.delete(
  '/expenses/delete/:id',
  authenticateToken,
  roleMiddleware(['owner', 'admin', 'accountant']),
  catchErrors(expenseController.deleteExpense)
);

// Calculate net profit
router.get(
  '/expenses/net-profit',
  authenticateToken,
  roleMiddleware(['owner', 'admin', 'accountant']),
  catchErrors(expenseController.calculateNetProfit)
);

// --- Register all dynamic entity-based routes ---
routesList.forEach(({ entity, controllerName }) => {
  const controller = appControllers[controllerName];
  routerApp(entity, controller);
});

module.exports = router;