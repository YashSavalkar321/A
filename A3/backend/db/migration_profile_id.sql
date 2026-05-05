-- ============================================================
-- MIGRATION: Add profile_id to users table
-- Links users to student.id or instructor.id based on role
-- ============================================================

-- Step 1: Add profile_id column
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_id VARCHAR(5);

-- Step 2: Link existing dummy users to profile records
-- faculty1 → instructor 10101 (Srinivasan), faculty2 → instructor 45565 (Katz)
-- student1 → student 00128 (Zhang),        student2 → student 12345 (Shankar)
UPDATE users SET profile_id = '10101' WHERE username = 'faculty1';
UPDATE users SET profile_id = '45565' WHERE username = 'faculty2';
UPDATE users SET profile_id = '00128' WHERE username = 'student1';
UPDATE users SET profile_id = '12345' WHERE username = 'student2';

-- Step 3: Create indexes for dashboard query performance
CREATE INDEX IF NOT EXISTS idx_takes_student      ON takes(id);
CREATE INDEX IF NOT EXISTS idx_teaches_instructor  ON teaches(id);
CREATE INDEX IF NOT EXISTS idx_advisor_instructor  ON advisor(i_id);
CREATE INDEX IF NOT EXISTS idx_advisor_student     ON advisor(s_id);
CREATE INDEX IF NOT EXISTS idx_section_timeslot    ON section(time_slot_id);
CREATE INDEX IF NOT EXISTS idx_section_course      ON section(course_id);
CREATE INDEX IF NOT EXISTS idx_users_profile       ON users(role, profile_id);
