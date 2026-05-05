const express = require('express');
const router = express.Router();
const pool = require('../db');
const { requirePermission } = require('../middleware/auth');

router.get('/', requirePermission('takes', 'read'), async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM takes ORDER BY id, course_id');
    res.json(r.rows);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.post('/', requirePermission('takes', 'create'), async (req, res) => {
  const { id, course_id, sec_id, semester, year, grade } = req.body;
  try {
    const r = await pool.query(
      'INSERT INTO takes VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [id, course_id, sec_id, semester, year, grade]
    );
    res.status(201).json(r.rows[0]);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.put('/:id/:course_id/:sec_id/:semester/:year', requirePermission('takes', 'update'), async (req, res) => {
  const { grade } = req.body;
  try {
    const r = await pool.query(
      'UPDATE takes SET grade=$1 WHERE id=$2 AND course_id=$3 AND sec_id=$4 AND semester=$5 AND year=$6 RETURNING *',
      [grade, req.params.id, req.params.course_id, req.params.sec_id, req.params.semester, req.params.year]
    );
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.delete('/:id/:course_id/:sec_id/:semester/:year', requirePermission('takes', 'delete'), async (req, res) => {
  try {
    await pool.query('DELETE FROM takes WHERE id=$1 AND course_id=$2 AND sec_id=$3 AND semester=$4 AND year=$5',
      [req.params.id, req.params.course_id, req.params.sec_id, req.params.semester, req.params.year]);
    res.json({ message: 'Deleted' });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

module.exports = router;
