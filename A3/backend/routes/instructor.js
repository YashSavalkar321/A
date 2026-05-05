const express = require('express');
const router = express.Router();
const pool = require('../db');
const { requirePermission } = require('../middleware/auth');

router.get('/', requirePermission('instructor', 'read'), async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM instructor ORDER BY id');
    res.json(r.rows);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.post('/', requirePermission('instructor', 'create'), async (req, res) => {
  const { id, name, dept_name, salary } = req.body;
  try {
    const r = await pool.query(
      'INSERT INTO instructor VALUES ($1,$2,$3,$4) RETURNING *',
      [id, name, dept_name, salary]
    );
    res.status(201).json(r.rows[0]);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.put('/:id', requirePermission('instructor', 'update'), async (req, res) => {
  const { name, dept_name, salary } = req.body;
  try {
    const r = await pool.query(
      'UPDATE instructor SET name=$1, dept_name=$2, salary=$3 WHERE id=$4 RETURNING *',
      [name, dept_name, salary, req.params.id]
    );
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.delete('/:id', requirePermission('instructor', 'delete'), async (req, res) => {
  try {
    await pool.query('DELETE FROM instructor WHERE id=$1', [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

module.exports = router;
