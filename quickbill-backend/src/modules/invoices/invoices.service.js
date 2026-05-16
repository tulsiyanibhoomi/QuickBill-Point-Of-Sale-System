const pool     = require('../../config/db');
const ApiError = require('../../utils/ApiError');

const getAll = async ({ page = 1, limit = 20, date_from, date_to } = {}) => {
  const conditions = [];
  const params     = [];

  if (date_from) { conditions.push('i.generated_at >= ?'); params.push(date_from); }
  if (date_to)   { conditions.push('i.generated_at <= ?'); params.push(date_to + ' 23:59:59'); }

  const where  = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) AS total FROM invoices i ${where}`,
    params
  );

  const [rows] = await pool.query(
    `SELECT i.*,
            o.customer_name, o.grand_total,
            o.payment_method, o.order_status,
            u.name AS cashier_name
     FROM   invoices i
     JOIN   orders o ON o.id = i.order_id
     LEFT JOIN users u ON u.id = o.processed_by
     ${where}
     ORDER BY i.generated_at DESC
     LIMIT ? OFFSET ?`,
    [...params, parseInt(limit, 10), offset]
  );

  return {
    invoices: rows,
    pagination: {
      total,
      page:        parseInt(page, 10),
      limit:       parseInt(limit, 10),
      total_pages: Math.ceil(total / parseInt(limit, 10)),
    },
  };
};

/** Full invoice detail including all line items — used for print/view */
const getById = async (id) => {
  const [[invoice]] = await pool.query(
    `SELECT i.*,
            o.customer_name, o.customer_phone,
            o.subtotal, o.discount_amount, o.tax_amount, o.grand_total,
            o.payment_method, o.payment_status, o.order_status,
            o.notes, o.created_at AS order_date,
            u.name AS cashier_name
     FROM   invoices i
     JOIN   orders o ON o.id = i.order_id
     LEFT JOIN users u ON u.id = o.processed_by
     WHERE  i.id = ?`,
    [id]
  );
  if (!invoice) throw ApiError.notFound('Invoice not found');

  const [items] = await pool.query(
    `SELECT oi.*
     FROM   order_items oi
     WHERE  oi.order_id = ?
     ORDER BY oi.id ASC`,
    [invoice.order_id]
  );

  return { ...invoice, items };
};

const getByInvoiceNumber = async (invoiceNumber) => {
  const [[inv]] = await pool.query(
    'SELECT id FROM invoices WHERE invoice_number = ?',
    [invoiceNumber]
  );
  if (!inv) throw ApiError.notFound('Invoice not found');
  return getById(inv.id);
};

/**
 * Returns fully structured invoice JSON ready for PDF rendering.
 * Includes store info from env variables.
 */
const getPdfData = async (id) => {
  const invoice = await getById(id);

  return {
    store: {
      name:    process.env.STORE_NAME    || 'QuickBill Store',
      address: process.env.STORE_ADDRESS || '',
      phone:   process.env.STORE_PHONE   || '',
      gst:     process.env.STORE_GST     || '',
    },
    invoice: {
      invoice_number: invoice.invoice_number,
      invoice_date:   invoice.generated_at,
      order_date:     invoice.order_date,
    },
    customer: {
      name:  invoice.customer_name  || 'Walk-in Customer',
      phone: invoice.customer_phone || '',
    },
    cashier:       invoice.cashier_name,
    items:         invoice.items,
    payment: {
      method:        invoice.payment_method,
      status:        invoice.payment_status,
    },
    totals: {
      subtotal:        parseFloat(invoice.subtotal),
      discount_amount: parseFloat(invoice.discount_amount),
      tax_amount:      parseFloat(invoice.tax_amount),
      grand_total:     parseFloat(invoice.grand_total),
    },
    order_status: invoice.order_status,
    notes:        invoice.notes,
  };
};

module.exports = { getAll, getById, getByInvoiceNumber, getPdfData };
