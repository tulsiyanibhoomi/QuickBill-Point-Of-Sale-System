const pool     = require('../../config/db');
const ApiError = require('../../utils/ApiError');

/**
 * Get all stock movements with optional filters.
 * @param {object} filters - { product_id, type, date_from, date_to, page, limit }
 */
const getMovements = async ({ product_id, type, date_from, date_to, page = 1, limit = 30 } = {}) => {
  const conditions = [];
  const params     = [];

  if (product_id) { conditions.push('sm.product_id = ?'); params.push(product_id); }
  if (type)       { conditions.push('sm.type = ?');       params.push(type); }
  if (date_from)  { conditions.push('sm.created_at >= ?'); params.push(date_from); }
  if (date_to)    { conditions.push('sm.created_at <= ?'); params.push(date_to + ' 23:59:59'); }

  const where  = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) AS total FROM stock_movements sm ${where}`,
    params
  );

  const [rows] = await pool.query(
    `SELECT sm.*,
            p.name AS product_name, p.sku AS product_sku,
            u.name AS created_by_name
     FROM   stock_movements sm
     JOIN   products p ON p.id = sm.product_id
     LEFT JOIN users u ON u.id = sm.created_by
     ${where}
     ORDER BY sm.created_at DESC
     LIMIT ? OFFSET ?`,
    [...params, parseInt(limit, 10), offset]
  );

  return {
    movements: rows,
    pagination: {
      total,
      page:        parseInt(page, 10),
      limit:       parseInt(limit, 10),
      total_pages: Math.ceil(total / parseInt(limit, 10)),
    },
  };
};

/** Products at or below their minimum stock level */
const getLowStock = async () => {
  const [rows] = await pool.query(
    `SELECT p.*, c.name AS category_name
     FROM   products p
     LEFT JOIN categories c ON c.id = p.category_id
     WHERE  p.is_active = TRUE
       AND  p.quantity_in_stock <= p.min_stock_level
     ORDER BY (p.quantity_in_stock - p.min_stock_level) ASC`
  );
  return rows;
};

/**
 * Manual stock adjustment (restock, damage, correction).
 * @param {number} productId
 * @param {'purchase'|'adjustment'|'damage'|'return'} type
 * @param {number} quantityChange  positive = add, negative = remove
 * @param {string} note
 * @param {number} createdBy  user id
 */
const adjustStock = async (productId, type, quantityChange, note, createdBy) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [[product]] = await conn.query(
      'SELECT id, quantity_in_stock FROM products WHERE id = ? AND is_active = TRUE FOR UPDATE',
      [productId]
    );
    if (!product) throw ApiError.notFound('Product not found');

    const before = product.quantity_in_stock;
    const after  = before + quantityChange;

    if (after < 0) {
      throw ApiError.badRequest(
        `Insufficient stock. Current: ${before}, attempted change: ${quantityChange}`
      );
    }

    await conn.query(
      'UPDATE products SET quantity_in_stock = ? WHERE id = ?',
      [after, productId]
    );

    const [mvResult] = await conn.query(
      `INSERT INTO stock_movements
         (product_id, type, quantity_change, quantity_before, quantity_after, note, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [productId, type, quantityChange, before, after, note || null, createdBy]
    );

    await conn.commit();
    return { movement_id: mvResult.insertId, product_id: productId, before, after };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

module.exports = { getMovements, getLowStock, adjustStock };
