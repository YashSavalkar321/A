const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  user: '23510027',
  host: 'localhost',
  database: 'DB23510027',
  password: 'Yash',
  port: 5432
});

/* Get all tables */
app.get('/tables', async (req, res) => {
  const result = await pool.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema='public'"
  );
  res.json(result.rows);
});

/* Get table columns */
app.get('/columns/:table', async (req, res) => {
  const table = req.params.table;
  const result = await pool.query(
    `SELECT column_name, data_type, is_nullable 
     FROM information_schema.columns 
     WHERE table_schema = 'public' AND table_name = $1
     ORDER BY ordinal_position`,
    [table]
  );
  res.json(result.rows);
});

/* Get table data */
app.get('/data/:table', async (req, res) => {
  const table = req.params.table;
  const result = await pool.query(`SELECT * FROM ${table}`);
  res.json(result.rows);
});

/* Insert data */
app.post('/data/:table', async (req, res) => {
  const table = req.params.table;
  const keys = Object.keys(req.body).join(',');
  const values = Object.values(req.body);
  const params = values.map((_, i) => `$${i + 1}`).join(',');

  await pool.query(
    `INSERT INTO ${table} (${keys}) VALUES (${params})`,
    values
  );

  res.send({ message: 'Inserted' });
});

/* Update data (id must exist) */
app.put('/data/:table/:id', async (req, res) => {
  const table = req.params.table;
  const id = req.params.id;

  const updates = Object.keys(req.body)
    .map((k, i) => `${k}=$${i + 1}`)
    .join(',');

  const values = Object.values(req.body);

  await pool.query(
    `UPDATE ${table} SET ${updates} WHERE id=$${values.length + 1}`,
    [...values, id]
  );

  res.send({ message: 'Updated' });
});

/* Delete data */
app.delete('/data/:table/:id', async (req, res) => {
  const table = req.params.table;
  const id = req.params.id;

  await pool.query(
    `DELETE FROM ${table} WHERE id=$1`,
    [id]
  );

  res.send({ message: 'Deleted' });
});

app.listen(3000, () =>
  console.log('Backend running on http://localhost:3000')
);
