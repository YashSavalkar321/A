const express = require('express');
const router = express.Router();
const pool = require('../db');
const { requireAdmin } = require('../middleware/auth');

// All resources that can be configured in permissions
const ALL_RESOURCES = [
  'dashboard', 'classroom', 'department', 'course', 'instructor',
  'student', 'section', 'teaches', 'takes', 'advisor',
  'timeslot', 'prereq', 'report', 'users', 'export', 'roles'
];

// GET all roles with user counts
router.get('/', async (req, res) => {
  try {
    const r = await pool.query(`
      SELECT r.*, 
             (SELECT COUNT(*) FROM users u WHERE u.role = r.name) AS user_count
      FROM roles r
      ORDER BY r.is_system DESC, r.name
    `);
    res.json(r.rows);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// GET available resources list
router.get('/resources', async (req, res) => {
  res.json(ALL_RESOURCES);
});

// GET permissions for a single role
router.get('/:id/permissions', async (req, res) => {
  try {
    const r = await pool.query(
      'SELECT * FROM role_permissions WHERE role_id = $1 ORDER BY resource',
      [req.params.id]
    );
    res.json(r.rows);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// GET permissions for a role by name (used by auth)
router.get('/by-name/:name/permissions', async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT rp.resource, rp.can_read, rp.can_create, rp.can_update, rp.can_delete
       FROM role_permissions rp
       JOIN roles ro ON ro.id = rp.role_id
       WHERE ro.name = $1
       ORDER BY rp.resource`,
      [req.params.name]
    );
    const permissions = {};
    for (const p of r.rows) {
      permissions[p.resource] = {
        read: p.can_read,
        create: p.can_create,
        update: p.can_update,
        delete: p.can_delete
      };
    }
    res.json(permissions);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// CREATE role
router.post('/', requireAdmin, async (req, res) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ message: 'Role name is required' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const r = await client.query(
      'INSERT INTO roles (name, description, is_system) VALUES ($1, $2, FALSE) RETURNING *',
      [name.toLowerCase().trim(), description || '']
    );
    const role = r.rows[0];

    // Optionally insert default empty permissions for all resources
    for (const resource of ALL_RESOURCES) {
      await client.query(
        `INSERT INTO role_permissions (role_id, resource, can_read, can_create, can_update, can_delete)
         VALUES ($1, $2, FALSE, FALSE, FALSE, FALSE)
         ON CONFLICT (role_id, resource) DO NOTHING`,
        [role.id, resource]
      );
    }

    await client.query('COMMIT');
    res.status(201).json(role);
  } catch (e) {
    await client.query('ROLLBACK');
    res.status(500).json({ message: e.message });
  } finally {
    client.release();
  }
});

// UPDATE role (name, description — can't change system roles' names)
router.put('/:id', requireAdmin, async (req, res) => {
  const { name, description } = req.body;
  try {
    // Check if system role
    const check = await pool.query('SELECT is_system, name FROM roles WHERE id = $1', [req.params.id]);
    if (!check.rows.length) return res.status(404).json({ message: 'Role not found' });

    const role = check.rows[0];
    if (role.is_system && name && name !== role.name) {
      return res.status(400).json({ message: 'Cannot rename system roles' });
    }

    const updates = [];
    const values = [];
    let idx = 1;

    if (name && !role.is_system) {
      updates.push(`name = $${idx++}`);
      values.push(name.toLowerCase().trim());
    }
    if (description !== undefined) {
      updates.push(`description = $${idx++}`);
      values.push(description);
    }

    if (!updates.length) return res.json(role);

    values.push(req.params.id);
    const r = await pool.query(
      `UPDATE roles SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );

    // If role was renamed, update users table too
    if (name && !role.is_system && name !== role.name) {
      await pool.query('UPDATE users SET role = $1 WHERE role = $2', [name.toLowerCase().trim(), role.name]);
    }

    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// DELETE role (only non-system roles)
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const check = await pool.query('SELECT is_system, name FROM roles WHERE id = $1', [req.params.id]);
    if (!check.rows.length) return res.status(404).json({ message: 'Role not found' });
    if (check.rows[0].is_system) return res.status(400).json({ message: 'Cannot delete system roles' });

    // Check if any users still have this role
    const users = await pool.query('SELECT COUNT(*) FROM users WHERE role = $1', [check.rows[0].name]);
    if (parseInt(users.rows[0].count) > 0) {
      return res.status(400).json({ message: 'Cannot delete role — users are still assigned to it' });
    }

    await pool.query('DELETE FROM roles WHERE id = $1', [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// UPDATE permissions for a role (bulk update)
router.put('/:id/permissions', requireAdmin, async (req, res) => {
  const { permissions } = req.body; // { resource: { read, create, update, delete }, ... }
  if (!permissions || typeof permissions !== 'object') {
    return res.status(400).json({ message: 'Permissions object is required' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    for (const [resource, perms] of Object.entries(permissions)) {
      if (!ALL_RESOURCES.includes(resource)) continue;
      await client.query(
        `INSERT INTO role_permissions (role_id, resource, can_read, can_create, can_update, can_delete)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (role_id, resource)
         DO UPDATE SET can_read = $3, can_create = $4, can_update = $5, can_delete = $6`,
        [
          req.params.id, resource,
          !!perms.read, !!perms.create, !!perms.update, !!perms.delete
        ]
      );
    }

    await client.query('COMMIT');
    res.json({ message: 'Permissions updated' });
  } catch (e) {
    await client.query('ROLLBACK');
    res.status(500).json({ message: e.message });
  } finally {
    client.release();
  }
});

module.exports = router;
