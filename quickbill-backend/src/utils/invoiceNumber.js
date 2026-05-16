const pool = require('../config/db');

/**
 * Generates the next sequential invoice number for a given date.
 * Format: QB-YYYYMMDD-XXXX  (e.g. QB-20260516-0001)
 *
 * Uses a DB query inside a transaction-safe context — caller must pass
 * the `connection` object when inside a transaction so we don't deadlock.
 */
async function generateInvoiceNumber(connection = pool) {
  const today = new Date();
  const yyyy  = today.getUTCFullYear();
  const mm    = String(today.getUTCMonth() + 1).padStart(2, '0');
  const dd    = String(today.getUTCDate()).padStart(2, '0');
  const dateStr = `${yyyy}${mm}${dd}`;
  const prefix  = `QB-${dateStr}-`;

  // Find the highest serial for today
  const [rows] = await connection.query(
    `SELECT invoice_number FROM invoices
     WHERE invoice_number LIKE ?
     ORDER BY invoice_number DESC
     LIMIT 1`,
    [`${prefix}%`]
  );

  let serial = 1;
  if (rows.length > 0) {
    const last = rows[0].invoice_number; // e.g. QB-20260516-0042
    serial = parseInt(last.split('-')[2], 10) + 1;
  }

  return `${prefix}${String(serial).padStart(4, '0')}`;
}

module.exports = { generateInvoiceNumber };
