const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const pool = require('../db');
const authMiddleware = require('../middleware/auth');
const { requireAdmin, requirePermission, getPermissionsForRole } = authMiddleware;
const verify = authMiddleware; // JWT verify middleware

// Login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    if (!result.rows.length) return res.status(401).json({ message: 'Invalid credentials' });
    const user = result.rows[0];
    if (password !== user.password) return res.status(401).json({ message: 'Invalid credentials' });
    const payload = { id: user.id, username: user.username, role: user.role, profile_id: user.profile_id || null };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '8h' });
    // Fetch role permissions
    let permissions = {};
    try { permissions = await getPermissionsForRole(user.role); } catch (_) {}
    res.json({ token, user: payload, permissions });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Public: get department list (needed for signup form dropdown)
router.get('/departments', async (req, res) => {
  try {
    const r = await pool.query('SELECT dept_name FROM department ORDER BY dept_name');
    res.json(r.rows.map(r => r.dept_name));
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Public Signup (student or faculty only)
router.post('/signup', async (req, res) => {
  const { username, password, role, profile } = req.body;
  if (!username || !password || !role) {
    return res.status(400).json({ message: 'Username, password and role are required' });
  }
  if (!['student', 'faculty'].includes(role)) {
    return res.status(403).json({ message: 'Self-registration is only allowed for student or faculty roles' });
  }

  // Validate profile fields
  if (!profile || !profile.id || !profile.name || !profile.dept_name) {
    return res.status(400).json({ message: 'Profile details (ID, name, department) are required' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Check duplicate username
    const exists = await client.query('SELECT id FROM users WHERE username = $1', [username]);
    if (exists.rows.length) {
      await client.query('ROLLBACK');
      return res.status(409).json({ message: 'Username already taken' });
    }

    // Check profile ID not already in use
    if (role === 'student') {
      const sid = await client.query('SELECT id FROM student WHERE id = $1', [profile.id]);
      if (sid.rows.length) {
        await client.query('ROLLBACK');
        return res.status(409).json({ message: `Student ID "${profile.id}" is already registered` });
      }
    } else {
      const iid = await client.query('SELECT id FROM instructor WHERE id = $1', [profile.id]);
      if (iid.rows.length) {
        await client.query('ROLLBACK');
        return res.status(409).json({ message: `Instructor ID "${profile.id}" is already registered` });
      }
    }

    // Insert user with profile_id
    const userResult = await client.query(
      'INSERT INTO users (username, password, role, profile_id) VALUES ($1, $2, $3, $4) RETURNING id, username, role, profile_id',
      [username, password, role, profile.id]
    );
    const user = userResult.rows[0];

    // Insert into profile table
    if (role === 'student') {
      await client.query(
        'INSERT INTO student (id, name, dept_name, tot_cred) VALUES ($1, $2, $3, $4)',
        [profile.id, profile.name, profile.dept_name, profile.tot_cred || 0]
      );
    } else {
      await client.query(
        'INSERT INTO instructor (id, name, dept_name, salary) VALUES ($1, $2, $3, $4)',
        [profile.id, profile.name, profile.dept_name, profile.salary || 30000]
      );
    }

    await client.query('COMMIT');

    const payload = { id: user.id, username: user.username, role: user.role, profile_id: user.profile_id || null };
    const token = require('jsonwebtoken').sign(payload, process.env.JWT_SECRET, { expiresIn: '8h' });
    let permissions = {};
    try { permissions = await getPermissionsForRole(user.role); } catch (_) {}
    res.status(201).json({ token, user: payload, permissions });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ message: err.message });
  } finally {
    client.release();
  }
});

// Get all users
router.get('/', verify, requirePermission('users', 'read'), async (req, res) => {
  try {
    const result = await pool.query('SELECT id, username, role, created_at FROM users ORDER BY id');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create user
router.post('/', verify, requirePermission('users', 'create'), async (req, res) => {
  const { username, password, role } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO users (username, password, role) VALUES ($1, $2, $3) RETURNING id, username, role',
      [username, password, role]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update user
router.put('/:id', verify, requirePermission('users', 'update'), async (req, res) => {
  const { username, password, role } = req.body;
  try {
    if (password) {
      await pool.query('UPDATE users SET username=$1, password=$2, role=$3 WHERE id=$4',
        [username, password, role, req.params.id]);
    } else {
      await pool.query('UPDATE users SET username=$1, role=$2 WHERE id=$3',
        [username, role, req.params.id]);
    }
    res.json({ message: 'Updated' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete user
router.delete('/:id', verify, requirePermission('users', 'delete'), async (req, res) => {
  try {
    await pool.query('DELETE FROM users WHERE id=$1', [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Refresh permissions for current user (re-fetches from DB)
router.get('/permissions', verify, async (req, res) => {
  try {
    const permissions = await getPermissionsForRole(req.user.role);
    res.json(permissions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all role names (for user creation dropdown)
router.get('/roles', async (req, res) => {
  try {
    const r = await pool.query('SELECT name FROM roles ORDER BY name');
    res.json(r.rows.map(r => r.name));
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
