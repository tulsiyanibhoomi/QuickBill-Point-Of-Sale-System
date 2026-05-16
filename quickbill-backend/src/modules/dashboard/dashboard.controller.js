const svc         = require('./dashboard.service');
const stockSvc    = require('../stock/stock.service');
const ai          = require('../../utils/ai');
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

const getInsights = async (_req, res, next) => {
  try {
    const [summary, topProducts, lowStock] = await Promise.all([
      svc.getDailySummary(),
      svc.getTopProducts(3),
      stockSvc.getLowStock()
    ]);

    const dataPayload = {
      summary: {
        total_revenue: summary.total_revenue,
        total_orders: summary.total_orders,
      },
      top_products: topProducts.map(p => ({ name: p.product_name, qty_sold: p.total_qty_sold })),
      low_stock_alerts: lowStock.map(p => ({ name: p.name, current_stock: p.quantity_in_stock, min_stock: p.min_stock_level }))
    };

    const insightText = await ai.generateDashboardInsights(dataPayload);
    return ApiResponse.success(res, { insight: insightText }, 'AI Insights generated');
  } catch (err) { next(err); }
};

module.exports = { getSummary, getRevenueTrend, getTopProducts, getCategoryRevenue, getInsights };
