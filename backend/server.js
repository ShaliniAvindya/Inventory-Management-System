// server.js
require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');

// Import routes
const userRoutes = require('./routes/user.routes');
const authRoutes = require('./routes/auth.routes');
const productRoutes = require('./routes/product.routes');
const categoryRoutes = require('./routes/category.routes');
const customerRoutes = require('./routes/customer.routes');
const supplierRoutes = require('./routes/supplier.routes');
const locationRoutes = require('./routes/inventoryLocation.routes');
const inventoryRoutes = require('./routes/inventory.routes');
const stockTransferRoutes = require('./routes/stockTransfer.routes');
const purchaseOrderRoutes = require('./routes/purchaseOrder.routes');
const salesOrderRoutes = require('./routes/salesOrder.routes');
const salesRoutes = require('./routes/sales.routes');
const paymentRoutes = require('./routes/payment.routes');

let returnsRoutes;
try {
    returnsRoutes = require('./routes/returns.routes');
} catch (e) {
    returnsRoutes = require('./routes/returnsExchange.routes');
}

const checkoutRoutes = require('./routes/checkout.routes');
const notificationRoutes = require('./routes/notification.routes');
const analyticsRoutes = require('./routes/analytics.routes');
const { startEmailScheduler } = require('./jobs/emailScheduler');

const app = express();

// Connect to DB
connectDB();

// --- Middlewares ---
app.use(helmet());
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS setup for frontend with cookies
const FRONTEND_URL = 'https://inventory-management-system-xi-one-18.vercel.app';
app.use(cors({
    origin: FRONTEND_URL,
    credentials: true
}));
// Preflight requests
app.options('*', cors({ origin: FRONTEND_URL, credentials: true }));

// Simple request logger
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
    next();
});

// --- Routes ---

// Root
app.get('/', (req, res) => res.send('Inventory Management System Backend is live!'));

// Health check
app.all(['/api/health', '/health'], (req, res) => {
    res.json({ success: true, status: 'ok' });
});

// Authentication
app.use('/api/auth', authRoutes);

// Main API routes
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/stock-transfers', stockTransferRoutes);
app.use('/api/purchase-orders', purchaseOrderRoutes);
app.use('/api/sales-orders', salesOrderRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/returns', returnsRoutes);
app.use('/api/checkout', checkoutRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/analytics', analyticsRoutes);

// Catch 404 for undefined routes
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Resource at ${req.originalUrl} not found`
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    const status = err.status || 500;
    const message = err.message || 'Internal Server Error';
    res.status(status).json({
        success: false,
        error: { message, stack: process.env.NODE_ENV === 'development' ? err.stack : undefined }
    });
});

// Start email scheduler only in local/dev
if (process.env.VERCEL !== '1') {
    const PORT = process.env.PORT || 3001;
    app.listen(PORT, () => {
        console.log(`Server running locally on port ${PORT}`);
        startEmailScheduler().catch(err => console.error('Email scheduler failed:', err));
    });
} else {
    console.log('Server configured for Vercel serverless');
}

// Export app for Vercel
module.exports = app;
