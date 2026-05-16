const svc         = require('./orders.service');
const ApiResponse = require('../../utils/ApiResponse');
const ApiError    = require('../../utils/ApiError');
const { body, validationResult } = require('express-validator');

const createValidation = [
  body('items')
    .isArray({ min: 1 })
    .withMessage('items must be a non-empty array'),
  body('items.*.product_id')
    .isInt({ min: 1 })
    .withMessage('Each item must have a valid product_id'),
  body('items.*.quantity')
    .isInt({ min: 1 })
    .withMessage('Each item quantity must be at least 1'),
  body('discount_amount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('discount_amount must be a positive number'),
  body('payment_method')
    .optional()
    .isIn(['CASH', 'UPI', 'CARD'])
    .withMessage('payment_method must be CASH, UPI, or CARD'),
];

const createOrder = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) throw ApiError.badRequest('Validation failed', errors.array());

    const data = await svc.createOrder(req.body, req.user.id);
    return ApiResponse.created(res, data, 'Order created & invoice generated');
  } catch (err) { next(err); }
};

const getAll = async (req, res, next) => {
  try {
    const { status, date_from, date_to, page, limit } = req.query;
    const data = await svc.getAllOrders({ status, date_from, date_to, page, limit });
    return ApiResponse.success(res, data.orders, 'Orders retrieved', 200, data.pagination);
  } catch (err) { next(err); }
};

const getById = async (req, res, next) => {
  try {
    const data = await svc.getOrderById(req.params.id);
    return ApiResponse.success(res, data);
  } catch (err) { next(err); }
};

const updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['completed', 'void'].includes(status)) {
      throw ApiError.badRequest('status must be "completed" or "void"');
    }
    const data = await svc.updateOrderStatus(req.params.id, status);
    return ApiResponse.success(res, data, 'Order status updated');
  } catch (err) { next(err); }
};

module.exports = { createValidation, createOrder, getAll, getById, updateStatus };
