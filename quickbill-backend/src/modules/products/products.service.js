const pool     = require('../../config/db');
const ApiError = require('../../utils/ApiError');
const { generateDescription } = require('../../utils/ai');

const BASE_SELECT = `
  SELECT p.*,
         c.name AS category_name
  FROM   products p
  LEFT JOIN categories c ON c.id = p.category_id
`;

const getAll = async ({ search, category_id, low_stock, page = 1, limit = 20 } = {}) => {
  const conditions = [];
  const params     = [];

  conditions.push('p.is_active = TRUE');

  if (search) {
    conditions.push('(p.name LIKE ? OR p.sku LIKE ? OR p.barcode LIKE ?)');
    const like = `%${search}%`;
    params.push(like, like, like);
  }
  if (category_id) {
    conditions.push('p.category_id = ?');
    params.push(category_id);
  }
  if (low_stock === 'true' || low_stock === true) {
    conditions.push('p.quantity_in_stock <= p.min_stock_level');
  }

  const where   = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const offset  = (parseInt(page, 10) - 1) * parseInt(limit, 10);

  // Total count
  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) AS total FROM products p ${where}`,
    params
  );

  const [rows] = await pool.query(
    `${BASE_SELECT} ${where} ORDER BY p.name ASC LIMIT ? OFFSET ?`,
    [...params, parseInt(limit, 10), offset]
  );

  return {
    products: rows,
    pagination: {
      total,
      page:        parseInt(page, 10),
      limit:       parseInt(limit, 10),
      total_pages: Math.ceil(total / parseInt(limit, 10)),
    },
  };
};

const getById = async (id) => {
  const [rows] = await pool.query(
    `${BASE_SELECT} WHERE p.id = ?`,
    [id]
  );
  if (!rows.length) throw ApiError.notFound('Product not found');
  return rows[0];
};

const create = async (data, createdBy) => {
  const {
    name, sku, barcode, category_id, description,
    unit, selling_price, cost_price, tax_rate,
    quantity_in_stock, min_stock_level,
  } = data;

  const conn = await require('../../config/db').getConnection();
  try {
    let finalDescription = description;
    if (!finalDescription || finalDescription.trim() === '') {
      const generated = await generateDescription('product', name);
      if (generated) finalDescription = generated;
    }

    await conn.beginTransaction();

    const [result] = await conn.query(
      `INSERT INTO products
         (name, sku, barcode, category_id, description, unit,
          selling_price, cost_price, tax_rate, quantity_in_stock, min_stock_level)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        sku         || null,
        barcode     || null,
        category_id || null,
        finalDescription || null,
        unit        || 'piece',
        selling_price,
        cost_price  || null,
        tax_rate    !== undefined ? tax_rate : 18.00,
        quantity_in_stock  || 0,
        min_stock_level    || 5,
      ]
    );

    const productId = result.insertId;
    const qty       = parseInt(quantity_in_stock || 0, 10);

    // If opening stock > 0, record as a purchase movement
    if (qty > 0) {
      await conn.query(
        `INSERT INTO stock_movements
           (product_id, type, quantity_change, quantity_before, quantity_after, note, created_by)
         VALUES (?, 'purchase', ?, 0, ?, 'Opening stock', ?)`,
        [productId, qty, qty, createdBy]
      );
    }

    await conn.commit();
    return getById(productId);
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

const update = async (id, data) => {
  await getById(id); // ensure exists

  const allowed = [
    'name', 'sku', 'barcode', 'category_id', 'description',
    'unit', 'selling_price', 'cost_price', 'tax_rate', 'min_stock_level',
  ];

  const fields = [];
  const values = [];
  for (const key of allowed) {
    if (data[key] !== undefined) {
      fields.push(`${key} = ?`);
      values.push(data[key]);
    }
  }
  if (!fields.length) throw ApiError.badRequest('No valid fields to update');
  values.push(id);

  await pool.query(`UPDATE products SET ${fields.join(', ')} WHERE id = ?`, values);
  return getById(id);
};

const softDelete = async (id) => {
  await getById(id);
  await pool.query('UPDATE products SET is_active = FALSE WHERE id = ?', [id]);
};

module.exports = { getAll, getById, create, update, softDelete };
