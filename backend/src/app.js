const express = require('express');
const path = require('path');
const cors = require('cors');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const fileUpload = require('express-fileupload');

const coreAuthRouter = require('./routes/coreRoutes/coreAuth');
const coreApiRouter = require('./routes/coreRoutes/coreApi');
const coreDownloadRouter = require('./routes/coreRoutes/coreDownloadRouter');
const corePublicRouter = require('./routes/coreRoutes/corePublicRouter');
const adminAuth = require('./controllers/coreControllers/adminAuth');

const errorHandlers = require('./handlers/errorHandlers');

// These are your app-specific routes
const erpApiRouter = require('./routes/appRoutes/appApi'); // This includes your dynamic app routes
const dashboardRoutes = require('./routes/appRoutes/dashboardRoutes');
const deliveryRoutes = require('./routes/deliveryRoutes');
const delivererAuthRoutes = require('./routes/delivererAuthRoutes');
const financialReportsRoutes = require('./routes/appRoutes/financialReportsRoutes'); // 💡 New route


// Create our Express app
const app = express();

// CORS setup - allow requests from frontend
app.use(
  cors({
    origin: [
      'http://localhost:3000',
      'https://shashwatimplant.onrender.com',
      'https://shashwatimpant.onrender.com'
    ],
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));
app.use(compression());

// Add timeout configuration for large file uploads
app.use((req, res, next) => {
  // Set timeout to 5 minutes for upload requests
  if (req.url.includes('/upload') || req.url.includes('/createAndUpload') || req.url.includes('photo') || req.url.includes('signature')) {
    req.setTimeout(5 * 60 * 1000); // 5 minutes
    res.setTimeout(5 * 60 * 1000); // 5 minutes
  }
  next();
});

// Serve uploads folder statically (for delivery photos, etc.)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/pdf', express.static(path.join(__dirname, '../public/pdf')));

// Mount public routes
app.use('/public', corePublicRouter);
app.use('/download', coreDownloadRouter);

// Mount deliverer-specific routes
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
app.use('/api/deliveries', deliveryRoutes);

// Mount core authentication route (before token check)
app.use('/api', coreAuthRouter);

// Middleware to check admin auth for all subsequent /api routes
app.use('/api', adminAuth.isValidAuthToken);

// Protected API routes after auth
app.use('/api', coreApiRouter);
app.use('/api', erpApiRouter); // 🔁 Your central appApi routes
app.use('/api', dashboardRoutes);


// Handle Multer or image errors gracefully
app.use((err, req, res, next) => {
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ 
        error: 'File too large. Maximum file size is 100MB.',
        code: 'FILE_TOO_LARGE'
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ 
        error: 'Too many files. Maximum 10 files allowed.',
        code: 'TOO_MANY_FILES'
      });
    }
    return res.status(400).json({ error: err.message });
  }
  if (err.message?.includes('Only JPEG, JPG, or PNG images')) {
    return res.status(400).json({ error: err.message });
  }
  next(err);
});

// Fallback 404 and error handlers
app.use(errorHandlers.notFound);
app.use(errorHandlers.productionErrors);

module.exports = app;
