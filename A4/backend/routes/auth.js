const express = require('express');
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const pool    = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure:   process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge:   24 * 60 * 60 * 1000, // 24 hours
  path:     '/',
};

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Email and password required' });

  try {
    const { rows } = await pool.query(
      'SELECT id, full_name, email, password, role, is_active FROM users WHERE email = $1',
      [email.toLowerCase()]
    );
    const user = rows[0];
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });
    if (!user.is_active) return res.status(403).json({ message: 'Account is disabled. Contact an administrator.' });

    // Support plain-text (demo) and bcrypt hashed passwords
    let valid = false;
    if (user.password.startsWith('$2')) {
      valid = await bcrypt.compare(password, user.password);
    } else {
      valid = password === user.password;
    }
    if (!valid) return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET || 'secret_key',
      { expiresIn: '24h' }
    );

    // Set httpOnly cookie
    res.cookie('token', token, COOKIE_OPTIONS);

    res.json({
      user: { id: user.id, fullName: user.full_name, email: user.email, role: user.role }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/auth/logout
router.post('/logout', (_req, res) => {
  res.clearCookie('token', { path: '/' });
  res.json({ message: 'Logged out' });
});

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { fullName, email, password, role = 'STUDENT' } = req.body;
  if (!fullName || !email || !password) return res.status(400).json({ message: 'All fields required' });

  const allowed = ['STUDENT', 'FACULTY'];
  if (!allowed.includes(role)) return res.status(400).json({ message: 'Invalid role. Choose Student or Faculty.' });

  try {
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (existing.rows.length) return res.status(409).json({ message: 'Email already registered' });

    const hashed = await bcrypt.hash(password, 10);
    await pool.query(
      'INSERT INTO users (full_name, email, password, role) VALUES ($1, $2, $3, $4)',
      [fullName, email.toLowerCase(), hashed, role]
    );

    res.status(201).json({ message: 'Registered successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/auth/me
router.get('/me', authenticate, (req, res) => {
  const { id, full_name, email, role } = req.user;
  res.json({ id, fullName: full_name, email, role });
});

// GET /api/auth/users  (ADMIN only — list all users)
router.get('/users', authenticate, authorize('ADMIN'), async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, full_name, email, role, is_active, created_at
       FROM users
       ORDER BY created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PATCH /api/auth/users/:id/toggle  (ADMIN only — activate/deactivate)
router.patch('/users/:id/toggle', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const { rows } = await pool.query(
      'UPDATE users SET is_active = NOT is_active WHERE id = $1 RETURNING id, is_active',
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'User not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
