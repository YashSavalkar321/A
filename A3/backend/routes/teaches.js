const express = require('express');
const router = express.Router();
const pool = require('../db');
const { requirePermission } = require('../middleware/auth');

router.get('/', requirePermission('teaches', 'read'), async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM teaches ORDER BY id, course_id');
    res.json(r.rows);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.post('/', requirePermission('teaches', 'create'), async (req, res) => {
  const { id, course_id, sec_id, semester, year } = req.body;
  try {
    const r = await pool.query(
      'INSERT INTO teaches VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [id, course_id, sec_id, semester, year]
    );
    res.status(201).json(r.rows[0]);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.delete('/:id/:course_id/:sec_id/:semester/:year', requirePermission('teaches', 'delete'), async (req, res) => {
  try {
    await pool.query('DELETE FROM teaches WHERE id=$1 AND course_id=$2 AND sec_id=$3 AND semester=$4 AND year=$5',
      [req.params.id, req.params.course_id, req.params.sec_id, req.params.semester, req.params.year]);
    res.json({ message: 'Deleted' });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

module.exports = router;
