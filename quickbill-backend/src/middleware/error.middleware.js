const ApiError = require('../utils/ApiError');

/** Catch-all for undefined routes */
const notFound = (req, _res, next) => {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
};

/** Central error handler */
const errorHandler = (err, _req, res, _next) => {
  // Known API errors
  if (err.isApiError) {
    const body = { success: false, message: err.message };
    if (err.errors && err.errors.length) body.errors = err.errors;
    return res.status(err.statusCode).json(body);
  }

  // MySQL duplicate entry
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({
      success: false,
      message: 'A record with this value already exists',
    });
  }

  // Unhandled errors
  console.error('UNHANDLED ERROR:', err);
  return res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message,
  });
};

module.exports = { notFound, errorHandler };
