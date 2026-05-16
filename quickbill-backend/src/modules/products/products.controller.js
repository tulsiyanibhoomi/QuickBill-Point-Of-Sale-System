const svc         = require('./products.service');
const ApiResponse = require('../../utils/ApiResponse');
const ApiError    = require('../../utils/ApiError');
const { body, validationResult } = require('express-validator');

const createValidation = [
  body('name').trim().notEmpty().withMessage('Product name is required'),
  body('selling_price')
    .isFloat({ min: 0 }).withMessage('Selling price must be a positive number'),
  body('tax_rate')
    .optional()
    .isFloat({ min: 0, max: 100 }).withMessage('Tax rate must be between 0 and 100'),
  body('quantity_in_stock')
    .optional()
    .isInt({ min: 0 }).withMessage('Stock quantity must be a non-negative integer'),
];

const getAll = async (req, res, next) => {
  try {
    const { search, category_id, low_stock, page, limit } = req.query;
    const data = await svc.getAll({ search, category_id, low_stock, page, limit });
    return ApiResponse.success(res, data.products, 'Products retrieved', 200, data.pagination);
  } catch (err) { next(err); }
};

const getById = async (req, res, next) => {
  try {
    const data = await svc.getById(req.params.id);
    return ApiResponse.success(res, data);
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) throw ApiError.badRequest('Validation failed', errors.array());
    const data = await svc.create(req.body, req.user.id);
    return ApiResponse.created(res, data, 'Product created');
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    const data = await svc.update(req.params.id, req.body);
    return ApiResponse.success(res, data, 'Product updated');
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    await svc.softDelete(req.params.id);
    return ApiResponse.success(res, null, 'Product deactivated');
  } catch (err) { next(err); }
};

module.exports = { createValidation, getAll, getById, create, update, remove };
