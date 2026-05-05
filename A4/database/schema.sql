-- ═══════════════════════════════════════════════════════════════════════════════
-- Enterprise MCQ Examination System — PostgreSQL Schema
-- ═══════════════════════════════════════════════════════════════════════════════

-- Drop existing objects
DROP TABLE IF EXISTS student_answers CASCADE;
DROP TABLE IF EXISTS student_exams CASCADE;
DROP TABLE IF EXISTS exam_questions CASCADE;
DROP TABLE IF EXISTS exams CASCADE;
DROP TABLE IF EXISTS question_tags CASCADE;
DROP TABLE IF EXISTS tags CASCADE;
DROP TABLE IF EXISTS options CASCADE;
DROP TABLE IF EXISTS questions CASCADE;
DROP TABLE IF EXISTS courses CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TYPE  IF EXISTS user_role CASCADE;
DROP TYPE  IF EXISTS exam_status CASCADE;

-- ─── Enum Types ──────────────────────────────────────────────────────────────
CREATE TYPE user_role   AS ENUM ('ADMIN', 'FACULTY', 'STUDENT');
CREATE TYPE exam_status AS ENUM ('ONGOING', 'COMPLETED', 'TERMINATED');

-- ─── Users ───────────────────────────────────────────────────────────────────
CREATE TABLE users (
    id           SERIAL PRIMARY KEY,
    full_name    VARCHAR(255) NOT NULL,
    email        VARCHAR(255) UNIQUE NOT NULL,
    password     VARCHAR(255) NOT NULL,
    role         user_role NOT NULL DEFAULT 'STUDENT',
    is_active    BOOLEAN DEFAULT TRUE,
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─── Courses ─────────────────────────────────────────────────────────────────
CREATE TABLE courses (
    id            SERIAL PRIMARY KEY,
    course_code   VARCHAR(50) UNIQUE NOT NULL,
    course_name   VARCHAR(255) NOT NULL,
    instructor_id INTEGER REFERENCES users(id) ON DELETE SET NULL
);

-- ─── Tags (Subject / Topic / Difficulty) ─────────────────────────────────────
CREATE TABLE tags (
    id       SERIAL PRIMARY KEY,
    name     VARCHAR(100) NOT NULL,
    tag_type VARCHAR(20) NOT NULL DEFAULT 'TOPIC',
    UNIQUE(name, tag_type)
);

-- ─── Questions ───────────────────────────────────────────────────────────────
CREATE TABLE questions (
    id                  SERIAL PRIMARY KEY,
    question_text       TEXT NOT NULL,
    question_image_path VARCHAR(500),
    latex_expression    TEXT,
    course_id           INTEGER REFERENCES courses(id) ON DELETE SET NULL,
    difficulty          VARCHAR(20) DEFAULT 'MEDIUM',
    subject             VARCHAR(255),
    topic               VARCHAR(255),
    created_by          INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─── Question ↔ Tags (M:N) ──────────────────────────────────────────────────
CREATE TABLE question_tags (
    question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    tag_id      INTEGER NOT NULL REFERENCES tags(id)      ON DELETE CASCADE,
    PRIMARY KEY (question_id, tag_id)
);

-- ─── Options ─────────────────────────────────────────────────────────────────
CREATE TABLE options (
    id                SERIAL PRIMARY KEY,
    question_id       INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    option_text       TEXT NOT NULL,
    option_image_path VARCHAR(500),
    is_correct        BOOLEAN DEFAULT FALSE,
    option_order      INTEGER DEFAULT 1
);

-- ─── Exams ───────────────────────────────────────────────────────────────────
CREATE TABLE exams (
    id               SERIAL PRIMARY KEY,
    title            VARCHAR(255) NOT NULL,
    description      TEXT,
    course_id        INTEGER REFERENCES courses(id) ON DELETE SET NULL,
    course_name      VARCHAR(255),
    duration_minutes INTEGER NOT NULL DEFAULT 60,
    total_marks      INTEGER NOT NULL DEFAULT 100,
    passing_marks    INTEGER NOT NULL DEFAULT 40,
    exam_type        VARCHAR(20) DEFAULT 'FLEXIBLE',
    start_time       TIMESTAMP,
    end_time         TIMESTAMP,
    is_published     BOOLEAN DEFAULT FALSE,
    show_results     BOOLEAN DEFAULT TRUE,
    created_by       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─── Exam ↔ Questions (M:N) ─────────────────────────────────────────────────
CREATE TABLE exam_questions (
    id              SERIAL PRIMARY KEY,
    exam_id         INTEGER NOT NULL REFERENCES exams(id)     ON DELETE CASCADE,
    question_id     INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    marks           INTEGER DEFAULT 1,
    question_order  INTEGER DEFAULT 1,
    UNIQUE(exam_id, question_id)
);

-- ─── Student Exam Attempts ───────────────────────────────────────────────────
CREATE TABLE student_exams (
    id          SERIAL PRIMARY KEY,
    student_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    exam_id     INTEGER NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    start_time  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_time    TIMESTAMP,
    score       NUMERIC(5,2),
    status      exam_status DEFAULT 'ONGOING',
    UNIQUE(student_id, exam_id)
);

-- ─── Student Answers ─────────────────────────────────────────────────────────
CREATE TABLE student_answers (
    id                 SERIAL PRIMARY KEY,
    student_exam_id    INTEGER NOT NULL REFERENCES student_exams(id) ON DELETE CASCADE,
    question_id        INTEGER NOT NULL REFERENCES questions(id)      ON DELETE CASCADE,
    selected_option_id INTEGER REFERENCES options(id)                ON DELETE SET NULL,
    marked_for_review  BOOLEAN DEFAULT FALSE,
    answered_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_exam_id, question_id)
);

-- ─── Indexes ─────────────────────────────────────────────────────────────────
CREATE INDEX idx_users_role              ON users(role);
CREATE INDEX idx_users_email             ON users(email);
CREATE INDEX idx_questions_created_by    ON questions(created_by);
CREATE INDEX idx_questions_course_id     ON questions(course_id);
CREATE INDEX idx_questions_difficulty    ON questions(difficulty);
CREATE INDEX idx_exam_questions_exam_id  ON exam_questions(exam_id);
CREATE INDEX idx_student_exams_student   ON student_exams(student_id);
CREATE INDEX idx_student_exams_exam      ON student_exams(exam_id);
CREATE INDEX idx_student_answers_exam    ON student_answers(student_exam_id);
