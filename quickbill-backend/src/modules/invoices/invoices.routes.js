const express = require('express');
const router  = express.Router();
const ctrl    = require('./invoices.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { requireRole }  = require('../../middleware/role.middleware');

router.use(authenticate);

// Owner: list all invoices
router.get('/', requireRole('owner'), ctrl.getAll);

// Both roles: view a specific invoice (worker needs it to show the receipt after billing)
router.get('/number/:invoiceNumber', ctrl.getByNumber);
router.get('/:id',                  ctrl.getById);
router.get('/:id/pdf-data',         ctrl.getPdfData);

module.exports = router;
