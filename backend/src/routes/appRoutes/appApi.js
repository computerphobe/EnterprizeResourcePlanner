const express = require('express');
const { catchErrors } = require('@/handlers/errorHandlers');
const router = express.Router();

const appControllers = require('@/controllers/appControllers');
const { routesList } = require('@/models/utils');
const deliveryController = require('@/controllers/deliveryController');
const roleMiddleware = require('@/middleware/roleMiddleware'); // Role middleware for user roles

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

  // Special cases
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
    console.log('Registering PDF route for purchases');
    router.route(`/${entity}/generatePurchaseBill/:id`).get(catchErrors(controller['generatePurchaseBill']));
  }
};

// General Delivery Routes (protected by roles)
router.route('/delivery/create')
  .post(roleMiddleware(['admin', 'deliverer']), catchErrors(deliveryController.createDelivery));
router.route('/delivery/read/:id')
  .get(roleMiddleware(['admin', 'deliverer']), catchErrors(deliveryController.getDeliveryById));
router.route('/delivery/update/:id')
  .patch(roleMiddleware(['deliverer']), catchErrors(deliveryController.updateDelivery));
router.route('/delivery/delete/:id')
  .delete(roleMiddleware(['admin']), catchErrors(deliveryController.deleteDelivery));
router.route('/delivery/list')
  .get(roleMiddleware(['admin', 'deliverer']), catchErrors(deliveryController.getAllDeliveries));

// Deliverer Dashboard Routes
router.route('/deliveries/current')
  .get(roleMiddleware(['deliverer']), catchErrors(deliveryController.getCurrentDeliveries));
router.route('/deliveries/:id/pickup')
  .post(roleMiddleware(['deliverer']), catchErrors(deliveryController.confirmPickup)); // changed method to confirmPickup
router.route('/deliveries/:id/confirm')
  .post(roleMiddleware(['deliverer']), catchErrors(deliveryController.confirmDelivery));

// Dynamic Entity Routes
routesList.forEach(({ entity, controllerName }) => {
  const controller = appControllers[controllerName];
  routerApp(entity, controller);
});

console.log("routersList", routesList.map(({ entity }) => entity).join(', '));

module.exports = router;
