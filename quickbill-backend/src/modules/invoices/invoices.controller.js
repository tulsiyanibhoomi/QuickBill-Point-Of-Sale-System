const svc         = require('./invoices.service');
const ApiResponse = require('../../utils/ApiResponse');
const ai          = require('../../utils/ai');

const getAll = async (req, res, next) => {
  try {
    const { page, limit, date_from, date_to } = req.query;
    const data = await svc.getAll({ page, limit, date_from, date_to });
    return ApiResponse.success(res, data.invoices, 'Invoices retrieved', 200, data.pagination);
  } catch (err) { next(err); }
};

const getById = async (req, res, next) => {
  try {
    const data = await svc.getById(req.params.id);
    return ApiResponse.success(res, data);
  } catch (err) { next(err); }
};

const getByNumber = async (req, res, next) => {
  try {
    const data = await svc.getByInvoiceNumber(req.params.invoiceNumber);
    return ApiResponse.success(res, data);
  } catch (err) { next(err); }
};

const getPdfData = async (req, res, next) => {
  try {
    const data = await svc.getPdfData(req.params.id);
    return ApiResponse.success(res, data, 'Invoice PDF data');
  } catch (err) { next(err); }
};

const generatePromoSMS = async (req, res, next) => {
  try {
    const data = await svc.getPdfData(req.params.id);
    const smsDraft = await ai.generatePromoSMS(data);
    return ApiResponse.success(res, { smsDraft }, 'Promo SMS generated');
  } catch (err) { next(err); }
};

module.exports = { getAll, getById, getByNumber, getPdfData, generatePromoSMS };
