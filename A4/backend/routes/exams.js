const express = require('express');
const pool    = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

// GET /api/exams
router.get('/', async (req, res) => {
  try {
    const isStaff = ['ADMIN','FACULTY'].includes(req.user.role);
    const where   = isStaff ? '' : 'WHERE e.is_published = true';
    const { rows } = await pool.query(
      `SELECT e.*, u.full_name AS created_by_name,
              COUNT(eq.question_id)::int AS question_count
       FROM exams e
       LEFT JOIN users u ON u.id = e.created_by
       LEFT JOIN exam_questions eq ON eq.exam_id = e.id
       ${where}
       GROUP BY e.id, u.full_name
       ORDER BY e.created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error(err); res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/exams/:id
router.get('/:id', async (req, res) => {
  try {
    const examRes = await pool.query(
      `SELECT e.*, u.full_name AS created_by_name FROM exams e
       LEFT JOIN users u ON u.id = e.created_by
       WHERE e.id = $1`, [req.params.id]
    );
    if (!examRes.rows.length) return res.status(404).json({ message: 'Exam not found' });

    const questionsRes = await pool.query(
      `SELECT q.id, q.question_text, q.latex_expression, q.question_image_path,
              q.difficulty, q.subject, q.topic, eq.marks, eq.question_order,
              COALESCE(
                JSON_AGG(
                  JSON_BUILD_OBJECT('id', o.id, 'text', o.option_text, 'image', o.option_image_path, 'order', o.option_order)
                  ORDER BY o.option_order
                ) FILTER (WHERE o.id IS NOT NULL), '[]'
              ) AS options
       FROM exam_questions eq
       JOIN questions q ON q.id = eq.question_id
       LEFT JOIN options o ON o.question_id = q.id
       WHERE eq.exam_id = $1
       GROUP BY q.id, eq.marks, eq.question_order
       ORDER BY eq.question_order`,
      [req.params.id]
    );

    res.json({ ...examRes.rows[0], questions: questionsRes.rows });
  } catch (err) {
    console.error(err); res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/exams  (ADMIN, TEACHER)
router.post('/', authorize('ADMIN','FACULTY'), async (req, res) => {
  const { title, description, courseName, durationMinutes, totalMarks, passingMarks,
          examType, startTime, endTime, isPublished, showResults, questionIds } = req.body;
  if (!title) return res.status(400).json({ message: 'Title required' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const eRes = await client.query(
      `INSERT INTO exams(title, description, course_name, duration_minutes, total_marks, passing_marks,
                         exam_type, start_time, end_time, is_published, show_results, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING id`,
      [title, description || null, courseName || null, durationMinutes || 60,
       totalMarks || 0, passingMarks || 0, examType || 'FLEXIBLE',
       startTime || null, endTime || null, isPublished || false, showResults !== false, req.user.id]
    );
    const examId = eRes.rows[0].id;

    if (Array.isArray(questionIds)) {
      for (let i = 0; i < questionIds.length; i++) {
        await client.query(
          'INSERT INTO exam_questions(exam_id, question_id, marks, question_order) VALUES ($1,$2,$3,$4)',
          [examId, questionIds[i], 1, i + 1]
        );
      }
      // Auto-compute total_marks & passing_marks from questions
      const computedTotal = questionIds.length; // 1 mark per question
      const computedPassing = Math.ceil(computedTotal * 0.4);
      await client.query(
        'UPDATE exams SET total_marks = $1, passing_marks = $2 WHERE id = $3',
        [computedTotal, computedPassing, examId]
      );
    }
    await client.query('COMMIT');
    res.status(201).json({ id: examId, message: 'Exam created' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err); res.status(500).json({ message: 'Server error' });
  } finally {
    client.release();
  }
});

// PUT /api/exams/:id
router.put('/:id', authorize('ADMIN','FACULTY'), async (req, res) => {
  const { title, description, courseName, durationMinutes, totalMarks, passingMarks,
          examType, startTime, endTime, isPublished, showResults, questionIds } = req.body;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      `UPDATE exams SET title=$1, description=$2, course_name=$3, duration_minutes=$4,
                        total_marks=$5, passing_marks=$6, exam_type=$7,
                        start_time=$8, end_time=$9, is_published=$10, show_results=$11
       WHERE id = $12`,
      [title, description || null, courseName || null, durationMinutes || 60,
       totalMarks || 0, passingMarks || 0, examType || 'FLEXIBLE',
       startTime || null, endTime || null, isPublished || false, showResults !== false, req.params.id]
    );

    if (Array.isArray(questionIds)) {
      await client.query('DELETE FROM exam_questions WHERE exam_id = $1', [req.params.id]);
      for (let i = 0; i < questionIds.length; i++) {
        await client.query(
          'INSERT INTO exam_questions(exam_id, question_id, marks, question_order) VALUES ($1,$2,$3,$4)',
          [req.params.id, questionIds[i], 1, i + 1]
        );
      }
      // Auto-compute total_marks & passing_marks from questions
      const computedTotal = questionIds.length;
      const computedPassing = Math.ceil(computedTotal * 0.4);
      await client.query(
        'UPDATE exams SET total_marks = $1, passing_marks = $2 WHERE id = $3',
        [computedTotal, computedPassing, req.params.id]
      );
    }
    await client.query('COMMIT');
    res.json({ message: 'Exam updated' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err); res.status(500).json({ message: 'Server error' });
  } finally {
    client.release();
  }
});

// PATCH /api/exams/:id/publish  – toggle publish status only
router.patch('/:id/publish', authorize('ADMIN','FACULTY'), async (req, res) => {
  try {
    const { rows } = await pool.query(
      'UPDATE exams SET is_published = NOT is_published WHERE id = $1 RETURNING id, is_published',
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Exam not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err); res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/exams/:id
router.delete('/:id', authorize('ADMIN','FACULTY'), async (req, res) => {
  try {
    await pool.query('DELETE FROM exams WHERE id = $1', [req.params.id]);
    res.json({ message: 'Exam deleted' });
  } catch (err) {
    console.error(err); res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/exams/:id/monitor  – live student status
router.get('/:id/monitor', authorize('ADMIN','FACULTY'), async (req, res) => {
  try {
    const examRes = await pool.query('SELECT * FROM exams WHERE id = $1', [req.params.id]);
    if (!examRes.rows.length) return res.status(404).json({ message: 'Exam not found' });

    const { rows } = await pool.query(
      `SELECT se.id, u.full_name, u.email, se.status, se.start_time, se.end_time, se.score,
              (SELECT COUNT(*) FROM student_answers sa WHERE sa.student_exam_id = se.id)::int AS answered_count,
              (SELECT COUNT(*) FROM exam_questions eq WHERE eq.exam_id = se.exam_id)::int AS total_questions
       FROM student_exams se
       JOIN users u ON u.id = se.student_id
       WHERE se.exam_id = $1
       ORDER BY se.start_time DESC`,
      [req.params.id]
    );
    res.json({ exam: examRes.rows[0], students: rows });
  } catch (err) {
    console.error(err); res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
