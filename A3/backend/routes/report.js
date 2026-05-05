const express = require('express');
const router = express.Router();
const pool = require('../db');
const { requirePermission } = require('../middleware/auth');

const ALLOWED_TABLES = [
  'classroom','department','course','instructor','section',
  'teaches','student','takes','advisor','time_slot','prereq','users'
];

// Stats for dashboard — must be before /:table to avoid being swallowed by it
router.get('/stats/summary', async (req, res) => {
  try {
    const [students, instructors, courses, depts] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM student'),
      pool.query('SELECT COUNT(*) FROM instructor'),
      pool.query('SELECT COUNT(*) FROM course'),
      pool.query('SELECT COUNT(*) FROM department'),
    ]);
    res.json({
      students: parseInt(students.rows[0].count),
      instructors: parseInt(instructors.rows[0].count),
      courses: parseInt(courses.rows[0].count),
      departments: parseInt(depts.rows[0].count),
    });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// Generic report: select all from any allowed table
router.get('/:table', requirePermission('report', 'read'), async (req, res) => {
  const table = req.params.table;
  if (!ALLOWED_TABLES.includes(table)) return res.status(400).json({ message: 'Invalid table' });
  try {
    const r = await pool.query(`SELECT * FROM ${table}`);
    res.json({ columns: r.fields.map(f => f.name), rows: r.rows });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// Custom SQL report (admin only)
router.post('/custom', requirePermission('report', 'create'), async (req, res) => {
  const { sql } = req.body;
  // Only allow SELECT statements for safety
  if (!sql || !sql.trim().toUpperCase().startsWith('SELECT')) {
    return res.status(400).json({ message: 'Only SELECT queries are allowed' });
  }
  try {
    const r = await pool.query(sql);
    res.json({ columns: r.fields.map(f => f.name), rows: r.rows });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

module.exports = router;
