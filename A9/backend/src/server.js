require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const cassandra = require('cassandra-driver');
const {
  initDatabases,
  getMongoCollection,
  getCassandraClient,
  mongoDbName,
  cassandraKeyspace
} = require('./db');

const app = express();
const port = Number(process.env.PORT || 3100);

app.use(cors());
app.use(express.json());

/* ─── helpers ─── */

function validatePayload(body) {
  if (!body || typeof body !== 'object') return 'Body is required';
  const { name, email, course } = body;
  if (!name || !String(name).trim()) return 'name is required';
  if (!email || !String(email).trim()) return 'email is required';
  if (!course || !String(course).trim()) return 'course is required';
  return null;
}

/* ─── Health ─── */

app.get('/api/health', async (_req, res) => {
  res.json({
    status: 'ok',
    mongo: { database: mongoDbName },
    cassandra: { keyspace: cassandraKeyspace },
    timestamp: new Date().toISOString()
  });
});

/* ═══════════════════════════════════════════
   MongoDB CRUD — /api/mongo/students
   ═══════════════════════════════════════════ */

app.get('/api/mongo/students', async (_req, res) => {
  try {
    const docs = await getMongoCollection()
      .find({}, { projection: { _id: 0 } })
      .sort({ created_at: -1 })
      .toArray();
    return res.json(docs);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.post('/api/mongo/students', async (req, res) => {
  const err = validatePayload(req.body);
  if (err) return res.status(400).json({ error: err });

  const student = {
    id: uuidv4(),
    name: String(req.body.name).trim(),
    email: String(req.body.email).trim(),
    course: String(req.body.course).trim(),
    created_at: new Date()
  };

  try {
    await getMongoCollection().insertOne(student);
    return res.status(201).json(student);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.put('/api/mongo/students/:id', async (req, res) => {
  const id = req.params.id;
  const err = validatePayload(req.body);
  if (err) return res.status(400).json({ error: err });

  const updates = {
    name: String(req.body.name).trim(),
    email: String(req.body.email).trim(),
    course: String(req.body.course).trim()
  };

  try {
    const result = await getMongoCollection().findOneAndUpdate(
      { id },
      { $set: updates },
      { returnDocument: 'after', projection: { _id: 0 } }
    );

    if (!result) {
      return res.status(404).json({ error: 'student not found' });
    }

    return res.json(result);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.delete('/api/mongo/students/:id', async (req, res) => {
  const id = req.params.id;
  try {
    const result = await getMongoCollection().deleteOne({ id });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'student not found' });
    }
    return res.json({ deleted: true, id });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

/* ═══════════════════════════════════════════
   CassandraDB CRUD — /api/cassandra/students
   ═══════════════════════════════════════════ */

app.get('/api/cassandra/students', async (_req, res) => {
  try {
    const result = await getCassandraClient().execute(
      'SELECT id, name, email, course, created_at FROM students'
    );
    const rows = result.rows.map(r => ({
      id: r.id.toString(),
      name: r.name,
      email: r.email,
      course: r.course,
      created_at: r.created_at
    }));
    // Sort newest first (Cassandra doesn't guarantee order without clustering key)
    rows.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return res.json(rows);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.post('/api/cassandra/students', async (req, res) => {
  const err = validatePayload(req.body);
  if (err) return res.status(400).json({ error: err });

  const id = cassandra.types.Uuid.random();
  const student = {
    id: id.toString(),
    name: String(req.body.name).trim(),
    email: String(req.body.email).trim(),
    course: String(req.body.course).trim(),
    created_at: new Date()
  };

  try {
    await getCassandraClient().execute(
      'INSERT INTO students (id, name, email, course, created_at) VALUES (?, ?, ?, ?, ?)',
      [id, student.name, student.email, student.course, student.created_at],
      { prepare: true }
    );
    return res.status(201).json(student);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.put('/api/cassandra/students/:id', async (req, res) => {
  const id = req.params.id;
  const err = validatePayload(req.body);
  if (err) return res.status(400).json({ error: err });

  const name = String(req.body.name).trim();
  const email = String(req.body.email).trim();
  const course = String(req.body.course).trim();

  try {
    const uuid = cassandra.types.Uuid.fromString(id);

    // Check if exists
    const existing = await getCassandraClient().execute(
      'SELECT id FROM students WHERE id = ?',
      [uuid],
      { prepare: true }
    );
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'student not found' });
    }

    await getCassandraClient().execute(
      'UPDATE students SET name = ?, email = ?, course = ? WHERE id = ?',
      [name, email, course, uuid],
      { prepare: true }
    );

    return res.json({ id, name, email, course });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.delete('/api/cassandra/students/:id', async (req, res) => {
  const id = req.params.id;
  try {
    const uuid = cassandra.types.Uuid.fromString(id);

    const existing = await getCassandraClient().execute(
      'SELECT id FROM students WHERE id = ?',
      [uuid],
      { prepare: true }
    );
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'student not found' });
    }

    await getCassandraClient().execute(
      'DELETE FROM students WHERE id = ?',
      [uuid],
      { prepare: true }
    );
    return res.json({ deleted: true, id });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

/* ─── Start ─── */

(async () => {
  try {
    await initDatabases();
    app.listen(port, () => {
      console.log(`Assignment 9 backend running on http://localhost:${port}`);
    });
  } catch (error) {
    console.error('Failed to start backend:', error);
    process.exit(1);
  }
})();
