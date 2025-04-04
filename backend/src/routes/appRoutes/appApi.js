const express = require('express');
const { catchErrors } = require('@/handlers/errorHandlers');
const router = express.Router();

const appControllers = require('@/controllers/appControllers');
const { routesList } = require('@/models/utils');
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
  router.route(`/${entity}/list`).get(catchErrors(controller['list']));
  
  // Special cases
  if (entity === 'invoice' || entity === 'quote' || entity === 'payment') {
    router.route(`/${entity}/mail`).post(catchErrors(controller['mail']));
  }

  if (entity === 'quote') {
    router.route(`/${entity}/convert/:id`).get(catchErrors(controller['convert']));
  }

  // Special case for returns
  if (entity === 'returns') {
    router.route(`/${entity}/markAsUsed`).post(catchErrors(controller['markAsUsed']));
  }

  if (entity === 'purchases') {
    console.log('Registering PDF route for purchases');
    router.route(`/${entity}/generatePurchaseBill/:id`).get(catchErrors(controller['generatePurchaseBill']));
  }
};

// Make sure `inventory` controller is registered in routesList
routesList.forEach(({ entity, controllerName }) => {
  const controller = appControllers[controllerName];
  routerApp(entity, controller);
});

console.log("routersList",routesList.map(({ entity }) => entity).join(', '));

module.exports = router;
