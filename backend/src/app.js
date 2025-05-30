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
