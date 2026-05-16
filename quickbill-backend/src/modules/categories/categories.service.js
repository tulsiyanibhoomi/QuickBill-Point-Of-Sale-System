const pool     = require('../../config/db');
const ApiError = require('../../utils/ApiError');
const { generateDescription } = require('../../utils/ai');

const getAll = async () => {
  const [rows] = await pool.query(
    `SELECT c.*, COUNT(p.id) AS product_count
     FROM categories c
     LEFT JOIN products p ON p.category_id = c.id AND p.is_active = TRUE
     GROUP BY c.id
     ORDER BY c.name ASC`
  );
  return rows;
};

const getById = async (id) => {
  const [rows] = await pool.query('SELECT * FROM categories WHERE id = ?', [id]);
  if (!rows.length) throw ApiError.notFound('Category not found');
  return rows[0];
};

const create = async ({ name, description }) => {
  let finalDescription = description;
  if (!finalDescription || finalDescription.trim() === '') {
    const generated = await generateDescription('category', name);
    if (generated) finalDescription = generated;
  }

  const [result] = await pool.query(
    'INSERT INTO categories (name, description) VALUES (?, ?)',
    [name, finalDescription || null]
  );
  return getById(result.insertId);
};

const update = async (id, { name, description }) => {
  await getById(id); // ensure exists
  const fields = [];
  const values = [];
  if (name        !== undefined) { fields.push('name = ?');        values.push(name); }
  if (description !== undefined) { fields.push('description = ?'); values.push(description); }
  if (!fields.length) throw ApiError.badRequest('No fields to update');
  values.push(id);
  await pool.query(`UPDATE categories SET ${fields.join(', ')} WHERE id = ?`, values);
  return getById(id);
};

const remove = async (id) => {
  await getById(id);
  // Check if products are using this category
  const [products] = await pool.query(
    'SELECT COUNT(*) AS cnt FROM products WHERE category_id = ? AND is_active = TRUE',
    [id]
  );
  if (products[0].cnt > 0) {
    throw ApiError.conflict(
      'Cannot delete category: it has active products. Re-assign or deactivate products first.'
    );
  }
  await pool.query('DELETE FROM categories WHERE id = ?', [id]);
};

module.exports = { getAll, getById, create, update, remove };
