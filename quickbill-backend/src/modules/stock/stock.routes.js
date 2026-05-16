const express = require('express');
const router  = express.Router();
const ctrl    = require('./stock.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { requireRole }  = require('../../middleware/role.middleware');

router.use(authenticate, requireRole('owner')); // All stock routes: owner only

router.get('/movements', ctrl.getMovements);
router.get('/low-stock', ctrl.getLowStock);
router.post('/adjust',   ctrl.adjustValidation, ctrl.adjustStock);
router.post('/restock-email', ctrl.generateRestockEmail);

module.exports = router;
