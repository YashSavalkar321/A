const express = require('express');
const router = express.Router();
const pool = require('../db');
const { requirePermission } = require('../middleware/auth');

router.get('/', requirePermission('course', 'read'), async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM course ORDER BY course_id');
    res.json(r.rows);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.post('/', requirePermission('course', 'create'), async (req, res) => {
  const { course_id, title, dept_name, credits } = req.body;
  try {
    const r = await pool.query(
      'INSERT INTO course VALUES ($1,$2,$3,$4) RETURNING *',
      [course_id, title, dept_name, credits]
    );
    res.status(201).json(r.rows[0]);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.put('/:course_id', requirePermission('course', 'update'), async (req, res) => {
  const { title, dept_name, credits } = req.body;
  try {
    const r = await pool.query(
      'UPDATE course SET title=$1, dept_name=$2, credits=$3 WHERE course_id=$4 RETURNING *',
      [title, dept_name, credits, req.params.course_id]
    );
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.delete('/:course_id', requirePermission('course', 'delete'), async (req, res) => {
  try {
    await pool.query('DELETE FROM course WHERE course_id=$1', [req.params.course_id]);
    res.json({ message: 'Deleted' });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

module.exports = router;
