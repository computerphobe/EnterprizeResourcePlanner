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
    origin: 'http://localhost:3000', // Replace with your frontend URL if different
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(compression());

// Serve uploads folder statically (for delivery photos, etc.)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/pdf', express.static(path.join(__dirname, '../public/pdf')));

// Mount public routes
app.use('/public', corePublicRouter);
app.use('/download', coreDownloadRouter);

// Mount deliverer-specific routes
app.use('/api/deliverer', delivererAuthRoutes);
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
  if (err.name === 'MulterError' || err.message?.includes('Only JPEG, JPG, or PNG images')) {
    return res.status(400).json({ error: err.message });
  }
  next(err);
});

// Fallback 404 and error handlers
app.use(errorHandlers.notFound);
app.use(errorHandlers.productionErrors);

module.exports = app;
