const express = require('express');
const router = express.Router();
const pool = require('../db');
const { requirePermission } = require('../middleware/auth');

router.get('/', requirePermission('student', 'read'), async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM student ORDER BY id');
    res.json(r.rows);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.post('/', requirePermission('student', 'create'), async (req, res) => {
  const { id, name, dept_name, tot_cred, address, mobile_no } = req.body;
  try {
    const r = await pool.query(
      'INSERT INTO student (id, name, dept_name, tot_cred, address, mobile_no) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [id, name, dept_name, tot_cred || 0, address || null, mobile_no || null]
    );
    res.status(201).json(r.rows[0]);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.put('/:id', requirePermission('student', 'update'), async (req, res) => {
  const { name, dept_name, tot_cred, address, mobile_no } = req.body;
  try {
    const r = await pool.query(
      'UPDATE student SET name=$1, dept_name=$2, tot_cred=$3, address=$4, mobile_no=$5 WHERE id=$6 RETURNING *',
      [name, dept_name, tot_cred, address || null, mobile_no || null, req.params.id]
    );
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.delete('/:id', requirePermission('student', 'delete'), async (req, res) => {
  try {
    await pool.query('DELETE FROM student WHERE id=$1', [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

module.exports = router;
