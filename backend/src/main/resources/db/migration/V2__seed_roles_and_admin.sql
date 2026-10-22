-- V2__seed_roles_and_admin.sql
-- Seed the roles table and create the default admin user.
-- Password: Admin@123 (BCrypt hash - change in production!)

INSERT INTO roles (name, description) VALUES
    ('ADMIN',    'Full system access including user management and configuration'),
    ('MANAGER',  'Manage products, suppliers, stock movements, and operational reports'),
    ('STAFF',    'View inventory and perform permitted stock movements'),
    ('ANALYST',  'Read inventory and analytics but cannot change operational data')
ON CONFLICT (name) DO NOTHING;

-- Default admin user (demo only - never ship this in production)
-- Password: Admin@123
INSERT INTO users (username, email, password_hash, full_name, role_id, is_active)
SELECT
    'admin',
    'admin@stockflow.local',
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeAYGnHTTgSqEMBKe',
    'System Administrator',
    r.id,
    TRUE
FROM roles r WHERE r.name = 'ADMIN'
ON CONFLICT (username) DO NOTHING;

-- Demo users for each role (demo only)
-- Password for all: Demo@123
INSERT INTO users (username, email, password_hash, full_name, role_id, is_active)
SELECT
    'manager',
    'manager@stockflow.local',
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeAYGnHTTgSqEMBKe',
    'Operations Manager',
    r.id,
    TRUE
FROM roles r WHERE r.name = 'MANAGER'
ON CONFLICT (username) DO NOTHING;

INSERT INTO users (username, email, password_hash, full_name, role_id, is_active)
SELECT
    'staff',
    'staff@stockflow.local',
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeAYGnHTTgSqEMBKe',
    'Warehouse Staff',
    r.id,
    TRUE
FROM roles r WHERE r.name = 'STAFF'
ON CONFLICT (username) DO NOTHING;

INSERT INTO users (username, email, password_hash, full_name, role_id, is_active)
SELECT
    'analyst',
    'analyst@stockflow.local',
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeAYGnHTTgSqEMBKe',
    'Data Analyst',
    r.id,
    TRUE
FROM roles r WHERE r.name = 'ANALYST'
ON CONFLICT (username) DO NOTHING;
