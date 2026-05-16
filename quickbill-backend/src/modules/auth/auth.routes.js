const express = require('express');
const router  = express.Router();
const ctrl    = require('./auth.controller');
const { authenticate } = require('../../middleware/auth.middleware');

// POST /api/auth/login
router.post('/login', ctrl.loginValidation, ctrl.login);

// GET /api/auth/me  (any authenticated user)
router.get('/me', authenticate, ctrl.getMe);

// PUT /api/auth/change-password  (any authenticated user)
router.put('/change-password', authenticate, ctrl.changePasswordValidation, ctrl.changePassword);

module.exports = router;
