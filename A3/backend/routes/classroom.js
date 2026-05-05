const express = require('express');
const router = express.Router();
const pool = require('../db');
const { requirePermission } = require('../middleware/auth');

router.get('/', requirePermission('classroom', 'read'), async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM classroom ORDER BY building, room_number');
    res.json(r.rows);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.post('/', requirePermission('classroom', 'create'), async (req, res) => {
  const { building, room_number, capacity } = req.body;
  try {
    const r = await pool.query(
      'INSERT INTO classroom VALUES ($1,$2,$3) RETURNING *',
      [building, room_number, capacity]
    );
    res.status(201).json(r.rows[0]);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.put('/:building/:room_number', requirePermission('classroom', 'update'), async (req, res) => {
  const { capacity } = req.body;
  try {
    const r = await pool.query(
      'UPDATE classroom SET capacity=$1 WHERE building=$2 AND room_number=$3 RETURNING *',
      [capacity, req.params.building, req.params.room_number]
    );
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.delete('/:building/:room_number', requirePermission('classroom', 'delete'), async (req, res) => {
  try {
    await pool.query('DELETE FROM classroom WHERE building=$1 AND room_number=$2',
      [req.params.building, req.params.room_number]);
    res.json({ message: 'Deleted' });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

module.exports = router;
