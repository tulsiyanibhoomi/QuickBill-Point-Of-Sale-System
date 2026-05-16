const express = require('express');
const router  = express.Router();
const ctrl    = require('./orders.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { requireRole }  = require('../../middleware/role.middleware');

router.use(authenticate);

// Worker + Owner can create orders (the core POS action)
router.post('/', ctrl.createValidation, ctrl.createOrder);

// Only owner can view all orders or update status
router.get('/',    requireRole('owner'), ctrl.getAll);
router.get('/:id', requireRole('owner'), ctrl.getById);
router.put('/:id/status', requireRole('owner'), ctrl.updateStatus);

module.exports = router;
