-- ============================================================
-- MIGRATION: Role-Based Access Control (RBAC)
-- Adds roles table and role_permissions table for dynamic
-- permission management by admin.
-- ============================================================

-- Step 1: Create roles table
CREATE TABLE IF NOT EXISTS roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  description VARCHAR(255),
  is_system BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Step 2: Create role_permissions table
CREATE TABLE IF NOT EXISTS role_permissions (
  id SERIAL PRIMARY KEY,
  role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
  resource VARCHAR(50) NOT NULL,
  can_read BOOLEAN DEFAULT FALSE,
  can_create BOOLEAN DEFAULT FALSE,
  can_update BOOLEAN DEFAULT FALSE,
  can_delete BOOLEAN DEFAULT FALSE,
  UNIQUE(role_id, resource)
);

-- Step 3: Insert default system roles
INSERT INTO roles (name, description, is_system) VALUES
  ('admin', 'System administrator with full access to all modules', TRUE),
  ('faculty', 'Faculty member with teaching and grading access', TRUE),
  ('student', 'Student with access to personal academic data', TRUE)
ON CONFLICT (name) DO NOTHING;

-- Step 4: Default admin permissions — full CRUD on all resources
INSERT INTO role_permissions (role_id, resource, can_read, can_create, can_update, can_delete)
SELECT r.id, res.resource, TRUE, TRUE, TRUE, TRUE
FROM roles r, (VALUES
  ('dashboard'), ('classroom'), ('department'), ('course'), ('instructor'),
  ('student'), ('section'), ('teaches'), ('takes'), ('advisor'),
  ('timeslot'), ('prereq'), ('report'), ('users'), ('export'), ('roles')
) AS res(resource)
WHERE r.name = 'admin'
ON CONFLICT (role_id, resource) DO NOTHING;

-- Step 5: Default faculty permissions
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

-- Step 6: Default student permissions — only dashboard, export, course (read-only)
INSERT INTO role_permissions (role_id, resource, can_read, can_create, can_update, can_delete)
SELECT r.id, res.resource, res.cr, res.cc, res.cu, res.cd
FROM roles r, (VALUES
  ('dashboard', TRUE, FALSE, FALSE, FALSE),
  ('export',    TRUE, FALSE, FALSE, FALSE),
  ('course',    TRUE, FALSE, FALSE, FALSE)
) AS res(resource, cr, cc, cu, cd)
WHERE r.name = 'student'
ON CONFLICT (role_id, resource) DO NOTHING;

-- Step 7: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_role_permissions_role  ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_lookup ON role_permissions(role_id, resource);
CREATE INDEX IF NOT EXISTS idx_roles_name ON roles(name);
