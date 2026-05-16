const svc         = require('./categories.service');
const ApiResponse = require('../../utils/ApiResponse');
const ApiError    = require('../../utils/ApiError');
const { body, validationResult } = require('express-validator');

const createValidation = [
  body('name').trim().notEmpty().withMessage('Category name is required'),
];

const getAll = async (_req, res, next) => {
  try {
    const data = await svc.getAll();
    return ApiResponse.success(res, data, 'Categories retrieved');
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
    const data = await svc.create(req.body);
    return ApiResponse.created(res, data, 'Category created');
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    const data = await svc.update(req.params.id, req.body);
    return ApiResponse.success(res, data, 'Category updated');
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    await svc.remove(req.params.id);
    return ApiResponse.success(res, null, 'Category deleted');
  } catch (err) { next(err); }
};

module.exports = { createValidation, getAll, getById, create, update, remove };
