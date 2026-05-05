const express = require('express');
const router = express.Router();
const pool = require('../db');
const { requirePermission } = require('../middleware/auth');

router.get('/', requirePermission('prereq', 'read'), async (req, res) => {
  try {
    const r = await pool.query(`
      SELECT p.course_id, c1.title AS course_title, p.prereq_id, c2.title AS prereq_title
      FROM prereq p
      JOIN course c1 ON p.course_id = c1.course_id
      JOIN course c2 ON p.prereq_id = c2.course_id
      ORDER BY p.course_id
    `);
    res.json(r.rows);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.post('/', requirePermission('prereq', 'create'), async (req, res) => {
  const { course_id, prereq_id } = req.body;
  try {
    const r = await pool.query(
      'INSERT INTO prereq VALUES ($1,$2) RETURNING *',
      [course_id, prereq_id]
    );
    res.status(201).json(r.rows[0]);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.delete('/:course_id/:prereq_id', requirePermission('prereq', 'delete'), async (req, res) => {
  try {
    await pool.query('DELETE FROM prereq WHERE course_id=$1 AND prereq_id=$2',
      [req.params.course_id, req.params.prereq_id]);
    res.json({ message: 'Deleted' });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

module.exports = router;
