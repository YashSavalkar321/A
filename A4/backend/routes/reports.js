const express = require('express');
const pool    = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate, authorize('ADMIN','FACULTY'));

// GET /api/reports/exam/:examId  – per-exam analytics
router.get('/exam/:examId', async (req, res) => {
  try {
    const examRes = await pool.query(
      `SELECT e.*, COUNT(DISTINCT eq.question_id)::int AS question_count
       FROM exams e LEFT JOIN exam_questions eq ON eq.exam_id = e.id
       WHERE e.id=$1 GROUP BY e.id`,
      [req.params.examId]
    );
    if (!examRes.rows.length) return res.status(404).json({ message: 'Exam not found' });

    const studentsRes = await pool.query(
      `SELECT se.id, u.full_name, u.email, se.score, se.status,
              se.start_time, se.end_time,
              EXTRACT(EPOCH FROM (se.end_time - se.start_time))/60 AS time_taken_minutes
       FROM student_exams se JOIN users u ON u.id = se.student_id
       WHERE se.exam_id=$1 AND se.status='COMPLETED'
       ORDER BY se.score DESC`,
      [req.params.examId]
    );

    // Per-question accuracy
    const accuracyRes = await pool.query(
      `SELECT q.id, q.question_text, q.difficulty,
              COUNT(sa.id)::int AS total_attempts,
              COUNT(sa.id) FILTER (
                WHERE o.is_correct = true AND sa.selected_option_id = o.id
              )::int AS correct_count,
              COUNT(sa.id) FILTER (WHERE sa.marked_for_review = true)::int AS review_count
       FROM exam_questions eq
       JOIN questions q ON q.id = eq.question_id
       LEFT JOIN student_answers sa ON sa.question_id = q.id
         AND sa.student_exam_id IN (
           SELECT id FROM student_exams WHERE exam_id=$1 AND status='COMPLETED'
         )
       LEFT JOIN options o ON o.id = sa.selected_option_id
       WHERE eq.exam_id=$1
       GROUP BY q.id
       ORDER BY eq.question_order`,
      [req.params.examId]
    );

    const scores = studentsRes.rows.map(r => r.score || 0);
    const avg    = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    const max    = scores.length ? Math.max(...scores) : 0;
    const min    = scores.length ? Math.min(...scores) : 0;
    const passed = studentsRes.rows.filter(r => r.score >= examRes.rows[0].passing_marks).length;

    res.json({
      exam: examRes.rows[0],
      summary: { total: scores.length, passed, failed: scores.length - passed, avg, max, min },
      students: studentsRes.rows,
      questionAccuracy: accuracyRes.rows
    });
  } catch (err) {
    console.error(err); res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/reports/student/:studentId  – per-student history
router.get('/student/:studentId', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT se.id, e.title, e.total_marks, e.passing_marks,
              se.score, se.status, se.start_time, se.end_time
       FROM student_exams se JOIN exams e ON e.id = se.exam_id
       WHERE se.student_id=$1
       ORDER BY se.start_time DESC`,
      [req.params.studentId]
    );
    res.json(rows);
  } catch (err) {
    console.error(err); res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/reports/exams/summary  – all exams overview
router.get('/exams/summary', async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT e.id, e.title, e.course_name, e.is_published,
              COUNT(DISTINCT se.id)::int AS attempts,
              COUNT(DISTINCT se.id) FILTER (WHERE se.status='COMPLETED')::int AS submitted,
              ROUND(AVG(se.score) FILTER (WHERE se.status='COMPLETED'), 1) AS avg_score
       FROM exams e
       LEFT JOIN student_exams se ON se.exam_id = e.id
       GROUP BY e.id
       ORDER BY e.created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error(err); res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
