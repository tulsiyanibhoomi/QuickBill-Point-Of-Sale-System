const express = require('express');
const router  = express.Router();
const ctrl    = require('./products.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { requireRole }  = require('../../middleware/role.middleware');

router.use(authenticate);

// Both roles can READ products (workers need this to build the cart)
router.get('/',    ctrl.getAll);
router.get('/:id', ctrl.getById);

// Only owner can CREATE / UPDATE / DELETE
router.post('/suggest-price', requireRole('owner'), ctrl.suggestPrice);
router.post('/',      requireRole('owner'), ctrl.createValidation, ctrl.create);
router.put('/:id',    requireRole('owner'), ctrl.update);
router.delete('/:id', requireRole('owner'), ctrl.remove);

module.exports = router;
