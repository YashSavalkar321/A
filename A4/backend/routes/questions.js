const express = require('express');
const multer  = require('multer');
const path    = require('path');
const pool    = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// ─── Multer Setup ────────────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, path.join(__dirname, '../uploads')),
  filename:    (_, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// All questions routes require login; writes require TEACHER, TA, or ADMIN
router.use(authenticate);

// GET /api/questions/courses/list  – must be BEFORE /:id to avoid Express treating 'courses' as a param
router.get('/courses/list', async (_req, res) => {
  try {
    const { rows } = await pool.query('SELECT id, course_code, course_name FROM courses ORDER BY course_name');
    res.json(rows);
  } catch (err) {
    console.error(err); res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/questions?courseId=&difficulty=&subject=&topic=&search=
router.get('/', async (req, res) => {
  const { courseId, difficulty, subject, topic, search } = req.query;
  const conditions = [];
  const values     = [];
  let   idx        = 1;

  if (courseId)  { conditions.push(`q.course_id = $${idx++}`); values.push(courseId); }
  if (difficulty){ conditions.push(`q.difficulty = $${idx++}`); values.push(difficulty); }
  if (subject)   { conditions.push(`q.subject ILIKE $${idx++}`); values.push(`%${subject}%`); }
  if (topic)     { conditions.push(`q.topic ILIKE $${idx++}`); values.push(`%${topic}%`); }
  if (search)    { conditions.push(`q.question_text ILIKE $${idx++}`); values.push(`%${search}%`); }

  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

  try {
    const { rows } = await pool.query(
      `SELECT q.id, q.question_text, q.question_image_path, q.latex_expression,
              q.difficulty, q.subject, q.topic, q.created_at,
              c.course_name,
              u.full_name AS created_by_name,
              COALESCE(
                JSON_AGG(
                  JSON_BUILD_OBJECT('id', o.id, 'text', o.option_text, 'image', o.option_image_path,
                                    'isCorrect', o.is_correct, 'order', o.option_order)
                  ORDER BY o.option_order
                ) FILTER (WHERE o.id IS NOT NULL), '[]'
              ) AS options
       FROM questions q
       LEFT JOIN courses c ON c.id = q.course_id
       LEFT JOIN users u ON u.id = q.created_by
       LEFT JOIN options o ON o.question_id = q.id
       ${where}
       GROUP BY q.id, c.course_name, u.full_name
       ORDER BY q.created_at DESC`,
      values
    );
    res.json(rows);
  } catch (err) {
    console.error(err); res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/questions/:id
router.get('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT q.*, c.course_name,
              COALESCE(
                JSON_AGG(
                  JSON_BUILD_OBJECT('id', o.id, 'text', o.option_text, 'image', o.option_image_path,
                                    'isCorrect', o.is_correct, 'order', o.option_order)
                  ORDER BY o.option_order
                ) FILTER (WHERE o.id IS NOT NULL), '[]'
              ) AS options
       FROM questions q
       LEFT JOIN courses c ON c.id = q.course_id
       LEFT JOIN options o ON o.question_id = q.id
       WHERE q.id = $1
       GROUP BY q.id, c.course_name`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Question not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err); res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/questions
router.post('/', authorize('ADMIN','FACULTY'), upload.single('image'), async (req, res) => {
  const { questionText, latexExpression, difficulty, subject, topic, courseId, options } = req.body;
  if (!questionText) return res.status(400).json({ message: 'Question text required' });

  const imagePath = req.file ? `/uploads/${req.file.filename}` : null;
  const parsedOptions = typeof options === 'string' ? JSON.parse(options) : options;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const qRes = await client.query(
      `INSERT INTO questions(question_text, question_image_path, latex_expression, difficulty, subject, topic, course_id, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
      [questionText, imagePath, latexExpression || null, difficulty || null, subject || null, topic || null,
       courseId || null, req.user.id]
    );
    const questionId = qRes.rows[0].id;

    if (Array.isArray(parsedOptions)) {
      for (let i = 0; i < parsedOptions.length; i++) {
        const opt = parsedOptions[i];
        await client.query(
          'INSERT INTO options(question_id, option_text, is_correct, option_order) VALUES ($1,$2,$3,$4)',
          [questionId, opt.text, !!opt.isCorrect, i + 1]
        );
      }
    }
    await client.query('COMMIT');
    res.status(201).json({ id: questionId, message: 'Question created' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err); res.status(500).json({ message: 'Server error' });
  } finally {
    client.release();
  }
});

// PUT /api/questions/:id
router.put('/:id', authorize('ADMIN','FACULTY'), upload.single('image'), async (req, res) => {
  const { questionText, latexExpression, difficulty, subject, topic, courseId, options } = req.body;
  const imagePath = req.file ? `/uploads/${req.file.filename}` : undefined;
  const parsedOptions = typeof options === 'string' ? JSON.parse(options) : options;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const setParts = [
      `question_text = $1`,
      `latex_expression = $2`,
      `difficulty = $3`,
      `subject = $4`,
      `topic = $5`,
      `course_id = $6`
    ];
    const vals = [questionText, latexExpression || null, difficulty || null,
                  subject || null, topic || null, courseId || null];

    if (imagePath) { setParts.push(`question_image_path = $${vals.length + 1}`); vals.push(imagePath); }
    vals.push(req.params.id);

    await client.query(`UPDATE questions SET ${setParts.join(',')} WHERE id = $${vals.length}`, vals);

    if (Array.isArray(parsedOptions)) {
      await client.query('DELETE FROM options WHERE question_id = $1', [req.params.id]);
      for (let i = 0; i < parsedOptions.length; i++) {
        const opt = parsedOptions[i];
        await client.query(
          'INSERT INTO options(question_id, option_text, is_correct, option_order) VALUES ($1,$2,$3,$4)',
          [req.params.id, opt.text, !!opt.isCorrect, i + 1]
        );
      }
    }
    await client.query('COMMIT');
    res.json({ message: 'Question updated' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err); res.status(500).json({ message: 'Server error' });
  } finally {
    client.release();
  }
});

// DELETE /api/questions/:id
router.delete('/:id', authorize('ADMIN','FACULTY'), async (req, res) => {
  try {
    await pool.query('DELETE FROM questions WHERE id = $1', [req.params.id]);
    res.json({ message: 'Question deleted' });
  } catch (err) {
    console.error(err); res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
