const jwt     = require('jsonwebtoken');
const pool    = require('../config/db');
const ApiError = require('../utils/ApiError');

/**
 * Verifies the Bearer JWT in Authorization header.
 * Attaches the full user row to req.user.
 */
const authenticate = async (req, _res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(ApiError.unauthorized('No token provided'));
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return next(ApiError.unauthorized('Token has expired'));
      }
      return next(ApiError.unauthorized('Invalid token'));
    }

    // Fetch fresh user from DB (catches deactivated accounts)
    const [rows] = await pool.query(
      'SELECT id, name, username, role, is_active FROM users WHERE id = ?',
      [decoded.id]
    );

    if (!rows.length || !rows[0].is_active) {
      return next(ApiError.unauthorized('Account not found or deactivated'));
    }

    req.user = rows[0];
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = { authenticate };
