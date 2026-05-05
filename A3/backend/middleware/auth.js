const jwt = require('jsonwebtoken');
const pool = require('../db');

// Verify JWT — applied globally on all protected routes
const verify = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token provided' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ message: 'Invalid token' });
  }
};

// Only admin can mutate
const requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin')
    return res.status(403).json({ message: 'Admin access required' });
  next();
};

// Admin or faculty can mutate
const requireAdminOrFaculty = (req, res, next) => {
  if (!['admin', 'faculty'].includes(req.user?.role))
    return res.status(403).json({ message: 'Faculty or admin access required' });
  next();
};

// Dynamic permission check against role_permissions table
const requirePermission = (resource, action) => async (req, res, next) => {
  try {
    const role = req.user?.role;
    if (!role) return res.status(401).json({ message: 'Authentication required' });

    const result = await pool.query(
      `SELECT rp.can_read, rp.can_create, rp.can_update, rp.can_delete
       FROM role_permissions rp
       JOIN roles r ON r.id = rp.role_id
       WHERE r.name = $1 AND rp.resource = $2`,
      [role, resource]
    );

    if (!result.rows.length) {
      return res.status(403).json({ message: `No access to ${resource}` });
    }

    const perm = result.rows[0];
    const actionMap = { read: 'can_read', create: 'can_create', update: 'can_update', delete: 'can_delete' };
    const col = actionMap[action];

    if (!col || !perm[col]) {
      return res.status(403).json({ message: `No ${action} permission for ${resource}` });
    }

    next();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Helper: get all permissions for a role (used during login)
const getPermissionsForRole = async (roleName) => {
  const result = await pool.query(
    `SELECT rp.resource, rp.can_read, rp.can_create, rp.can_update, rp.can_delete
     FROM role_permissions rp
     JOIN roles r ON r.id = rp.role_id
     WHERE r.name = $1`,
    [roleName]
  );
  const permissions = {};
  for (const p of result.rows) {
    permissions[p.resource] = {
      read: p.can_read,
      create: p.can_create,
      update: p.can_update,
      delete: p.can_delete
    };
  }
  return permissions;
};

// Keep default export as verify so server.js app.use(auth,...) still works
module.exports = verify;
module.exports.requireAdmin = requireAdmin;
module.exports.requireAdminOrFaculty = requireAdminOrFaculty;
module.exports.requirePermission = requirePermission;
module.exports.getPermissionsForRole = getPermissionsForRole;
