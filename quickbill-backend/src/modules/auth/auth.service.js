const pool    = require('../../config/db');
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const ApiError = require('../../utils/ApiError');

/** Login: verify credentials, return JWT */
const login = async (username, password) => {
  const [rows] = await pool.query(
    'SELECT * FROM users WHERE username = ? AND is_active = TRUE',
    [username]
  );

  if (!rows.length) {
    throw ApiError.unauthorized('Invalid username or password');
  }

  const user = rows[0];
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    throw ApiError.unauthorized('Invalid username or password');
  }

  const token = jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
  );

  return {
    token,
    user: {
      id:       user.id,
      name:     user.name,
      username: user.username,
      role:     user.role,
    },
  };
};

/** Change password for the current user */
const changePassword = async (userId, currentPassword, newPassword) => {
  const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
  if (!rows.length) throw ApiError.notFound('User not found');

  const user  = rows[0];
  const valid = await bcrypt.compare(currentPassword, user.password);
  if (!valid) throw ApiError.badRequest('Current password is incorrect');

  const hashed = await bcrypt.hash(newPassword, 12);
  await pool.query('UPDATE users SET password = ? WHERE id = ?', [hashed, userId]);
};

module.exports = { login, changePassword };
