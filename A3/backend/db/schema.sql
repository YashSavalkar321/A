-- University MIS Database Schema
-- Based on Korth University Schema

-- RBAC: Roles table
DROP TABLE IF EXISTS role_permissions CASCADE;
DROP TABLE IF EXISTS roles CASCADE;
CREATE TABLE roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  description VARCHAR(255),
  is_system BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- RBAC: Role permissions table
CREATE TABLE role_permissions (
  id SERIAL PRIMARY KEY,
  role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
  resource VARCHAR(50) NOT NULL,
  can_read BOOLEAN DEFAULT FALSE,
  can_create BOOLEAN DEFAULT FALSE,
  can_update BOOLEAN DEFAULT FALSE,
  can_delete BOOLEAN DEFAULT FALSE,
  UNIQUE(role_id, resource)
);

-- Users table for authentication
DROP TABLE IF EXISTS users CASCADE;
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'student',
  profile_id VARCHAR(5) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- University Schema (from Korth book, unchanged)
CREATE TABLE IF NOT EXISTS classroom (
  building VARCHAR(15),
  room_number VARCHAR(7),
  capacity NUMERIC(4,0),
  PRIMARY KEY (building, room_number)
);

CREATE TABLE IF NOT EXISTS department (
  dept_name VARCHAR(20) PRIMARY KEY,
  building VARCHAR(15),
  budget NUMERIC(12,2) CHECK (budget > 0)
);

CREATE TABLE IF NOT EXISTS course (
  course_id VARCHAR(8) PRIMARY KEY,
  title VARCHAR(50),
  dept_name VARCHAR(20) REFERENCES department(dept_name),
  credits NUMERIC(2,0) CHECK (credits > 0)
);

CREATE TABLE IF NOT EXISTS instructor (
  id VARCHAR(5) PRIMARY KEY,
  name VARCHAR(20) NOT NULL,
  dept_name VARCHAR(20) REFERENCES department(dept_name),
  salary NUMERIC(8,2) CHECK (salary > 29000)
);

CREATE TABLE IF NOT EXISTS time_slot (
  time_slot_id VARCHAR(4),
  day VARCHAR(1),
  start_time TIME,
  end_time TIME,
  PRIMARY KEY (time_slot_id, day, start_time)
);

CREATE TABLE IF NOT EXISTS section (
  course_id VARCHAR(8) REFERENCES course(course_id),
  sec_id VARCHAR(8),
  semester VARCHAR(6) CHECK (semester IN ('Fall','Winter','Spring','Summer')),
  year NUMERIC(4,0) CHECK (year > 1701 AND year < 2100),
  building VARCHAR(15),
  room_number VARCHAR(7),
  time_slot_id VARCHAR(4),
  PRIMARY KEY (course_id, sec_id, semester, year),
  FOREIGN KEY (building, room_number) REFERENCES classroom(building, room_number)
);

CREATE TABLE IF NOT EXISTS teaches (
  id VARCHAR(5) REFERENCES instructor(id),
  course_id VARCHAR(8),
  sec_id VARCHAR(8),
  semester VARCHAR(6),
  year NUMERIC(4,0),
  PRIMARY KEY (id, course_id, sec_id, semester, year),
  FOREIGN KEY (course_id, sec_id, semester, year) REFERENCES section(course_id, sec_id, semester, year)
);

CREATE TABLE IF NOT EXISTS student (
  id VARCHAR(5) PRIMARY KEY,
  name VARCHAR(20) NOT NULL,
  dept_name VARCHAR(20) REFERENCES department(dept_name),
  tot_cred NUMERIC(3,0) DEFAULT 0 CHECK (tot_cred >= 0),
  address VARCHAR(100) DEFAULT NULL,
  mobile_no VARCHAR(15) DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS takes (
  id VARCHAR(5) REFERENCES student(id),
  course_id VARCHAR(8),
  sec_id VARCHAR(8),
  semester VARCHAR(6),
  year NUMERIC(4,0),
  grade VARCHAR(2),
  PRIMARY KEY (id, course_id, sec_id, semester, year),
  FOREIGN KEY (course_id, sec_id, semester, year) REFERENCES section(course_id, sec_id, semester, year)
);

CREATE TABLE IF NOT EXISTS advisor (
  s_id VARCHAR(5) PRIMARY KEY REFERENCES student(id),
  i_id VARCHAR(5) REFERENCES instructor(id)
);

CREATE TABLE IF NOT EXISTS prereq (
  course_id VARCHAR(8) REFERENCES course(course_id),
  prereq_id VARCHAR(8) REFERENCES course(course_id),
  PRIMARY KEY (course_id, prereq_id)
);

-- Default admin user (password: admin123)
INSERT INTO users (username, password, role) VALUES
  ('admin', 'admin123', 'admin')
ON CONFLICT (username) DO NOTHING;

-- ============================================================
-- DUMMY DATA FOR TESTING
-- ============================================================

-- Extra users (password for all: test123)
-- faculty1 → instructor 10101 (Srinivasan), faculty2 → instructor 45565 (Katz)
-- student1 → student 00128 (Zhang),        student2 → student 12345 (Shankar)
INSERT INTO users (username, password, role, profile_id) VALUES
  ('faculty1', 'test123', 'faculty', '10101'),
  ('faculty2', 'test123', 'faculty', '45565'),
  ('student1', 'test123', 'student', '00128'),
  ('student2', 'test123', 'student', '12345')
ON CONFLICT (username) DO NOTHING;

-- Classrooms
INSERT INTO classroom (building, room_number, capacity) VALUES
  ('Watson',  '100', 30),
  ('Watson',  '120', 50),
  ('Packard', '101', 500),
  ('Painter', '514', 10),
  ('Taylor',  '3128', 70),
  ('Taylor',  '7128', 80),
  ('Lambton', '134', 25),
  ('Lambton', '201', 40)
ON CONFLICT DO NOTHING;

-- Departments
INSERT INTO department (dept_name, building, budget) VALUES
  ('Comp. Sci.',  'Taylor',   100000),
  ('Biology',     'Watson',   90000),
  ('Elec. Eng.',  'Taylor',   85000),
  ('Finance',     'Painter',  120000),
  ('History',     'Painter',  50000),
  ('Music',       'Packard',  80000),
  ('Physics',     'Watson',   70000)
ON CONFLICT DO NOTHING;

-- Courses
INSERT INTO course (course_id, title, dept_name, credits) VALUES
  ('CS-101',  'Intro. to Computer Science', 'Comp. Sci.', 4),
  ('CS-190',  'Game Design',                'Comp. Sci.', 4),
  ('CS-315',  'Robotics',                   'Comp. Sci.', 3),
  ('CS-319',  'Image Processing',           'Comp. Sci.', 3),
  ('CS-347',  'Database System Concepts',   'Comp. Sci.', 3),
  ('CS-490',  'Distributed Systems',        'Comp. Sci.', 3),
  ('BIO-101', 'Intro. to Biology',          'Biology',    4),
  ('BIO-301', 'Genetics',                   'Biology',    4),
  ('EE-181',  'Intro. to Digital Systems',  'Elec. Eng.', 3),
  ('FIN-201', 'Investment Banking',         'Finance',    3),
  ('HIS-351', 'World History',              'History',    3),
  ('MU-199',  'Music Video Production',     'Music',      3),
  ('PHY-101', 'Physical Principles',        'Physics',    4)
ON CONFLICT DO NOTHING;

-- Instructors
INSERT INTO instructor (id, name, dept_name, salary) VALUES
  ('10101', 'Srinivasan',  'Comp. Sci.', 65000),
  ('12121', 'Wu',          'Finance',    90000),
  ('15151', 'Mozart',      'Music',      40000),
  ('22222', 'Einstein',    'Physics',    95000),
  ('32343', 'El Said',     'History',    60000),
  ('33456', 'Gold',        'Physics',    87000),
  ('45565', 'Katz',        'Comp. Sci.', 75000),
  ('58583', 'Califieri',   'History',    62000),
  ('76543', 'Singh',       'Finance',    80000),
  ('76766', 'Crick',       'Biology',    72000),
  ('83821', 'Brandt',      'Comp. Sci.', 92000),
  ('98345', 'Kim',         'Elec. Eng.', 80000)
ON CONFLICT DO NOTHING;

-- Time Slots
INSERT INTO time_slot (time_slot_id, day, start_time, end_time) VALUES
  ('A', 'M', '08:00', '08:50'),
  ('A', 'W', '08:00', '08:50'),
  ('A', 'F', '08:00', '08:50'),
  ('B', 'M', '09:00', '09:50'),
  ('B', 'W', '09:00', '09:50'),
  ('B', 'F', '09:00', '09:50'),
  ('C', 'T', '11:00', '12:15'),
  ('C', 'R', '11:00', '12:15'),
  ('D', 'M', '13:00', '13:50'),
  ('D', 'W', '13:00', '13:50'),
  ('D', 'F', '13:00', '13:50'),
  ('E', 'T', '14:30', '15:45'),
  ('E', 'R', '14:30', '15:45'),
  ('F', 'M', '16:00', '16:50'),
  ('F', 'W', '16:00', '16:50'),
  ('F', 'F', '16:00', '16:50'),
  ('G', 'M', '10:00', '10:50'),
  ('G', 'W', '10:00', '10:50'),
  ('H', 'T', '09:00', '09:50'),
  ('H', 'R', '09:00', '09:50')
ON CONFLICT DO NOTHING;

-- Sections
INSERT INTO section (course_id, sec_id, semester, year, building, room_number, time_slot_id) VALUES
  ('CS-101',  '1', 'Fall',   2023, 'Packard', '101',  'H'),
  ('CS-101',  '1', 'Spring', 2024, 'Lambton', '134',  'A'),
  ('CS-190',  '2', 'Spring', 2024, 'Taylor',  '3128', 'B'),
  ('CS-315',  '1', 'Spring', 2024, 'Watson',  '120',  'D'),
  ('CS-347',  '1', 'Fall',   2023, 'Taylor',  '3128', 'C'),
  ('CS-490',  '1', 'Spring', 2024, 'Taylor',  '7128', 'E'),
  ('BIO-101', '1', 'Fall',   2023, 'Painter', '514',  'A'),
  ('BIO-301', '1', 'Spring', 2024, 'Taylor',  '7128', 'B'),
  ('EE-181',  '1', 'Spring', 2024, 'Taylor',  '3128', 'C'),
  ('FIN-201', '1', 'Fall',   2023, 'Painter', '514',  'D'),
  ('HIS-351', '1', 'Fall',   2023, 'Lambton', '201',  'F'),
  ('MU-199',  '1', 'Spring', 2024, 'Packard', '101',  'G'),
  ('PHY-101', '1', 'Fall',   2023, 'Watson',  '100',  'B'),
  ('CS-101',  '1', 'Fall',   2024, 'Packard', '101',  'A'),
  ('CS-347',  '1', 'Spring', 2025, 'Taylor',  '3128', 'D'),
  ('CS-319',  '1', 'Spring', 2024, 'Watson',  '120',  'C')
ON CONFLICT DO NOTHING;

-- Teaches
INSERT INTO teaches (id, course_id, sec_id, semester, year) VALUES
  ('10101', 'CS-101',  '1', 'Fall',   2023),
  ('10101', 'CS-347',  '1', 'Fall',   2023),
  ('45565', 'CS-101',  '1', 'Spring', 2024),
  ('45565', 'CS-190',  '2', 'Spring', 2024),
  ('83821', 'CS-490',  '1', 'Spring', 2024),
  ('98345', 'EE-181',  '1', 'Spring', 2024),
  ('76766', 'BIO-101', '1', 'Fall',   2023),
  ('76766', 'BIO-301', '1', 'Spring', 2024),
  ('22222', 'PHY-101', '1', 'Fall',   2023),
  ('12121', 'FIN-201', '1', 'Fall',   2023),
  ('32343', 'HIS-351', '1', 'Fall',   2023),
  ('15151', 'MU-199',  '1', 'Spring', 2024),
  ('10101', 'CS-101',  '1', 'Fall',   2024),
  ('45565', 'CS-347',  '1', 'Spring', 2025),
  ('83821', 'CS-315',  '1', 'Spring', 2024)
ON CONFLICT DO NOTHING;

-- Students
INSERT INTO student (id, name, dept_name, tot_cred, address, mobile_no) VALUES
  ('00128', 'Zhang',     'Comp. Sci.', 102, '123 Main St, Springfield', '9876543210'),
  ('12345', 'Shankar',   'Comp. Sci.', 32,  '456 Oak Ave, Boston',      '9123456789'),
  ('19991', 'Brandt',    'History',    80,  '789 Elm Rd, Chicago',      '9988776655'),
  ('23121', 'Chavez',    'Finance',    110, '12 Wall St, New York',     '9112233445'),
  ('44553', 'Peltier',   'Physics',    56,  '33 Physics Ln, Denver',    '9001122334'),
  ('45678', 'Levy',      'Physics',    46,  '88 Quantum Blvd, Dallas',  '9334455667'),
  ('54321', 'Williams',  'Comp. Sci.', 54,  '55 Silicon Way, San Jose',  '9445566778'),
  ('55739', 'Sanchez',   'Music',      38,  '22 Melody Ct, Nashville',  '9556677889'),
  ('70557', 'Snow',      'Physics',    0,   '77 Glacier Path, Seattle', '9667788990'),
  ('76543', 'Brown',     'Comp. Sci.', 58,  '44 Circuit Rd, Austin',    '9778899001'),
  ('76653', 'Aoi',       'Elec. Eng.', 60,  '66 Voltage Dr, Portland',  '9889900112'),
  ('98765', 'Bouchard',  'Elec. Eng.', 98,  '99 Tech Park, San Francisco','9990011223'),
  ('98988', 'Tanaka',    'Biology',    120, '11 Lab Lane, Houston',     '9010203040')
ON CONFLICT DO NOTHING;

-- Takes (Enrollments)
INSERT INTO takes (id, course_id, sec_id, semester, year, grade) VALUES
  ('00128', 'CS-101',  '1', 'Fall',   2023, 'A'),
  ('00128', 'CS-347',  '1', 'Fall',   2023, 'A-'),
  ('12345', 'CS-101',  '1', 'Fall',   2023, 'C'),
  ('12345', 'CS-190',  '2', 'Spring', 2024, 'A'),
  ('12345', 'CS-315',  '1', 'Spring', 2024, 'A'),
  ('19991', 'HIS-351', '1', 'Fall',   2023, 'B'),
  ('23121', 'FIN-201', '1', 'Fall',   2023, 'C+'),
  ('44553', 'PHY-101', '1', 'Fall',   2023, 'B-'),
  ('45678', 'PHY-101', '1', 'Fall',   2023, 'A'),
  ('54321', 'CS-101',  '1', 'Fall',   2023, 'A-'),
  ('54321', 'CS-490',  '1', 'Spring', 2024, 'B+'),
  ('55739', 'MU-199',  '1', 'Spring', 2024, 'A'),
  ('76543', 'CS-101',  '1', 'Spring', 2024, 'B+'),
  ('76543', 'CS-319',  '1', 'Spring', 2024, NULL),
  ('76653', 'EE-181',  '1', 'Spring', 2024, 'B'),
  ('98765', 'CS-101',  '1', 'Fall',   2023, 'A'),
  ('98765', 'EE-181',  '1', 'Spring', 2024, 'A'),
  ('98988', 'BIO-101', '1', 'Fall',   2023, 'A'),
  ('98988', 'BIO-301', '1', 'Spring', 2024, 'A'),
  ('12345', 'CS-101',  '1', 'Fall',   2024, NULL),
  ('00128', 'CS-347',  '1', 'Spring', 2025, NULL)
ON CONFLICT DO NOTHING;

-- Advisors
INSERT INTO advisor (s_id, i_id) VALUES
  ('00128', '45565'),
  ('12345', '10101'),
  ('19991', '32343'),
  ('23121', '12121'),
  ('44553', '22222'),
  ('45678', '22222'),
  ('54321', '83821'),
  ('55739', '15151'),
  ('76543', '45565'),
  ('76653', '98345'),
  ('98765', '98345'),
  ('98988', '76766')
ON CONFLICT DO NOTHING;

-- Prerequisites
INSERT INTO prereq (course_id, prereq_id) VALUES
  ('CS-190',  'CS-101'),
  ('CS-315',  'CS-101'),
  ('CS-319',  'CS-101'),
  ('CS-347',  'CS-101'),
  ('CS-490',  'CS-347'),
  ('BIO-301', 'BIO-101'),
  ('EE-181',  'CS-101')
ON CONFLICT DO NOTHING;

-- Performance indexes for dashboard queries
CREATE INDEX IF NOT EXISTS idx_takes_student      ON takes(id);
CREATE INDEX IF NOT EXISTS idx_teaches_instructor  ON teaches(id);
CREATE INDEX IF NOT EXISTS idx_advisor_instructor  ON advisor(i_id);
CREATE INDEX IF NOT EXISTS idx_advisor_student     ON advisor(s_id);
CREATE INDEX IF NOT EXISTS idx_section_timeslot    ON section(time_slot_id);
CREATE INDEX IF NOT EXISTS idx_section_course      ON section(course_id);
CREATE INDEX IF NOT EXISTS idx_users_profile       ON users(role, profile_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role   ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_lookup ON role_permissions(role_id, resource);
CREATE INDEX IF NOT EXISTS idx_roles_name ON roles(name);

-- ============================================================
-- RBAC SEED DATA
-- ============================================================

-- Default system roles
INSERT INTO roles (name, description, is_system) VALUES
  ('admin',   'System administrator with full access to all modules', TRUE),
  ('faculty', 'Faculty member with teaching and grading access',       TRUE),
  ('student', 'Student with access to personal academic data',         TRUE)
ON CONFLICT (name) DO NOTHING;

-- Admin permissions: full CRUD on all resources
INSERT INTO role_permissions (role_id, resource, can_read, can_create, can_update, can_delete)
SELECT r.id, res.resource, TRUE, TRUE, TRUE, TRUE
FROM roles r, (VALUES
  ('dashboard'), ('classroom'), ('department'), ('course'), ('instructor'),
  ('student'), ('section'), ('teaches'), ('takes'), ('advisor'),
  ('timeslot'), ('prereq'), ('report'), ('users'), ('export'), ('roles')
) AS res(resource)
WHERE r.name = 'admin'
ON CONFLICT (role_id, resource) DO NOTHING;

-- Faculty permissions
INSERT INTO role_permissions (role_id, resource, can_read, can_create, can_update, can_delete)
SELECT r.id, res.resource, res.cr, res.cc, res.cu, res.cd
FROM roles r, (VALUES
  ('dashboard',  TRUE, FALSE, FALSE, FALSE),
  ('course',     TRUE, FALSE, FALSE, FALSE),
  ('section',    TRUE, TRUE,  TRUE,  TRUE),
  ('teaches',    TRUE, TRUE,  FALSE, TRUE),
  ('takes',      TRUE, TRUE,  TRUE,  TRUE),
  ('advisor',    TRUE, TRUE,  TRUE,  TRUE),
  ('student',    TRUE, FALSE, FALSE, FALSE),
  ('instructor', TRUE, FALSE, FALSE, FALSE),
  ('department', TRUE, FALSE, FALSE, FALSE),
  ('classroom',  TRUE, FALSE, FALSE, FALSE),
  ('timeslot',   TRUE, FALSE, FALSE, FALSE),
  ('prereq',     TRUE, FALSE, FALSE, FALSE),
  ('report',     TRUE, FALSE, FALSE, FALSE),
  ('export',     TRUE, FALSE, FALSE, FALSE)
) AS res(resource, cr, cc, cu, cd)
WHERE r.name = 'faculty'
ON CONFLICT (role_id, resource) DO NOTHING;

-- Student permissions: dashboard, export, course (read-only)
INSERT INTO role_permissions (role_id, resource, can_read, can_create, can_update, can_delete)
SELECT r.id, res.resource, res.cr, res.cc, res.cu, res.cd
FROM roles r, (VALUES
  ('dashboard', TRUE, FALSE, FALSE, FALSE),
  ('export',    TRUE, FALSE, FALSE, FALSE),
  ('course',    TRUE, FALSE, FALSE, FALSE)
) AS res(resource, cr, cc, cu, cd)
WHERE r.name = 'student'
ON CONFLICT (role_id, resource) DO NOTHING;

