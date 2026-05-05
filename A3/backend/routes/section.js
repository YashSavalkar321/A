const express = require('express');
const router = express.Router();
const pool = require('../db');
const { requirePermission } = require('../middleware/auth');

router.get('/', requirePermission('section', 'read'), async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM section ORDER BY course_id, sec_id');
    res.json(r.rows);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.post('/', requirePermission('section', 'create'), async (req, res) => {
  const { course_id, sec_id, semester, year, building, room_number, time_slot_id } = req.body;
  try {
    const r = await pool.query(
      'INSERT INTO section VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
      [course_id, sec_id, semester, year, building, room_number, time_slot_id]
    );
    res.status(201).json(r.rows[0]);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.put('/:course_id/:sec_id/:semester/:year', requirePermission('section', 'update'), async (req, res) => {
  const { building, room_number, time_slot_id } = req.body;
  try {
    const r = await pool.query(
      'UPDATE section SET building=$1, room_number=$2, time_slot_id=$3 WHERE course_id=$4 AND sec_id=$5 AND semester=$6 AND year=$7 RETURNING *',
      [building, room_number, time_slot_id, req.params.course_id, req.params.sec_id, req.params.semester, req.params.year]
    );
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.delete('/:course_id/:sec_id/:semester/:year', requirePermission('section', 'delete'), async (req, res) => {
  try {
    await pool.query('DELETE FROM section WHERE course_id=$1 AND sec_id=$2 AND semester=$3 AND year=$4',
      [req.params.course_id, req.params.sec_id, req.params.semester, req.params.year]);
    res.json({ message: 'Deleted' });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

module.exports = router;
