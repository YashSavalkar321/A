const express = require('express');
const router = express.Router();
const pool = require('../db');
const { requirePermission } = require('../middleware/auth');

router.get('/', requirePermission('department', 'read'), async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM department ORDER BY dept_name');
    res.json(r.rows);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.post('/', requirePermission('department', 'create'), async (req, res) => {
  const { dept_name, building, budget } = req.body;
  try {
    const r = await pool.query(
      'INSERT INTO department VALUES ($1,$2,$3) RETURNING *',
      [dept_name, building, budget]
    );
    res.status(201).json(r.rows[0]);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.put('/:dept_name', requirePermission('department', 'update'), async (req, res) => {
  const { building, budget } = req.body;
  try {
    const r = await pool.query(
      'UPDATE department SET building=$1, budget=$2 WHERE dept_name=$3 RETURNING *',
      [building, budget, req.params.dept_name]
    );
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.delete('/:dept_name', requirePermission('department', 'delete'), async (req, res) => {
  try {
    await pool.query('DELETE FROM department WHERE dept_name=$1', [req.params.dept_name]);
    res.json({ message: 'Deleted' });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

module.exports = router;
