# ERP System Deployment Guide

## Overview

The ERP system is now feature-complete and ready for deployment. All major features have been implemented including:

✅ **Multi-tenant architecture** with organizationId support
✅ **Hospital name tracking** for doctors and orders  
✅ **Patient name tracking** for orders and invoices
✅ **Robust invoice creation** with backward compatibility
✅ **Returns management** with validation (quantity >= 1)
✅ **Deliverer order tracking** with returned items visibility
✅ **Pricing consistency** across orders and invoices
✅ **PDF generation** for orders and invoices
✅ **Admin debugging tools** for invoice troubleshooting
✅ **Comprehensive test coverage** with migration scripts

## Pre-Deployment Checklist

### 1. Dependencies
- All backend dependencies are properly configured
- Frontend dependencies are up to date
- PDF generation libraries (html-pdf, pug) are installed

### 2. Database
- MongoDB connection is configured
- Database migrations have been run for legacy data
- Hospital name and pricing fixes have been applied

### 3. Features Implemented
- ✅ Multi-admin, multi-organization support
- ✅ Hospital name population for all user types
- ✅ Patient name support in orders/invoices  
- ✅ Returns validation and visibility
- ✅ PDF generation for orders and invoices
- ✅ Pricing consistency fixes
- ✅ Debug tools cleaned up (except admin invoice debugger)

## Deployment Steps

### Step 1: Environment Configuration

1. **Backend Environment**
   ```bash
   cd backend
   cp .env.example .env
   ```
   
   Configure these variables in `.env`:
   ```env
   DATABASE=mongodb://your-mongodb-connection-string
   JWT_SECRET=your-super-secret-jwt-key-128-chars-minimum
   DELIVERER_JWT_SECRET=your-deliverer-jwt-secret
   PORT=8888
   PUBLIC_SERVER_FILE=https://your-domain.com/
   NODE_ENV=production
   ```

2. **Frontend Environment**
   ```bash
   cd frontend
   ```
   
   Update `.env`:
   ```env
   VITE_FILE_BASE_URL=https://your-api-domain.com/
   VITE_BACKEND_SERVER=https://your-api-domain.com/
   PROD=true
   VITE_API_URL=https://your-api-domain.com/api
   ```

### Step 2: Database Setup

1. **MongoDB Setup**
   ```bash
   # Make sure MongoDB is running
   # For cloud MongoDB (recommended): Use MongoDB Atlas
   # For local: mongod --dbpath /path/to/data
   ```

2. **Run Database Migrations**
   ```bash
   cd backend
   npm run setup
   
   # Run the migration scripts if you have legacy data
   node fix-hospital-name-orders.js
   node fix-order-pricing.js
   ```

### Step 3: Backend Deployment

1. **Install Dependencies**
   ```bash
   cd backend
   npm install --production
   ```

2. **Test the Backend**
   ```bash
   npm start
   ```
   
   Verify endpoints:
   - http://localhost:8888/api/admin/login
   - http://localhost:8888/api/order/list
   - http://localhost:8888/api/invoice/list

3. **Production Deployment**
   ```bash
   # For PM2 (recommended)
   npm install -g pm2
   pm2 start src/server.js --name "erp-backend"
   pm2 startup
   pm2 save
   
   # Or using Docker
   docker build -t erp-backend .
   docker run -d -p 8888:8888 --env-file .env erp-backend
   ```

### Step 4: Frontend Deployment

1. **Install Dependencies**
   ```bash
   cd frontend
   npm install
   ```

2. **Build for Production**
   ```bash
   npm run build
   ```

3. **Deploy Build**
   ```bash
   # For Nginx
   cp -r dist/* /var/www/html/
   
   # For Apache
   cp -r dist/* /var/www/html/
   
   # For Netlify/Vercel
   # Upload the dist folder or connect to your git repository
   ```

### Step 5: Web Server Configuration

**Nginx Configuration Example:**
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    # Frontend
    location / {
        root /var/www/html;
        try_files $uri $uri/ /index.html;
    }
    
    # Backend API
    location /api {
        proxy_pass http://localhost:8888;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    # Static files (PDFs, uploads)
    location /pdf {
        proxy_pass http://localhost:8888;
    }
}
```

### Step 6: SSL Configuration

```bash
# Using Certbot (Let's Encrypt)
sudo certbot --nginx -d your-domain.com
```

### Step 7: Final Testing

1. **User Registration & Login**
   - Test admin login
   - Test doctor registration with hospital name
   - Test deliverer registration

2. **Core Features**
   - Place orders with patient names
   - Create invoices with patient names  
   - Test returns (quantity >= 1)
   - Verify deliverer sees returned items
   - Test PDF generation

3. **Multi-tenancy**
   - Test multiple organizations
   - Verify data isolation
   - Test invoice/order linking

## Production Monitoring

### Health Check Endpoints
- GET `/api/admin/list` - Test API connectivity
- GET `/api/financial/summary` - Test database connectivity

### Logs
```bash
# Backend logs
pm2 logs erp-backend

# Nginx logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

### Backup Strategy
```bash
# MongoDB backup
mongodump --uri="mongodb://your-connection-string" --out=/backup/$(date +%Y%m%d)

# File uploads backup
tar -czf /backup/uploads-$(date +%Y%m%d).tar.gz backend/uploads/
```

## Security Considerations

1. **JWT Secrets**: Use strong, unique secrets (128+ characters)
2. **HTTPS**: Always use SSL in production
3. **Database**: Use MongoDB Atlas or secure local installation
4. **CORS**: Configure proper CORS origins
5. **Rate Limiting**: Express rate limiting is configured
6. **File Uploads**: Validate file types and sizes

## Performance Optimization

1. **Database Indexing**: Ensure indexes on frequently queried fields
2. **Caching**: Consider Redis for session management
3. **CDN**: Use CDN for static assets
4. **Database Connection Pooling**: Mongoose handles this automatically

## Troubleshooting

### Common Issues
1. **PDF Generation Fails**: Check pug templates and file permissions
2. **Hospital Name Shows "Unknown"**: Run hospital name fix script
3. **Invoice Creation Errors**: Check schema validation
4. **CORS Errors**: Verify frontend/backend URL configuration

### Debug Tools
- Admin Invoice Debugger: `/admin/invoice-debugger`
- Network tab in browser dev tools
- Backend logs via PM2 or console

## Support

The system is production-ready with all major features implemented:

- Multi-tenancy with organizationId
- Hospital name tracking and display
- Patient name support in orders/invoices
- Returns management with proper validation
- PDF generation for orders and invoices
- Pricing consistency across the system
- Comprehensive admin debugging tools

All critical TODOs have been resolved and the system is ready for production deployment.
