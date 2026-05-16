const ApiError = require('../utils/ApiError');

/**
 * Role-based access control guard.
 * Usage: requireRole('owner')
 *        requireRole('owner', 'worker')  — allow multiple roles
 */
const requireRole = (...allowedRoles) => {
  return (req, _res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized());
    }
    if (!allowedRoles.includes(req.user.role)) {
      return next(
        ApiError.forbidden(
          `Access denied. Required role: ${allowedRoles.join(' or ')}`
        )
      );
    }
    next();
  };
};

module.exports = { requireRole };
