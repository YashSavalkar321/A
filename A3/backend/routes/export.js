const express = require('express');
const router = express.Router();
const pool = require('../db');
const PDFDocument = require('pdfkit');
const { requirePermission } = require('../middleware/auth');

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Convert array of objects to CSV string */
function toCSV(rows, columns) {
  if (!rows.length) return columns.join(',') + '\n';
  const header = columns.join(',');
  const body = rows.map(r => columns.map(c => {
    let val = r[c] ?? '';
    val = String(val).replace(/"/g, '""');
    return `"${val}"`;
  }).join(',')).join('\n');
  return header + '\n' + body + '\n';
}

/** Build a styled PDF document with title, subtitle, and tables  */
function buildPDF(res, { title, subtitle, sections }) {
  const doc = new PDFDocument({ margin: 40, size: 'A4', bufferPages: true });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${title.replace(/\s/g, '_')}.pdf"`);
  doc.pipe(res);

  // ── Title Page Header ──
  doc.rect(0, 0, doc.page.width, 90).fill('#1e1040');
  doc.fontSize(22).fill('#fff').text(title, 40, 30);
  doc.fontSize(10).fill('rgba(255,255,255,0.7)').text(subtitle, 40, 58);
  doc.fontSize(8).fill('rgba(255,255,255,0.5)').text(`Generated: ${new Date().toLocaleString()}`, 40, 74);
  doc.fill('#000');

  let y = 110;

  for (const section of sections) {
    // Section heading
    if (y > doc.page.height - 120) { doc.addPage(); y = 40; }
    doc.fontSize(13).fill('#2d1b69').text(section.title, 40, y);
    y += 22;

    if (section.type === 'kpi' && section.data) {
      // Key-value pairs in a 2-column grid
      const entries = Object.entries(section.data);
      for (let i = 0; i < entries.length; i += 2) {
        if (y > doc.page.height - 60) { doc.addPage(); y = 40; }
        for (let j = 0; j < 2 && (i + j) < entries.length; j++) {
          const [key, val] = entries[i + j];
          const x = 40 + j * 260;
          doc.fontSize(9).fill('#666').text(formatLabel(key), x, y);
          doc.fontSize(12).fill('#1e1040').text(String(val), x, y + 12);
        }
        y += 34;
      }
      y += 10;
    }

    if (section.type === 'table' && section.rows?.length) {
      const cols = section.columns;
      const colWidth = Math.min(110, (doc.page.width - 80) / cols.length);

      // Table header
      if (y > doc.page.height - 60) { doc.addPage(); y = 40; }
      doc.rect(40, y, colWidth * cols.length, 18).fill('#e9d5ff');
      cols.forEach((col, i) => {
        doc.fontSize(8).fill('#1e1040').text(formatLabel(col), 44 + i * colWidth, y + 4, { width: colWidth - 8 });
      });
      y += 20;

      // Table rows
      for (const row of section.rows) {
        if (y > doc.page.height - 40) { doc.addPage(); y = 40; }
        const bgColor = section.rows.indexOf(row) % 2 === 0 ? '#faf5ff' : '#fff';
        doc.rect(40, y, colWidth * cols.length, 16).fill(bgColor);
        cols.forEach((col, i) => {
          const val = row[col] ?? '';
          doc.fontSize(7.5).fill('#333').text(String(val), 44 + i * colWidth, y + 4, {
            width: colWidth - 8, lineBreak: false
          });
        });
        y += 16;
      }
      y += 16;
    }
  }

  // Footer on every page
  const pages = doc.bufferedPageRange();
  for (let i = 0; i < pages.count; i++) {
    doc.switchToPage(i);
    doc.fontSize(7).fill('#999')
      .text(`University MIS — Page ${i + 1} of ${pages.count}`, 40, doc.page.height - 30, {
        align: 'center', width: doc.page.width - 80
      });
  }

  doc.end();
}

function formatLabel(key) {
  return key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN EXPORT — /api/export/admin?format=csv|pdf
// ─────────────────────────────────────────────────────────────────────────────
router.get('/admin', requirePermission('export', 'read'), async (req, res) => {
  const format = (req.query.format || 'csv').toLowerCase();

  try {
    const [counts, deptStudents, coursePopularity, recentEnrollments] = await Promise.all([
      pool.query(`
        SELECT
          (SELECT COUNT(*) FROM student)    AS total_students,
          (SELECT COUNT(*) FROM instructor) AS total_instructors,
          (SELECT COUNT(*) FROM course)     AS total_courses,
          (SELECT COUNT(*) FROM department) AS total_departments,
          (SELECT COUNT(*) FROM section)    AS total_sections,
          (SELECT COUNT(*) FROM users)      AS total_users
      `),
      pool.query(`
        SELECT d.dept_name, COUNT(s.id) AS student_count
        FROM department d LEFT JOIN student s ON s.dept_name = d.dept_name
        GROUP BY d.dept_name ORDER BY student_count DESC
      `),
      pool.query(`
        SELECT c.course_id, c.title, c.dept_name, COUNT(t.id) AS enrollment_count
        FROM course c LEFT JOIN takes t ON t.course_id = c.course_id
        GROUP BY c.course_id, c.title, c.dept_name
        ORDER BY enrollment_count DESC LIMIT 10
      `),
      pool.query(`
        SELECT s.name AS student_name, c.title AS course_title,
               t.semester, t.year, t.grade
        FROM takes t
        JOIN student s ON s.id = t.id
        JOIN course c ON c.course_id = t.course_id
        ORDER BY t.year DESC, t.semester DESC LIMIT 15
      `)
    ]);

    const kpis = counts.rows[0];

    if (format === 'pdf') {
      return buildPDF(res, {
        title: 'Admin Dashboard Report',
        subtitle: 'System-wide analytics & administration summary',
        sections: [
          { title: 'Key Performance Indicators', type: 'kpi', data: kpis },
          { title: 'Department-wise Students', type: 'table', columns: ['dept_name', 'student_count'], rows: deptStudents.rows },
          { title: 'Course Popularity (Top 10)', type: 'table', columns: ['course_id', 'title', 'dept_name', 'enrollment_count'], rows: coursePopularity.rows },
          { title: 'Recent Enrollments', type: 'table', columns: ['student_name', 'course_title', 'semester', 'year', 'grade'], rows: recentEnrollments.rows },
        ]
      });
    }

    // CSV — combine all data sections
    let csv = '--- KEY PERFORMANCE INDICATORS ---\n';
    csv += toCSV([kpis], Object.keys(kpis));
    csv += '\n--- DEPARTMENT-WISE STUDENTS ---\n';
    csv += toCSV(deptStudents.rows, ['dept_name', 'student_count']);
    csv += '\n--- COURSE POPULARITY (TOP 10) ---\n';
    csv += toCSV(coursePopularity.rows, ['course_id', 'title', 'dept_name', 'enrollment_count']);
    csv += '\n--- RECENT ENROLLMENTS ---\n';
    csv += toCSV(recentEnrollments.rows, ['student_name', 'course_title', 'semester', 'year', 'grade']);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="Admin_Dashboard_Report.csv"');
    res.send(csv);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// FACULTY EXPORT — /api/export/faculty?format=csv|pdf
// ─────────────────────────────────────────────────────────────────────────────
router.get('/faculty', async (req, res) => {
  const { role, profile_id } = req.user;
  if (role !== 'faculty' && role !== 'admin') {
    return res.status(403).json({ message: 'Faculty access required' });
  }
  const instructorId = (role === 'admin' && req.query.instructor_id)
    ? req.query.instructor_id : profile_id;
  if (!instructorId) {
    return res.status(400).json({ message: 'No instructor profile linked' });
  }

  const format = (req.query.format || 'csv').toLowerCase();

  try {
    const [profile, schedule, roster, advisees] = await Promise.all([
      pool.query('SELECT * FROM instructor WHERE id = $1', [instructorId]),
      pool.query(`
        SELECT t.course_id, c.title AS course_title, t.sec_id, t.semester, t.year,
               s.building, s.room_number, ts.day, ts.start_time, ts.end_time
        FROM teaches t
        JOIN section s ON s.course_id = t.course_id AND s.sec_id = t.sec_id
                       AND s.semester = t.semester AND s.year = t.year
        JOIN course c ON c.course_id = t.course_id
        LEFT JOIN time_slot ts ON ts.time_slot_id = s.time_slot_id
        WHERE t.id = $1
        ORDER BY t.year DESC, t.semester, ts.day, ts.start_time
      `, [instructorId]),
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
      pool.query(`
        SELECT a.s_id AS student_id, s.name AS student_name,
               s.dept_name, s.tot_cred, s.address, s.mobile_no
        FROM advisor a JOIN student s ON s.id = a.s_id
        WHERE a.i_id = $1
        ORDER BY s.name
      `, [instructorId])
    ]);

    const prof = profile.rows[0];
    const profName = prof ? prof.name : 'Faculty';

    if (format === 'pdf') {
      return buildPDF(res, {
        title: `Faculty Report — ${profName}`,
        subtitle: prof ? `${prof.dept_name} Department · ID: ${prof.id}` : '',
        sections: [
          {
            title: 'Teaching Schedule',
            type: 'table',
            columns: ['course_id', 'course_title', 'sec_id', 'semester', 'year', 'day', 'start_time', 'end_time', 'building', 'room_number'],
            rows: schedule.rows
          },
          {
            title: 'Student Roster & Grades',
            type: 'table',
            columns: ['student_id', 'student_name', 'dept_name', 'course_id', 'course_title', 'semester', 'year', 'grade'],
            rows: roster.rows
          },
          {
            title: 'Advisees',
            type: 'table',
            columns: ['student_id', 'student_name', 'dept_name', 'tot_cred', 'address', 'mobile_no'],
            rows: advisees.rows
          },
        ]
      });
    }

    let csv = `--- FACULTY: ${profName} ---\n`;
    if (prof) csv += `Department,${prof.dept_name}\nID,${prof.id}\nSalary,${prof.salary}\n`;
    csv += '\n--- TEACHING SCHEDULE ---\n';
    csv += toCSV(schedule.rows, ['course_id', 'course_title', 'sec_id', 'semester', 'year', 'day', 'start_time', 'end_time', 'building', 'room_number']);
    csv += '\n--- STUDENT ROSTER & GRADES ---\n';
    csv += toCSV(roster.rows, ['student_id', 'student_name', 'dept_name', 'course_id', 'course_title', 'semester', 'year', 'grade']);
    csv += '\n--- ADVISEES ---\n';
    csv += toCSV(advisees.rows, ['student_id', 'student_name', 'dept_name', 'tot_cred', 'address', 'mobile_no']);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="Faculty_Report_${profName.replace(/\s/g, '_')}.csv"`);
    res.send(csv);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// STUDENT EXPORT — /api/export/student?format=csv|pdf
// ─────────────────────────────────────────────────────────────────────────────
router.get('/student', async (req, res) => {
  const { role, profile_id } = req.user;
  if (role !== 'student' && role !== 'admin') {
    return res.status(403).json({ message: 'Student access required' });
  }
  const studentId = (role === 'admin' && req.query.student_id)
    ? req.query.student_id : profile_id;
  if (!studentId) {
    return res.status(400).json({ message: 'No student profile linked' });
  }

  const format = (req.query.format || 'csv').toLowerCase();

  try {
    const [profile, timetable, marksheet, advisor] = await Promise.all([
      pool.query('SELECT * FROM student WHERE id = $1', [studentId]),
      pool.query(`
        SELECT tk.course_id, c.title AS course_title,
               tk.sec_id, tk.semester, tk.year,
               s.building, s.room_number,
               ts.day, ts.start_time, ts.end_time
        FROM takes tk
        JOIN section s ON s.course_id = tk.course_id AND s.sec_id = tk.sec_id
                       AND s.semester = tk.semester AND s.year = tk.year
        JOIN course c ON c.course_id = tk.course_id
        LEFT JOIN time_slot ts ON ts.time_slot_id = s.time_slot_id
        WHERE tk.id = $1
        ORDER BY ts.day, ts.start_time
      `, [studentId]),
      pool.query(`
        SELECT tk.course_id, c.title AS course_title, c.credits, c.dept_name,
               tk.semester, tk.year, tk.grade
        FROM takes tk JOIN course c ON c.course_id = tk.course_id
        WHERE tk.id = $1
        ORDER BY tk.year DESC, tk.semester, c.title
      `, [studentId]),
      pool.query(`
        SELECT i.name AS advisor_name, i.dept_name
        FROM advisor a JOIN instructor i ON i.id = a.i_id
        WHERE a.s_id = $1
      `, [studentId])
    ]);

    const prof = profile.rows[0] || {};
    const studentName = prof.name || 'Student';
    const completedCredits = parseInt(prof.tot_cred) || 0;
    const totalCreditsRequired = 128;
    const progressPercent = Math.min(100, Math.round((completedCredits / totalCreditsRequired) * 100));

    // GPA calculation
    const gradePoints = {
      'A': 4.0, 'A-': 3.7, 'B+': 3.3, 'B': 3.0, 'B-': 2.7,
      'C+': 2.3, 'C': 2.0, 'C-': 1.7, 'D+': 1.3, 'D': 1.0, 'D-': 0.7, 'F': 0.0
    };
    let totalPoints = 0, totalCreds = 0;
    for (const m of marksheet.rows) {
      if (m.grade && gradePoints[m.grade] !== undefined) {
        totalPoints += gradePoints[m.grade] * parseFloat(m.credits);
        totalCreds += parseFloat(m.credits);
      }
    }
    const gpa = totalCreds > 0 ? (totalPoints / totalCreds).toFixed(2) : 'N/A';
    const advisorInfo = advisor.rows[0];

    if (format === 'pdf') {
      return buildPDF(res, {
        title: `Student Transcript — ${studentName}`,
        subtitle: `${prof.dept_name || ''} · ID: ${prof.id || ''} · GPA: ${gpa}`,
        sections: [
          {
            title: 'Academic Summary',
            type: 'kpi',
            data: {
              'Student Name': studentName,
              'Department': prof.dept_name || '-',
              'Address': prof.address || '-',
              'Mobile No': prof.mobile_no || '-',
              'Credits Earned': completedCredits,
              'Total Required': totalCreditsRequired,
              'Progress': `${progressPercent}%`,
              'GPA': gpa,
              'Courses Taken': marksheet.rows.length,
              'Courses Completed': marksheet.rows.filter(r => r.grade !== null).length,
              'In Progress': marksheet.rows.filter(r => r.grade === null).length,
              'Advisor': advisorInfo ? `${advisorInfo.advisor_name} (${advisorInfo.dept_name})` : 'Not assigned'
            }
          },
          {
            title: 'Marksheet / Transcript',
            type: 'table',
            columns: ['course_id', 'course_title', 'credits', 'dept_name', 'semester', 'year', 'grade'],
            rows: marksheet.rows.map(r => ({ ...r, grade: r.grade || 'In Progress' }))
          },
          {
            title: 'Weekly Timetable',
            type: 'table',
            columns: ['day', 'start_time', 'end_time', 'course_id', 'course_title', 'building', 'room_number'],
            rows: timetable.rows
          },
        ]
      });
    }

    // CSV
    let csv = `--- STUDENT: ${studentName} ---\n`;
    csv += `ID,${prof.id || ''}\nDepartment,${prof.dept_name || ''}\nAddress,${prof.address || ''}\nMobile No,${prof.mobile_no || ''}\nCredits Earned,${completedCredits}\n`;
    csv += `GPA,${gpa}\nProgress,${progressPercent}%\n`;
    if (advisorInfo) csv += `Advisor,${advisorInfo.advisor_name} (${advisorInfo.dept_name})\n`;
    csv += '\n--- MARKSHEET ---\n';
    csv += toCSV(marksheet.rows.map(r => ({ ...r, grade: r.grade || 'In Progress' })),
      ['course_id', 'course_title', 'credits', 'dept_name', 'semester', 'year', 'grade']);
    csv += '\n--- WEEKLY TIMETABLE ---\n';
    csv += toCSV(timetable.rows, ['day', 'start_time', 'end_time', 'course_id', 'course_title', 'building', 'room_number']);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="Student_Transcript_${studentName.replace(/\s/g, '_')}.csv"`);
    res.send(csv);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
