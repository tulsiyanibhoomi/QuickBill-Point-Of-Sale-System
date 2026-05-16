require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');
const morgan  = require('morgan');

const authRoutes      = require('./modules/auth/auth.routes');
const categoryRoutes  = require('./modules/categories/categories.routes');
const productRoutes   = require('./modules/products/products.routes');
const stockRoutes     = require('./modules/stock/stock.routes');
const orderRoutes     = require('./modules/orders/orders.routes');
const invoiceRoutes   = require('./modules/invoices/invoices.routes');
const dashboardRoutes = require('./modules/dashboard/dashboard.routes');
const { notFound, errorHandler } = require('./middleware/error.middleware');

const app = express();

// ── Security & utility middleware ────────────────────────────
app.use(helmet());
app.use(cors());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Health check ─────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: 'QuickBill API is running', timestamp: new Date() });
});

// ── Routes ───────────────────────────────────────────────────
app.use('/api/auth',      authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products',  productRoutes);
app.use('/api/stock',     stockRoutes);
app.use('/api/orders',    orderRoutes);
app.use('/api/invoices',  invoiceRoutes);
app.use('/api/dashboard', dashboardRoutes);

// ── Error handling ───────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

module.exports = app;
