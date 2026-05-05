const express = require('express');
const router = express.Router();
const pool = require('../db');
const { requirePermission } = require('../middleware/auth');

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN DASHBOARD — /api/dashboard/admin
// System-wide KPIs, analytics, enrollment distribution
// ─────────────────────────────────────────────────────────────────────────────
router.get('/admin', requirePermission('dashboard', 'read'), async (req, res) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  try {
    const [counts, deptStudents, coursePopularity, deptEnrollment, recentEnrollments] = await Promise.all([
      // KPI counts
      pool.query(`
        SELECT
          (SELECT COUNT(*) FROM student)    AS total_students,
          (SELECT COUNT(*) FROM instructor) AS total_instructors,
          (SELECT COUNT(*) FROM course)     AS total_courses,
          (SELECT COUNT(*) FROM department) AS total_departments,
          (SELECT COUNT(*) FROM section)    AS total_sections,
          (SELECT COUNT(*) FROM users)      AS total_users
      `),

      // Department-wise student distribution
      pool.query(`
        SELECT d.dept_name, COUNT(s.id) AS student_count
        FROM department d
        LEFT JOIN student s ON s.dept_name = d.dept_name
        GROUP BY d.dept_name
        ORDER BY student_count DESC
      `),

      // Course popularity (enrollment counts)
      pool.query(`
        SELECT c.course_id, c.title, c.dept_name, COUNT(t.id) AS enrollment_count
        FROM course c
        LEFT JOIN takes t ON t.course_id = c.course_id
        GROUP BY c.course_id, c.title, c.dept_name
        ORDER BY enrollment_count DESC
        LIMIT 10
      `),

      // Department enrollment (how many students enrolled in each dept's courses)
      pool.query(`
        SELECT c.dept_name, COUNT(DISTINCT t.id) AS enrolled_students
        FROM course c
        JOIN takes t ON t.course_id = c.course_id
        GROUP BY c.dept_name
        ORDER BY enrolled_students DESC
      `),

      // Recent enrollments
      pool.query(`
        SELECT s.name AS student_name, c.title AS course_title,
               t.semester, t.year, t.grade
        FROM takes t
        JOIN student s ON s.id = t.id
        JOIN course c ON c.course_id = t.course_id
        ORDER BY t.year DESC, t.semester DESC
        LIMIT 15
      `)
    ]);

    res.json({
      kpis: counts.rows[0],
      deptStudentDistribution: deptStudents.rows,
      coursePopularity: coursePopularity.rows,
      deptEnrollment: deptEnrollment.rows,
      recentEnrollments: recentEnrollments.rows
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// FACULTY DASHBOARD — /api/dashboard/faculty
// Teaching schedule, student roster, advisees, grade management
// ─────────────────────────────────────────────────────────────────────────────
router.get('/faculty', async (req, res) => {
  const { role, profile_id } = req.user;
  if (role !== 'faculty' && role !== 'admin') {
    return res.status(403).json({ message: 'Faculty access required' });
  }

  // Admin can optionally pass ?instructor_id= to view as a faculty member
  const instructorId = (role === 'admin' && req.query.instructor_id)
    ? req.query.instructor_id
    : profile_id;

  if (!instructorId) {
    return res.status(400).json({ message: 'No instructor profile linked to this account' });
  }

  try {
    const [profile, schedule, roster, advisees, gradeable] = await Promise.all([
      // Instructor profile
      pool.query('SELECT * FROM instructor WHERE id = $1', [instructorId]),

      // Teaching schedule: teaches ⋈ section ⋈ time_slot ⋈ course
      pool.query(`
        SELECT t.course_id, c.title AS course_title, c.credits,
               t.sec_id, t.semester, t.year,
               s.building, s.room_number,
               ts.time_slot_id, ts.day, ts.start_time, ts.end_time
        FROM teaches t
        JOIN section s ON s.course_id = t.course_id AND s.sec_id = t.sec_id
                       AND s.semester = t.semester AND s.year = t.year
        JOIN course c ON c.course_id = t.course_id
        LEFT JOIN time_slot ts ON ts.time_slot_id = s.time_slot_id
        WHERE t.id = $1
        ORDER BY t.year DESC, t.semester, ts.day, ts.start_time
      `, [instructorId]),

      // Student roster: students enrolled in faculty's sections
      pool.query(`
        SELECT DISTINCT tk.id AS student_id, st.name AS student_name,
               st.dept_name, tk.course_id, c.title AS course_title,
               tk.sec_id, tk.semester, tk.year, tk.grade
        FROM teaches t
        JOIN takes tk ON tk.course_id = t.course_id AND tk.sec_id = t.sec_id
                      AND tk.semester = t.semester AND tk.year = t.year
        JOIN student st ON st.id = tk.id
        JOIN course c ON c.course_id = tk.course_id
        WHERE t.id = $1
        ORDER BY tk.year DESC, tk.semester, c.title, st.name
      `, [instructorId]),

      // Advisees: students assigned via advisor table
      pool.query(`
        SELECT a.s_id AS student_id, s.name AS student_name,
               s.dept_name, s.tot_cred, s.address, s.mobile_no
        FROM advisor a
        JOIN student s ON s.id = a.s_id
        WHERE a.i_id = $1
        ORDER BY s.name
      `, [instructorId]),

      // Sections where grades can be managed (current or recent)
      pool.query(`
        SELECT t.course_id, c.title AS course_title,
               t.sec_id, t.semester, t.year,
               COUNT(tk.id) AS student_count
        FROM teaches t
        JOIN course c ON c.course_id = t.course_id
        LEFT JOIN takes tk ON tk.course_id = t.course_id AND tk.sec_id = t.sec_id
                           AND tk.semester = t.semester AND tk.year = t.year
        WHERE t.id = $1
        GROUP BY t.course_id, c.title, t.sec_id, t.semester, t.year
        ORDER BY t.year DESC, t.semester
      `, [instructorId])
    ]);

    res.json({
      profile: profile.rows[0] || null,
      schedule: schedule.rows,
      studentRoster: roster.rows,
      advisees: advisees.rows,
      gradeableSections: gradeable.rows
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Faculty: Update a grade for a student in their section
router.put('/faculty/grade', async (req, res) => {
  const { role, profile_id } = req.user;
  if (role !== 'faculty' && role !== 'admin') {
    return res.status(403).json({ message: 'Faculty access required' });
  }

  const { student_id, course_id, sec_id, semester, year, grade } = req.body;
  const instructorId = (role === 'admin') ? req.body.instructor_id || profile_id : profile_id;

  try {
    // Verify faculty teaches this section (skip for admin)
    if (role !== 'admin') {
      const check = await pool.query(
        `SELECT 1 FROM teaches
         WHERE id = $1 AND course_id = $2 AND sec_id = $3
               AND semester = $4 AND year = $5`,
        [instructorId, course_id, sec_id, semester, year]
      );
      if (!check.rows.length) {
        return res.status(403).json({ message: 'You do not teach this section' });
      }
    }

    await pool.query(
      `UPDATE takes SET grade = $1
       WHERE id = $2 AND course_id = $3 AND sec_id = $4
             AND semester = $5 AND year = $6`,
      [grade, student_id, course_id, sec_id, semester, year]
    );
    res.json({ message: 'Grade updated' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// STUDENT DASHBOARD — /api/dashboard/student
// Timetable, marksheet, academic progress, upcoming classes
// ─────────────────────────────────────────────────────────────────────────────
router.get('/student', async (req, res) => {
  const { role, profile_id } = req.user;
  if (role !== 'student' && role !== 'admin') {
    return res.status(403).json({ message: 'Student access required' });
  }

  const studentId = (role === 'admin' && req.query.student_id)
    ? req.query.student_id
    : profile_id;

  if (!studentId) {
    return res.status(400).json({ message: 'No student profile linked to this account' });
  }

  try {
    const [profile, timetable, marksheet, advisor, currentEnrollments] = await Promise.all([
      // Student profile
      pool.query('SELECT * FROM student WHERE id = $1', [studentId]),

      // Weekly timetable: takes ⋈ section ⋈ time_slot ⋈ course
      pool.query(`
        SELECT tk.course_id, c.title AS course_title, c.credits,
               tk.sec_id, tk.semester, tk.year,
               s.building, s.room_number,
               ts.time_slot_id, ts.day, ts.start_time, ts.end_time
        FROM takes tk
        JOIN section s ON s.course_id = tk.course_id AND s.sec_id = tk.sec_id
                       AND s.semester = tk.semester AND s.year = tk.year
        JOIN course c ON c.course_id = tk.course_id
        LEFT JOIN time_slot ts ON ts.time_slot_id = s.time_slot_id
        WHERE tk.id = $1
        ORDER BY tk.year DESC, tk.semester, ts.day, ts.start_time
      `, [studentId]),

      // Marksheet: all enrolled courses with grades
      pool.query(`
        SELECT tk.course_id, c.title AS course_title, c.credits, c.dept_name,
               tk.sec_id, tk.semester, tk.year, tk.grade
        FROM takes tk
        JOIN course c ON c.course_id = tk.course_id
        WHERE tk.id = $1
        ORDER BY tk.year DESC, tk.semester, c.title
      `, [studentId]),

      // Advisor info
      pool.query(`
        SELECT a.i_id AS advisor_id, i.name AS advisor_name, i.dept_name
        FROM advisor a
        JOIN instructor i ON i.id = a.i_id
        WHERE a.s_id = $1
      `, [studentId]),

      // Current enrollments (no grade yet = in-progress)
      pool.query(`
        SELECT tk.course_id, c.title AS course_title, c.credits,
               tk.sec_id, tk.semester, tk.year,
               s.building, s.room_number,
               ts.time_slot_id, ts.day, ts.start_time, ts.end_time
        FROM takes tk
        JOIN section s ON s.course_id = tk.course_id AND s.sec_id = tk.sec_id
                       AND s.semester = tk.semester AND s.year = tk.year
        JOIN course c ON c.course_id = tk.course_id
        LEFT JOIN time_slot ts ON ts.time_slot_id = s.time_slot_id
        WHERE tk.id = $1 AND tk.grade IS NULL
        ORDER BY ts.day, ts.start_time
      `, [studentId])
    ]);

    const studentProfile = profile.rows[0] || {};
    // Calculate degree progress (assume 128 credits for degree completion)
    const totalCreditsRequired = 128;
    const completedCredits = parseInt(studentProfile.tot_cred) || 0;
    const progressPercent = Math.min(100, Math.round((completedCredits / totalCreditsRequired) * 100));

    res.json({
      profile: studentProfile,
      timetable: timetable.rows,
      marksheet: marksheet.rows,
      advisor: advisor.rows[0] || null,
      currentEnrollments: currentEnrollments.rows,
      academicProgress: {
        completedCredits,
        totalCreditsRequired,
        progressPercent,
        totalCoursesTaken: marksheet.rows.length,
        coursesCompleted: marksheet.rows.filter(r => r.grade !== null).length,
        coursesInProgress: marksheet.rows.filter(r => r.grade === null).length
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
