const express = require('express');
const router = express.Router();
const pool = require('../db');
const { requirePermission } = require('../middleware/auth');

router.get('/', requirePermission('timeslot', 'read'), async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM time_slot ORDER BY time_slot_id, day, start_time');
    res.json(r.rows);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.post('/', requirePermission('timeslot', 'create'), async (req, res) => {
  const { time_slot_id, day, start_time, end_time } = req.body;
  try {
    const r = await pool.query(
      'INSERT INTO time_slot VALUES ($1,$2,$3,$4) RETURNING *',
      [time_slot_id, day, start_time, end_time]
    );
    res.status(201).json(r.rows[0]);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.put('/:time_slot_id/:day/:start_time', requirePermission('timeslot', 'update'), async (req, res) => {
  const { end_time } = req.body;
  try {
    const r = await pool.query(
      'UPDATE time_slot SET end_time=$1 WHERE time_slot_id=$2 AND day=$3 AND start_time=$4 RETURNING *',
      [end_time, req.params.time_slot_id, req.params.day, req.params.start_time]
    );
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.delete('/:time_slot_id/:day/:start_time', requirePermission('timeslot', 'delete'), async (req, res) => {
  try {
    await pool.query('DELETE FROM time_slot WHERE time_slot_id=$1 AND day=$2 AND start_time=$3',
      [req.params.time_slot_id, req.params.day, req.params.start_time]);
    res.json({ message: 'Deleted' });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

module.exports = router;
