const express = require('express');
const pool    = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

// GET /api/student-exams/available  – published exams student hasn't started
router.get('/available', authorize('STUDENT'), async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT e.id, e.title, e.description, e.course_name, e.duration_minutes,
              e.total_marks, e.passing_marks, e.start_time, e.end_time, e.show_results,
              COUNT(eq.question_id)::int AS question_count,
              se.id AS student_exam_id,
              se.status AS attempt_status, se.score AS attempt_score
       FROM exams e
       LEFT JOIN exam_questions eq ON eq.exam_id = e.id
       LEFT JOIN student_exams se ON se.exam_id = e.id AND se.student_id = $1
       WHERE e.is_published = true
       GROUP BY e.id, se.id, se.status, se.score
       ORDER BY e.start_time DESC NULLS LAST`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err); res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/student-exams/start/:examId  – begin an exam attempt
router.post('/start/:examId', authorize('STUDENT'), async (req, res) => {
  const examId    = req.params.examId;
  const studentId = req.user.id;

  try {
    // Check already attempted
    const existing = await pool.query(
      'SELECT id, status FROM student_exams WHERE exam_id=$1 AND student_id=$2',
      [examId, studentId]
    );
    if (existing.rows.length) {
      const prev = existing.rows[0];
      if (prev.status === 'ONGOING') return res.json({ studentExamId: prev.id, resumed: true });
      return res.status(409).json({ message: 'Already attempted this exam' });
    }

    const examCheck = await pool.query('SELECT id FROM exams WHERE id=$1 AND is_published=true', [examId]);
    if (!examCheck.rows.length) return res.status(404).json({ message: 'Exam not found or not published' });

    const { rows } = await pool.query(
      `INSERT INTO student_exams(student_id, exam_id, start_time, status)
       VALUES ($1,$2,NOW(),'ONGOING') RETURNING id`,
      [studentId, examId]
    );
    res.status(201).json({ studentExamId: rows[0].id, resumed: false });
  } catch (err) {
    console.error(err); res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/student-exams/:id/questions  – get exam questions (without correct answers)
router.get('/:id/questions', authorize('STUDENT'), async (req, res) => {
  try {
    const seRes = await pool.query(
      `SELECT se.*, e.duration_minutes, e.title
       FROM student_exams se JOIN exams e ON e.id = se.exam_id
       WHERE se.id=$1 AND se.student_id=$2`,
      [req.params.id, req.user.id]
    );
    if (!seRes.rows.length) return res.status(404).json({ message: 'Attempt not found' });

    const se = seRes.rows[0];
    if (se.status !== 'ONGOING') return res.status(400).json({ message: 'Exam already submitted' });

    const qRes = await pool.query(
      `SELECT q.id, q.question_text, q.latex_expression, q.question_image_path,
              eq.marks, eq.question_order,
              COALESCE(
                JSON_AGG(
                  JSON_BUILD_OBJECT('id', o.id, 'text', o.option_text, 'image', o.option_image_path, 'order', o.option_order)
                  ORDER BY o.option_order
                ) FILTER (WHERE o.id IS NOT NULL), '[]'
              ) AS options,
              sa.selected_option_id, sa.marked_for_review
       FROM exam_questions eq
       JOIN questions q ON q.id = eq.question_id
       LEFT JOIN options o ON o.question_id = q.id
       LEFT JOIN student_answers sa ON sa.question_id = q.id AND sa.student_exam_id=$1
       WHERE eq.exam_id=$2
       GROUP BY q.id, eq.marks, eq.question_order, sa.selected_option_id, sa.marked_for_review
       ORDER BY eq.question_order`,
      [req.params.id, se.exam_id]
    );

    res.json({ exam: se, questions: qRes.rows });
  } catch (err) {
    console.error(err); res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/student-exams/:id/answer  – save/update a single answer
router.post('/:id/answer', authorize('STUDENT'), async (req, res) => {
  const { questionId, selectedOptionId, markedForReview = false } = req.body;

  try {
    const seCheck = await pool.query(
      'SELECT id FROM student_exams WHERE id=$1 AND student_id=$2 AND status=\'ONGOING\'',
      [req.params.id, req.user.id]
    );
    if (!seCheck.rows.length) return res.status(404).json({ message: 'Active attempt not found' });

    await pool.query(
      `INSERT INTO student_answers(student_exam_id, question_id, selected_option_id, marked_for_review, answered_at)
       VALUES ($1,$2,$3,$4,NOW())
       ON CONFLICT (student_exam_id, question_id)
       DO UPDATE SET selected_option_id=$3, marked_for_review=$4, answered_at=NOW()`,
      [req.params.id, questionId, selectedOptionId || null, markedForReview]
    );
    res.json({ message: 'Answer saved' });
  } catch (err) {
    console.error(err); res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/student-exams/:id/submit  – submit exam and compute score
router.post('/:id/submit', authorize('STUDENT'), async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const seRes = await client.query(
      `SELECT se.id, se.exam_id FROM student_exams se
       WHERE se.id=$1 AND se.student_id=$2 AND se.status='ONGOING'`,
      [req.params.id, req.user.id]
    );
    if (!seRes.rows.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Active attempt not found' });
    }
    const se = seRes.rows[0];

    // Calculate score
    const scoreRes = await client.query(
      `SELECT COALESCE(SUM(eq.marks), 0)::int AS score
       FROM student_answers sa
       JOIN options o ON o.id = sa.selected_option_id AND o.is_correct = true
       JOIN exam_questions eq ON eq.question_id = sa.question_id AND eq.exam_id = $1
       WHERE sa.student_exam_id = $2`,
      [se.exam_id, se.id]
    );
    const score = scoreRes.rows[0].score;

    await client.query(
      `UPDATE student_exams SET status='COMPLETED', end_time=NOW(), score=$1 WHERE id=$2`,
      [score, se.id]
    );
    await client.query('COMMIT');
    res.json({ message: 'Exam submitted', score });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err); res.status(500).json({ message: 'Server error' });
  } finally {
    client.release();
  }
});

// GET /api/student-exams/:id/result  – view result with correct answers
router.get('/:id/result', authorize('STUDENT'), async (req, res) => {
  try {
    const seRes = await pool.query(
      `SELECT se.*, e.title, e.total_marks, e.passing_marks, e.show_results, e.duration_minutes
       FROM student_exams se JOIN exams e ON e.id = se.exam_id
       WHERE se.id=$1 AND se.student_id=$2 AND se.status='COMPLETED'`,
      [req.params.id, req.user.id]
    );
    if (!seRes.rows.length) return res.status(404).json({ message: 'Result not found' });

    const se = seRes.rows[0];
    if (!se.show_results) return res.json({ exam: se, questions: [], hidden: true });

    const qRes = await pool.query(
      `SELECT q.id, q.question_text, q.latex_expression, eq.marks, eq.question_order,
              sa.selected_option_id, sa.marked_for_review,
              COALESCE(
                JSON_AGG(
                  JSON_BUILD_OBJECT('id', o.id, 'text', o.option_text, 'isCorrect', o.is_correct, 'order', o.option_order)
                  ORDER BY o.option_order
                ) FILTER (WHERE o.id IS NOT NULL), '[]'
              ) AS options
       FROM exam_questions eq
       JOIN questions q ON q.id = eq.question_id
       LEFT JOIN options o ON o.question_id = q.id
       LEFT JOIN student_answers sa ON sa.question_id = q.id AND sa.student_exam_id=$1
       WHERE eq.exam_id=$2
       GROUP BY q.id, eq.marks, eq.question_order, sa.selected_option_id, sa.marked_for_review
       ORDER BY eq.question_order`,
      [req.params.id, se.exam_id]
    );

    res.json({ exam: se, questions: qRes.rows });
  } catch (err) {
    console.error(err); res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
