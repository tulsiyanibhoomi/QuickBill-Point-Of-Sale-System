const authService  = require('./auth.service');
const ApiResponse  = require('../../utils/ApiResponse');
const { body, validationResult } = require('express-validator');
const ApiError = require('../../utils/ApiError');

const loginValidation = [
  body('username').trim().notEmpty().withMessage('Username is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

const login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw ApiError.badRequest('Validation failed', errors.array());
    }
    const { username, password } = req.body;
    const data = await authService.login(username, password);
    return ApiResponse.success(res, data, 'Login successful');
  } catch (err) {
    next(err);
  }
};

const getMe = async (req, res, next) => {
  try {
    return ApiResponse.success(res, req.user, 'Current user');
  } catch (err) {
    next(err);
  }
};

const changePasswordValidation = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters'),
];

const changePassword = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw ApiError.badRequest('Validation failed', errors.array());
    }
    const { currentPassword, newPassword } = req.body;
    await authService.changePassword(req.user.id, currentPassword, newPassword);
    return ApiResponse.success(res, null, 'Password changed successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  loginValidation,
  login,
  getMe,
  changePasswordValidation,
  changePassword,
};
