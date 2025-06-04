const express = require('express');
const { catchErrors } = require('@/handlers/errorHandlers');
const router = express.Router();

const appControllers = require('@/controllers/appControllers');
const { routesList } = require('@/models/utils');
const deliveryController = require('@/controllers/deliveryController');
const roleMiddleware = require('@/middleware/roleMiddleware');
const authenticateToken = require('@/middleware/authMiddleware');
const orderController = require('@/controllers/appControllers/orderController');

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

// 🛡️ Delivery Routes
router.route('/delivery/create')
  .post(authenticateToken, roleMiddleware(['admin', 'deliverer']), catchErrors(deliveryController.createDelivery));
router.route('/delivery/read/:id')
  .get(authenticateToken, roleMiddleware(['admin', 'deliverer']), catchErrors(deliveryController.getDeliveryById));
router.route('/delivery/update/:id')
  .patch(authenticateToken, roleMiddleware(['deliverer']), catchErrors(deliveryController.updateDelivery));
router.route('/delivery/delete/:id')
  .delete(authenticateToken, roleMiddleware(['admin']), catchErrors(deliveryController.deleteDelivery));
router.route('/delivery/list')
  .get(authenticateToken, roleMiddleware(['admin', 'deliverer']), catchErrors(deliveryController.getAllDeliveries));

// 🚚 Deliverer Dashboard Routes
router.route('/order/current')
  .get(authenticateToken, roleMiddleware(['deliverer']), catchErrors(orderController.delivererOrders));
router.route('/deliveries/:id/pickup')
  .post(authenticateToken, roleMiddleware(['deliverer']), catchErrors(deliveryController.confirmPickup));
router.route('/deliveries/:id/confirm')
  .post(authenticateToken, roleMiddleware(['deliverer']), catchErrors(deliveryController.confirmDelivery));

// 📦 Order Routes
router.route('/order/list')
  .get(authenticateToken, roleMiddleware(['owner', 'deliverer']), catchErrors(orderController.ownerOrders));

router.route('/order/:orderId/assignDelivery')
  .patch(authenticateToken, roleMiddleware(['owner', 'admin']), catchErrors(orderController.assignDeliverer));

router.patch('/:id/assignDelivery', authenticateToken, roleMiddleware(['owner']), orderController.assignDeliverer); // optional legacy

// 🏥 Hospital Order Routes
router.route('/hospital/orders')
  .get(authenticateToken, roleMiddleware(['hospital']), catchErrors(orderController.hospitalOrders));

router.route('/hospital/orders/create')
  .post(authenticateToken, roleMiddleware(['hospital']), catchErrors(orderController.createHospitalOrder));

// 🧠 Register all dynamic entity-based routes
routesList.forEach(({ entity, controllerName }) => {
  const controller = appControllers[controllerName];
  routerApp(entity, controller);
});

module.exports = router;
