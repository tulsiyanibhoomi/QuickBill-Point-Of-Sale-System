const pool = require('../../config/db');

/** Today's KPIs */
const getDailySummary = async () => {
  const [[today]] = await pool.query(`
    SELECT
      COUNT(*)                                          AS total_orders,
      COALESCE(SUM(grand_total), 0)                    AS total_revenue,
      COALESCE(SUM(tax_amount), 0)                     AS total_tax,
      COALESCE(SUM(discount_amount), 0)                AS total_discounts,
      COUNT(CASE WHEN payment_method = 'CASH' THEN 1 END) AS cash_orders,
      COUNT(CASE WHEN payment_method = 'UPI'  THEN 1 END) AS upi_orders,
      COUNT(CASE WHEN payment_method = 'CARD' THEN 1 END) AS card_orders
    FROM orders
    WHERE DATE(created_at) = CURDATE()
      AND order_status = 'completed'
  `);

  // Low stock alert count
  const [[{ low_stock_count }]] = await pool.query(`
    SELECT COUNT(*) AS low_stock_count
    FROM   products
    WHERE  is_active = TRUE
      AND  quantity_in_stock <= min_stock_level
  `);

  // Total active products
  const [[{ total_products }]] = await pool.query(
    "SELECT COUNT(*) AS total_products FROM products WHERE is_active = TRUE"
  );

  return { ...today, low_stock_count, total_products };
};

/**
 * Revenue trend: daily totals for last N days
 * @param {number} days  default 7
 */
const getRevenueTrend = async (days = 7) => {
  const [rows] = await pool.query(
    `SELECT
       DATE(created_at)              AS sale_date,
       COUNT(*)                      AS orders,
       COALESCE(SUM(grand_total), 0) AS revenue
     FROM   orders
     WHERE  order_status = 'completed'
       AND  created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
     GROUP BY DATE(created_at)
     ORDER BY sale_date ASC`,
    [parseInt(days, 10)]
  );
  return rows;
};

/**
 * Top N best-selling products by quantity sold
 * @param {number} limit  default 10
 */
const getTopProducts = async (limit = 10) => {
  const [rows] = await pool.query(
    `SELECT
       oi.product_id,
       oi.product_name,
       p.sku,
       c.name  AS category_name,
       SUM(oi.quantity)    AS total_qty_sold,
       SUM(oi.line_total)  AS total_revenue
     FROM   order_items oi
     JOIN   orders o  ON o.id  = oi.order_id
     LEFT JOIN products   p ON p.id  = oi.product_id
     LEFT JOIN categories c ON c.id  = p.category_id
     WHERE  o.order_status = 'completed'
     GROUP BY oi.product_id, oi.product_name, p.sku, c.name
     ORDER BY total_qty_sold DESC
     LIMIT ?`,
    [parseInt(limit, 10)]
  );
  return rows;
};

/**
 * Category-level revenue breakdown
 */
const getCategoryRevenue = async () => {
  const [rows] = await pool.query(`
    SELECT
      COALESCE(c.name, 'Uncategorised') AS category,
      SUM(oi.quantity)                  AS total_qty_sold,
      SUM(oi.line_total)                AS total_revenue
    FROM   order_items oi
    JOIN   orders      o  ON o.id  = oi.order_id
    LEFT JOIN products p  ON p.id  = oi.product_id
    LEFT JOIN categories c ON c.id = p.category_id
    WHERE  o.order_status = 'completed'
    GROUP BY c.name
    ORDER BY total_revenue DESC
  `);
  return rows;
};

module.exports = { getDailySummary, getRevenueTrend, getTopProducts, getCategoryRevenue };
