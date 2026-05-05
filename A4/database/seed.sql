-- ═══════════════════════════════════════════════════════════════════════════════
-- Seed Data — Demo Users, Courses, Questions, and Exam
-- ═══════════════════════════════════════════════════════════════════════════════

-- Passwords: all are "password123" (plain-text for demo; bcrypt in production)
INSERT INTO users (full_name, email, password, role) VALUES
  ('System Admin',     'admin@university.edu',    'password123', 'ADMIN'),
  ('Dr. James Wilson', 'faculty1@university.edu', 'password123', 'FACULTY'),
  ('Prof. Sarah Lee',  'faculty2@university.edu', 'password123', 'FACULTY'),
  ('Alice Johnson',    'student1@university.edu', 'password123', 'STUDENT'),
  ('Bob Williams',     'student2@university.edu', 'password123', 'STUDENT'),
  ('Charlie Brown',    'student3@university.edu', 'password123', 'STUDENT');

-- Courses
INSERT INTO courses (course_code, course_name, instructor_id) VALUES
  ('CS201', 'Data Structures & Algorithms', 2),
  ('CS301', 'Database Management Systems',  2),
  ('MA101', 'Discrete Mathematics',         3);

-- Tags
INSERT INTO tags (name, tag_type) VALUES
  ('Computer Science', 'SUBJECT'),
  ('Mathematics',      'SUBJECT'),
  ('Sorting',          'TOPIC'),
  ('Trees',            'TOPIC'),
  ('SQL',              'TOPIC'),
  ('Graphs',           'TOPIC'),
  ('Easy',   'DIFFICULTY'),
  ('Medium', 'DIFFICULTY'),
  ('Hard',   'DIFFICULTY');

-- Questions (CS201 — Data Structures)
INSERT INTO questions (question_text, difficulty, subject, topic, course_id, created_by) VALUES
  ('What is the time complexity of binary search?',          'EASY',   'Computer Science', 'Searching', 1, 2),
  ('Which data structure uses LIFO?',                        'EASY',   'Computer Science', 'Stacks',    1, 2),
  ('What is the worst-case complexity of QuickSort?',        'MEDIUM', 'Computer Science', 'Sorting',   1, 2),
  ('In a max-heap, the root element is always:',             'EASY',   'Computer Science', 'Trees',     1, 2),
  ('Which traversal visits nodes level by level?',           'MEDIUM', 'Computer Science', 'Trees',     1, 2),
  ('What is the space complexity of merge sort?',            'MEDIUM', 'Computer Science', 'Sorting',   1, 2),
  ('Which data structure implements an adjacency list?',     'HARD',   'Computer Science', 'Graphs',    1, 3),
  ('What is the time complexity of DFS on an adjacency list?','HARD',  'Computer Science', 'Graphs',    1, 3);

-- Options for each question
-- Q1: Binary Search
INSERT INTO options (question_id, option_text, is_correct, option_order) VALUES
  (1, 'O(n)',       false, 1),
  (1, 'O(log n)',   true,  2),
  (1, 'O(n log n)', false, 3),
  (1, 'O(1)',       false, 4);

-- Q2: LIFO
INSERT INTO options (question_id, option_text, is_correct, option_order) VALUES
  (2, 'Queue',    false, 1),
  (2, 'Stack',    true,  2),
  (2, 'Array',    false, 3),
  (2, 'Heap',     false, 4);

-- Q3: QuickSort worst-case
INSERT INTO options (question_id, option_text, is_correct, option_order) VALUES
  (3, 'O(n log n)', false, 1),
  (3, 'O(n²)',      true,  2),
  (3, 'O(n)',       false, 3),
  (3, 'O(log n)',   false, 4);

-- Q4: Max-heap root
INSERT INTO options (question_id, option_text, is_correct, option_order) VALUES
  (4, 'The smallest element',  false, 1),
  (4, 'The largest element',   true,  2),
  (4, 'The median element',    false, 3),
  (4, 'A random element',      false, 4);

-- Q5: Level-order traversal
INSERT INTO options (question_id, option_text, is_correct, option_order) VALUES
  (5, 'Inorder',    false, 1),
  (5, 'Preorder',   false, 2),
  (5, 'Postorder',  false, 3),
  (5, 'BFS',        true,  4);

-- Q6: Merge sort space
INSERT INTO options (question_id, option_text, is_correct, option_order) VALUES
  (6, 'O(1)',     false, 1),
  (6, 'O(n)',     true,  2),
  (6, 'O(log n)', false, 3),
  (6, 'O(n²)',    false, 4);

-- Q7: Adjacency list
INSERT INTO options (question_id, option_text, is_correct, option_order) VALUES
  (7, 'Array of linked lists', true,  1),
  (7, 'Binary tree',           false, 2),
  (7, 'Stack',                 false, 3),
  (7, 'Queue',                 false, 4);

-- Q8: DFS complexity
INSERT INTO options (question_id, option_text, is_correct, option_order) VALUES
  (8, 'O(V + E)',   true,  1),
  (8, 'O(V²)',      false, 2),
  (8, 'O(E²)',      false, 3),
  (8, 'O(V * E)',   false, 4);

-- Demo exam
INSERT INTO exams (title, description, course_name, duration_minutes, total_marks, passing_marks, exam_type, is_published, show_results, created_by) VALUES
  ('CS201 Midterm — Data Structures', 'Covers Sorting, Trees, and Graph fundamentals', 'Data Structures & Algorithms', 60, 8, 4, 'FLEXIBLE', true, true, 2);

INSERT INTO exam_questions (exam_id, question_id, marks, question_order) VALUES
  (1, 1, 1, 1), (1, 2, 1, 2), (1, 3, 1, 3), (1, 4, 1, 4),
  (1, 5, 1, 5), (1, 6, 1, 6), (1, 7, 1, 7), (1, 8, 1, 8);
