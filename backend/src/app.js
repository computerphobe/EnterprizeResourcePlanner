const express = require('express');
const path = require('path');

const cors = require('cors');
const compression = require('compression');

const cookieParser = require('cookie-parser');

const coreAuthRouter = require('./routes/coreRoutes/coreAuth');
const coreApiRouter = require('./routes/coreRoutes/coreApi');
const coreDownloadRouter = require('./routes/coreRoutes/coreDownloadRouter');
const corePublicRouter = require('./routes/coreRoutes/corePublicRouter');
const adminAuth = require('./controllers/coreControllers/adminAuth');

const errorHandlers = require('./handlers/errorHandlers');
const erpApiRouter = require('./routes/appRoutes/appApi');
const dashboardRoutes = require('./routes/appRoutes/dashboardRoutes');

const fileUpload = require('express-fileupload');
// create our Express app
const app = express();

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(compression());

// // default options
// app.use(fileUpload());

// Debug endpoint to list all routes
app.get('/api/debug/routes', (req, res) => {
  const routes = [];
  
  app._router.stack.forEach((middleware) => {
    if (middleware.route) {
      // Routes registered directly on the app
      routes.push({
        path: middleware.route.path,
        methods: Object.keys(middleware.route.methods).join(', ')
      });
    } else if (middleware.name === 'router') {
      // Router middleware
      middleware.handle.stack.forEach((handler) => {
        if (handler.route) {
          routes.push({
            path: handler.route.path,
            methods: Object.keys(handler.route.methods).join(', ')
          });
        }
      });
    }
  });
  
  res.json({
    routes: routes,
    dashboardRoutes: dashboardRoutes.stack.map(r => ({
      path: r.route?.path || 'n/a',
      methods: r.route ? Object.keys(r.route.methods).join(', ') : 'n/a'
    }))
  });
});

// Add a direct test route for ledger
app.post('/api/test/ledger', adminAuth.isValidAuthToken, (req, res) => {
  try {
    console.log('Test ledger entry received:', req.body);
    res.status(200).json({
      success: true,
      message: 'Test ledger route working',
      receivedData: req.body
    });
  } catch (error) {
    console.error('Error in test ledger route:', error);
    res.status(500).json({
      success: false,
      message: 'Error in test route',
      error: error.message
    });
  }
});

// Here our API Routes

app.use('/api', coreAuthRouter);
app.use('/api', adminAuth.isValidAuthToken, coreApiRouter);
app.use('/api', adminAuth.isValidAuthToken, erpApiRouter);
app.use('/api', adminAuth.isValidAuthToken, dashboardRoutes);
app.use('/download', coreDownloadRouter);
app.use('/public', corePublicRouter);

// Add this middleware if it doesn't exist
app.use('/pdf', express.static(path.join(__dirname, '../public/pdf')));

// If that above routes didnt work, we 404 them and forward to error handler
app.use(errorHandlers.notFound);

// production error handler
app.use(errorHandlers.productionErrors);

// done! we export it so we can start the site in start.js
module.exports = app;
