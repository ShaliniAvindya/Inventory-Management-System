const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose'); // using mongoose directly

// Routes
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
} catch {
  returnsRoutes = require('./routes/returnsExchange.routes');
}

const checkoutRoutes = require('./routes/checkout.routes');
const notificationRoutes = require('./routes/notification.routes');
const analyticsRoutes = require('./routes/analytics.routes');
const { startEmailScheduler } = require('./jobs/emailScheduler');

const app = express();

/* -------------------- Trust Proxy -------------------- */
app.set('trust proxy', 1);

/* -------------------- Middlewares -------------------- */
app.use(helmet());
app.use(cors({
  origin: 'https://inventory-management-system-xi-one-18.vercel.app',
  credentials: true
}));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* -------------------- MongoDB Connection -------------------- */
const MONGO_URI = 'mongodb+srv://lushware:d6nICxzWJmQuU8Pc@cluster0.5ftfjbe.mongodb.net/test';
mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

/* -------------------- Logger -------------------- */
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

/* -------------------- Routes -------------------- */
app.get('/', (req, res) => {
  res.send('Inventory Management System Backend is live!');
});

app.all(['/api/health', '/health'], (req, res) => {
  res.json({ success: true, status: 'ok' });
});

app.use('/api/auth', authRoutes);
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

/* -------------------- 404 -------------------- */
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

/* -------------------- Error Handler -------------------- */
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ success: false, message: err.message || 'Internal Server Error' });
});

/* -------------------- Server Start -------------------- */
if (process.env.VERCEL !== '1') {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`🚀 Server running locally on port ${PORT}`);
    startEmailScheduler?.().catch(err => console.error('Email scheduler failed:', err));
  });
} else {
  console.log('🚀 Server configured for Vercel serverless');
}

module.exports = app;

