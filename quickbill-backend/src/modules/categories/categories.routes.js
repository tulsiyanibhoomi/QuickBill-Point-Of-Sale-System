const express = require('express');
const router  = express.Router();
const ctrl    = require('./categories.controller');
const { authenticate }  = require('../../middleware/auth.middleware');
const { requireRole }   = require('../../middleware/role.middleware');

// All routes require authentication
router.use(authenticate);

router.get('/',    ctrl.getAll);                                // ANY role
router.get('/:id', ctrl.getById);                              // ANY role
router.post('/',   requireRole('owner'), ctrl.createValidation, ctrl.create);
router.put('/:id', requireRole('owner'), ctrl.update);
router.delete('/:id', requireRole('owner'), ctrl.remove);

module.exports = router;
