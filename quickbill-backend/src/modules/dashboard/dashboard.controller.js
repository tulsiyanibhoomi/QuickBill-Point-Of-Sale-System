const svc         = require('./dashboard.service');
const ApiResponse = require('../../utils/ApiResponse');

const getSummary = async (_req, res, next) => {
  try {
    const data = await svc.getDailySummary();
    return ApiResponse.success(res, data, "Today's summary");
  } catch (err) { next(err); }
};

const getRevenueTrend = async (req, res, next) => {
  try {
    const { days } = req.query;
    const data = await svc.getRevenueTrend(days);
    return ApiResponse.success(res, data, 'Revenue trend');
  } catch (err) { next(err); }
};

const getTopProducts = async (req, res, next) => {
  try {
    const { limit } = req.query;
    const data = await svc.getTopProducts(limit);
    return ApiResponse.success(res, data, 'Top products');
  } catch (err) { next(err); }
};

const getCategoryRevenue = async (_req, res, next) => {
  try {
    const data = await svc.getCategoryRevenue();
    return ApiResponse.success(res, data, 'Category revenue');
  } catch (err) { next(err); }
};

module.exports = { getSummary, getRevenueTrend, getTopProducts, getCategoryRevenue };
