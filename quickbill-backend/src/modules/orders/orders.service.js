const pool = require("../../config/db");
const ApiError = require("../../utils/ApiError");
const { generateInvoiceNumber } = require("../../utils/invoiceNumber");

/**
 * Create a new order + invoice atomically.
 *
 * @param {object} orderData
 * @param {Array}  orderData.items  [{ product_id, quantity }]
 * @param {string} orderData.customer_name
 * @param {string} orderData.customer_phone
 * @param {number} orderData.discount_amount
 * @param {string} orderData.payment_method  CASH | UPI | CARD
 * @param {string} orderData.notes
 * @param {number} processedBy  user id
 */
const createOrder = async (orderData, processedBy) => {
  const {
    items,
    customer_name = null,
    customer_phone = null,
    discount_amount = 0,
    payment_method = "CASH",
    notes = null,
  } = orderData;

  if (!items || !items.length) {
    throw ApiError.badRequest("Order must contain at least one item");
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // ── 1. Lock and validate all products ─────────────────────
    const productIds = items.map((i) => i.product_id);
    const [products] = await conn.query(
      `SELECT id, name, sku, selling_price, tax_rate, quantity_in_stock, is_active
       FROM   products
       WHERE  id IN (?) FOR UPDATE`,
      [productIds],
    );

    const productMap = {};
    for (const p of products) productMap[p.id] = p;

    // Validate each item
    for (const item of items) {
      const p = productMap[item.product_id];
      if (!p || !p.is_active) {
        throw ApiError.badRequest(
          `Product ID ${item.product_id} not found or inactive`,
        );
      }
      if (item.quantity <= 0) {
        throw ApiError.badRequest(
          `Quantity for "${p.name}" must be at least 1`,
        );
      }
      if (p.quantity_in_stock < item.quantity) {
        throw ApiError.badRequest(
          `Insufficient stock for "${p.name}". Available: ${p.quantity_in_stock}, Requested: ${item.quantity}`,
        );
      }
    }

    // ── 2. Calculate totals ────────────────────────────────────
    let subtotal = 0;
    let tax_amount = 0;

    const orderItems = items.map((item) => {
      const p = productMap[item.product_id];
      const unitPrice = parseFloat(p.selling_price);
      const taxRate = parseFloat(p.tax_rate);
      const itemTax = parseFloat(((unitPrice * taxRate) / 100).toFixed(2));
      const lineTotal = parseFloat(
        ((unitPrice + itemTax) * item.quantity).toFixed(2),
      );

      subtotal += unitPrice * item.quantity;
      tax_amount += itemTax * item.quantity;

      return {
        product_id: p.id,
        product_name: p.name,
        product_sku: p.sku || null,
        quantity: item.quantity,
        unit_price: unitPrice,
        tax_rate: taxRate,
        tax_amount: parseFloat((itemTax * item.quantity).toFixed(2)),
        line_total: lineTotal,
      };
    });

    subtotal = parseFloat(subtotal.toFixed(2));
    tax_amount = parseFloat(tax_amount.toFixed(2));
    const discAmt = parseFloat(parseFloat(discount_amount || 0).toFixed(2));
    const grandTotal = parseFloat((subtotal + tax_amount - discAmt).toFixed(2));

    if (grandTotal < 0) {
      throw ApiError.badRequest("Discount cannot exceed the order total");
    }

    // ── 3. Insert order ────────────────────────────────────────
    const [orderResult] = await conn.query(
      `INSERT INTO orders
         (customer_name, customer_phone, subtotal, discount_amount,
          tax_amount, grand_total, payment_method, notes, processed_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        customer_name,
        customer_phone,
        subtotal,
        discAmt,
        tax_amount,
        grandTotal,
        payment_method,
        notes,
        processedBy,
      ],
    );
    const orderId = orderResult.insertId;

    // ── 4. Insert order items ──────────────────────────────────
    for (const oi of orderItems) {
      await conn.query(
        `INSERT INTO order_items
           (order_id, product_id, product_name, product_sku,
            quantity, unit_price, tax_rate, tax_amount, line_total)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          orderId,
          oi.product_id,
          oi.product_name,
          oi.product_sku,
          oi.quantity,
          oi.unit_price,
          oi.tax_rate,
          oi.tax_amount,
          oi.line_total,
        ],
      );
    }

    // ── 5. Decrement stock + write stock_movements ─────────────
    for (const item of items) {
      const p = productMap[item.product_id];
      const before = p.quantity_in_stock;
      const after = before - item.quantity;

      await conn.query(
        "UPDATE products SET quantity_in_stock = ? WHERE id = ?",
        [after, p.id],
      );

      await conn.query(
        `INSERT INTO stock_movements
           (product_id, type, quantity_change, quantity_before, quantity_after,
            reference_id, note, created_by)
         VALUES (?, 'sale', ?, ?, ?, ?, 'Sale', ?)`,
        [p.id, -item.quantity, before, after, orderId, processedBy],
      );
    }

    // ── 6. Generate invoice ────────────────────────────────────
    const invoiceNumber = await generateInvoiceNumber(conn);
    await conn.query(
      "INSERT INTO invoices (invoice_number, order_id) VALUES (?, ?)",
      [invoiceNumber, orderId],
    );

    await conn.commit();

    // Return full invoice data for printing
    return getOrderById(orderId);
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

const getOrderById = async (id) => {
  const [[order]] = await pool.query(
    `SELECT o.*,
            u.name AS cashier_name,
            i.invoice_number,
            i.generated_at AS invoice_date
     FROM   orders o
     LEFT JOIN users    u ON u.id = o.processed_by
     LEFT JOIN invoices i ON i.order_id = o.id
     WHERE  o.id = ?`,
    [id],
  );
  if (!order) throw ApiError.notFound("Order not found");

  const [items] = await pool.query(
    "SELECT * FROM order_items WHERE order_id = ? ORDER BY id ASC",
    [id],
  );

  return { ...order, items };
};

const getAllOrders = async ({
  status,
  date_from,
  date_to,
  page = 1,
  limit = 20,
} = {}) => {
  const conditions = [];
  const params = [];

  let from = date_from ? new Date(date_from) : null;
  let to = date_to ? new Date(date_to) : null;

  if (from && to && to < from) {
    [from, to] = [to, from];
  }

  if (status) {
    conditions.push("o.order_status = ?");
    params.push(status);
  }
  if (from) {
    conditions.push("o.created_at >= ?");
    params.push(from);
  }
  if (to) {
    conditions.push("o.created_at <= ?");
    params.push(to + " 23:59:59");
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) AS total FROM orders o ${where}`,
    params,
  );

  const [rows] = await pool.query(
    `SELECT o.*,
            u.name AS cashier_name,
            i.invoice_number
     FROM   orders o
     LEFT JOIN users    u ON u.id = o.processed_by
     LEFT JOIN invoices i ON i.order_id = o.id
     ${where}
     ORDER BY o.created_at DESC
     LIMIT ? OFFSET ?`,
    [...params, parseInt(limit, 10), offset],
  );

  return {
    orders: rows,
    pagination: {
      total,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      total_pages: Math.ceil(total / parseInt(limit, 10)),
    },
  };
};

const updateOrderStatus = async (id, status) => {
  const [[order]] = await pool.query("SELECT id FROM orders WHERE id = ?", [
    id,
  ]);
  if (!order) throw ApiError.notFound("Order not found");

  await pool.query("UPDATE orders SET order_status = ? WHERE id = ?", [
    status,
    id,
  ]);
  return getOrderById(id);
};

module.exports = { createOrder, getOrderById, getAllOrders, updateOrderStatus };
