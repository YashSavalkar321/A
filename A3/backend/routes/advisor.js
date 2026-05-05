const express = require('express');
const router = express.Router();
const pool = require('../db');
const { requirePermission } = require('../middleware/auth');

router.get('/', requirePermission('advisor', 'read'), async (req, res) => {
  try {
    const r = await pool.query(`
      SELECT a.s_id, s.name AS student_name, a.i_id, i.name AS instructor_name
      FROM advisor a
      JOIN student s ON a.s_id = s.id
      JOIN instructor i ON a.i_id = i.id
      ORDER BY a.s_id
    `);
    res.json(r.rows);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.post('/', requirePermission('advisor', 'create'), async (req, res) => {
  const { s_id, i_id } = req.body;
  try {
    const r = await pool.query(
      'INSERT INTO advisor VALUES ($1,$2) RETURNING *',
      [s_id, i_id]
    );
    res.status(201).json(r.rows[0]);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.put('/:s_id', requirePermission('advisor', 'update'), async (req, res) => {
  const { i_id } = req.body;
  try {
    const r = await pool.query(
      'UPDATE advisor SET i_id=$1 WHERE s_id=$2 RETURNING *',
      [i_id, req.params.s_id]
    );
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.delete('/:s_id', requirePermission('advisor', 'delete'), async (req, res) => {
  try {
    await pool.query('DELETE FROM advisor WHERE s_id=$1', [req.params.s_id]);
    res.json({ message: 'Deleted' });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

module.exports = router;
