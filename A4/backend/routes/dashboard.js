const express = require('express');
const pool    = require('../config/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

// GET /api/dashboard — role-aware stats
router.get('/', async (req, res) => {
  try {
    const role = req.user.role;
    const data = {};

    // ─── ADMIN ────────────────────────────────────────────────
    if (role === 'ADMIN') {
      const [users, exams, questions, attempts] = await Promise.all([
        pool.query('SELECT COUNT(*)::int AS count FROM users WHERE is_active = true'),
        pool.query('SELECT COUNT(*)::int AS count FROM exams'),
        pool.query('SELECT COUNT(*)::int AS count FROM questions'),
        pool.query("SELECT COUNT(*)::int AS count FROM student_exams WHERE status = 'COMPLETED'"),
      ]);
      data.totalUsers     = users.rows[0].count;
      data.totalExams     = exams.rows[0].count;
      data.totalQuestions  = questions.rows[0].count;
      data.totalAttempts   = attempts.rows[0].count;

      const roleBreakdown = await pool.query(
        `SELECT role AS name, COUNT(*)::int AS count
         FROM users GROUP BY role ORDER BY role`
      );
      data.roleBreakdown = roleBreakdown.rows;

      const recentActivity = await pool.query(
        `SELECT se.id, u.full_name AS student, e.title AS exam,
                se.score, se.end_time
         FROM student_exams se
         JOIN users u ON u.id = se.student_id
         JOIN exams e ON e.id = se.exam_id
         WHERE se.status = 'COMPLETED'
         ORDER BY se.end_time DESC LIMIT 10`
      );
      data.recentActivity = recentActivity.rows;
    }

    // ─── FACULTY ──────────────────────────────────────────────
    if (role === 'FACULTY') {
      const myExams = await pool.query(
        `SELECT e.id, e.title, e.is_published,
                COUNT(DISTINCT eq.question_id)::int AS question_count,
                COUNT(DISTINCT se.id)::int AS attempt_count,
                ROUND(AVG(se.score), 1) AS avg_score
         FROM exams e
         LEFT JOIN exam_questions eq ON eq.exam_id = e.id
         LEFT JOIN student_exams se ON se.exam_id = e.id AND se.status = 'COMPLETED'
         WHERE e.created_by = $1
         GROUP BY e.id
         ORDER BY e.created_at DESC`,
        [req.user.id]
      );
      data.myExams = myExams.rows;

      const myQ = await pool.query(
        'SELECT COUNT(*)::int AS count FROM questions WHERE created_by = $1',
        [req.user.id]
      );
      data.myQuestionCount = myQ.rows[0].count;
    }

    // ─── STUDENT ──────────────────────────────────────────────
    if (role === 'STUDENT') {
      const myAttempts = await pool.query(
        `SELECT se.id, e.title, se.status, se.score, e.total_marks,
                e.passing_marks, se.start_time, se.end_time, e.show_results
         FROM student_exams se JOIN exams e ON e.id = se.exam_id
         WHERE se.student_id = $1
         ORDER BY se.start_time DESC`,
        [req.user.id]
      );
      data.myAttempts = myAttempts.rows;

      const stats = await pool.query(
        `SELECT COUNT(*)::int AS total,
                COUNT(*) FILTER (WHERE se.score >= e.passing_marks)::int AS passed,
                ROUND(AVG(se.score), 1) AS avg_score
         FROM student_exams se JOIN exams e ON e.id = se.exam_id
         WHERE se.student_id = $1 AND se.status = 'COMPLETED'`,
        [req.user.id]
      );
      data.stats = stats.rows[0];
    }

    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
