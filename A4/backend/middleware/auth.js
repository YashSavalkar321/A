const jwt  = require('jsonwebtoken');
const pool = require('../config/database');

// Verify JWT (from cookie or Authorization header) and attach user to request
async function authenticate(req, res, next) {
  const token = req.cookies?.token ||
    (req.headers['authorization'] && req.headers['authorization'].split(' ')[1]);
  if (!token) return res.status(401).json({ message: 'No token provided' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_key');
    const { rows } = await pool.query(
      'SELECT id, full_name, email, role, is_active FROM users WHERE id = $1 AND is_active = true',
      [decoded.userId]
    );
    if (!rows.length) return res.status(401).json({ message: 'User not found or inactive' });
    req.user = rows[0];
    next();
  } catch {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
}

// Role guard middleware factory
function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.user?.role)) {
      return res.status(403).json({ message: 'Forbidden: insufficient role' });
    }
    next();
  };
}

module.exports = { authenticate, authorize };
