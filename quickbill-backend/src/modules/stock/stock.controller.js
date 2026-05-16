const svc         = require('./stock.service');
const ApiResponse = require('../../utils/ApiResponse');
const ApiError    = require('../../utils/ApiError');
const ai          = require('../../utils/ai');
const { body, validationResult } = require('express-validator');

const VALID_TYPES = ['purchase', 'adjustment', 'damage', 'return'];

const adjustValidation = [
  body('product_id').isInt({ min: 1 }).withMessage('Valid product_id is required'),
  body('type')
    .isIn(VALID_TYPES)
    .withMessage(`Type must be one of: ${VALID_TYPES.join(', ')}`),
  body('quantity_change')
    .isInt()
    .not().equals('0')
    .withMessage('quantity_change must be a non-zero integer (positive=add, negative=remove)'),
];

const getMovements = async (req, res, next) => {
  try {
    const { product_id, type, date_from, date_to, page, limit } = req.query;
    const data = await svc.getMovements({ product_id, type, date_from, date_to, page, limit });
    return ApiResponse.success(res, data.movements, 'Stock movements', 200, data.pagination);
  } catch (err) { next(err); }
};

const getLowStock = async (_req, res, next) => {
  try {
    const data = await svc.getLowStock();
    return ApiResponse.success(res, data, 'Low stock products');
  } catch (err) { next(err); }
};

const adjustStock = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) throw ApiError.badRequest('Validation failed', errors.array());

    const { product_id, type, quantity_change, note } = req.body;
    const data = await svc.adjustStock(
      product_id, type, parseInt(quantity_change, 10), note, req.user.id
    );
    return ApiResponse.success(res, data, 'Stock adjusted successfully');
  } catch (err) { next(err); }
};

const generateRestockEmail = async (req, res, next) => {
  try {
    const { products } = req.body;
    if (!products || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ success: false, message: 'Products array is required' });
    }
    const emailDraft = await ai.generateRestockEmail(products);
    return ApiResponse.success(res, { emailDraft }, 'Restock email generated');
  } catch (err) { next(err); }
};

module.exports = { adjustValidation, getMovements, getLowStock, adjustStock, generateRestockEmail };
