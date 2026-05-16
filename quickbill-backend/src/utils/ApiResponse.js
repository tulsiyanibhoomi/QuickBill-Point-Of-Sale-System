/**
 * Standard API response wrapper.
 * Ensures every response has the same shape:
 * { success, message, data, meta? }
 */
class ApiResponse {
  static success(res, data = null, message = 'Success', statusCode = 200, meta = null) {
    const body = { success: true, message, data };
    if (meta) body.meta = meta;
    return res.status(statusCode).json(body);
  }

  static created(res, data, message = 'Created successfully') {
    return ApiResponse.success(res, data, message, 201);
  }

  static error(res, message = 'Something went wrong', statusCode = 500, errors = []) {
    const body = { success: false, message };
    if (errors.length) body.errors = errors;
    return res.status(statusCode).json(body);
  }
}

module.exports = ApiResponse;
