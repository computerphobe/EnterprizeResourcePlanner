const { basename, extname } = require('path');
const { globSync } = require('glob');
const { modelName } = require('../appModels/Client');
const appModelsFiles = globSync('./src/models/appModels/**/*.js');
const pattern = './src/models/**/*.js';

const modelsFiles = globSync(pattern).map((filePath) => {
  const fileNameWithExtension = basename(filePath);
  const fileNameWithoutExtension = fileNameWithExtension.replace(
    extname(fileNameWithExtension),
    ''
  );
  return fileNameWithoutExtension;
});

const constrollersList = [];
const appModelsList = [];
const entityList = [];

// Updated to use only Inventory model
const routesList = [
  {
    entity: 'inventory',
    controllerName: 'inventoryController',
    modelName: 'Inventory',
  },
  // Removed productinventory from dynamic routes - using explicit productRoutes instead

  {
    entity: 'returns',
    controllerName: 'returnsController',
    modelName: 'Returns',
  },
  {
    entity: 'suppliers',
    controllerName: 'supplierController',
    modelName: 'Supplier',
  },
  {
    entity: 'purchases',
    controllerName: 'purchaseController',
    modelName: 'Purchase',
  },
  {
    entity: 'orders',
    controllerName: 'orderController',
    modelName: 'Order'
  },
  { entity: 'admin', controllerName: 'adminController', modelName: 'Admin' },
  { entity: 'ledger', controllerName: 'ledgerController', modelName: 'Ledger' },
];

for (const filePath of appModelsFiles) {
  const fileNameWithExtension = basename(filePath);
  const fileNameWithoutExtension = fileNameWithExtension.replace(
    extname(fileNameWithExtension),
    ''
  );
  const firstChar = fileNameWithoutExtension.charAt(0);
  const modelName = fileNameWithoutExtension.replace(firstChar, firstChar.toUpperCase());
  const fileNameLowerCaseFirstChar = fileNameWithoutExtension.replace(
    firstChar,
    firstChar.toLowerCase()
  );
  const entity = fileNameWithoutExtension.toLowerCase();

  // Skip if already in routesList
  if (!routesList.find(route => route.entity === entity)) {
    controllerName = fileNameLowerCaseFirstChar + 'Controller';
    constrollersList.push(controllerName);
    appModelsList.push(modelName);
    entityList.push(entity);
    const route = {
      entity: entity,
      modelName: modelName,
      controllerName: controllerName,
    };
    routesList.push(route);
  }
}

module.exports = { constrollersList, appModelsList, modelsFiles, entityList, routesList };
