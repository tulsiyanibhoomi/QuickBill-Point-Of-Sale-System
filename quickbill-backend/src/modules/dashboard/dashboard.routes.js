const express = require('express');
const router  = express.Router();
const ctrl    = require('./dashboard.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { requireRole }  = require('../../middleware/role.middleware');

// All dashboard routes: owner only
router.use(authenticate, requireRole('owner'));

router.get('/summary',          ctrl.getSummary);
router.get('/revenue',          ctrl.getRevenueTrend);   // ?days=7
router.get('/top-products',     ctrl.getTopProducts);    // ?limit=10
router.get('/category-revenue', ctrl.getCategoryRevenue);

module.exports = router;
