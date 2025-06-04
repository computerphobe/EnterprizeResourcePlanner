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

const deliveryRoutes = require('./routes/deliveryRoutes');
const delivererAuthRoutes = require('./routes/delivererAuthRoutes');

const fileUpload = require('express-fileupload');

// Create our Express app
const app = express();

// CORS setup - allow requests from frontend
app.use(
  cors({
    origin: 'http://localhost:3000',  // replace with your frontend URL
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(compression());

// Serve uploads folder statically (for delivery photos)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Mount deliverer auth routes AFTER app declaration
app.use('/api/deliverer', delivererAuthRoutes);

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

// Mount delivery routes here
app.use('/api/deliveries', deliveryRoutes);

app.use('/download', coreDownloadRouter);
app.use('/public', corePublicRouter);

// Serve PDF files statically
app.use('/pdf', express.static(path.join(__dirname, '../public/pdf')));

// Optional: Multer error handler fallback (if any slipped through)
app.use((err, req, res, next) => {
  if (err.name === 'MulterError' || err.message?.includes('Only JPEG, JPG, or PNG images')) {
    return res.status(400).json({ error: err.message });
  }
  next(err);
});

// If none of the above matched, 404 and error handlers
app.use(errorHandlers.notFound);
app.use(errorHandlers.productionErrors);

module.exports = app;
