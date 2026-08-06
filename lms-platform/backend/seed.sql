-- =====================================================
-- LMS PLATFORM - SEED DATA
-- For Development and Testing
-- =====================================================
-- NOTE: bcrypt hashes contain '$' which the MySQL CLI
-- strips on Windows. Use seed.py instead:
--   cd backend && python seed.py
-- =====================================================

USE lms_db;

-- =====================================================
-- 0. Reset Users Table
-- =====================================================
SET FOREIGN_KEY_CHECKS=0;
TRUNCATE TABLE users;
TRUNCATE TABLE students;
TRUNCATE TABLE teachers;
TRUNCATE TABLE admins;
TRUNCATE TABLE user_profiles;
SET FOREIGN_KEY_CHECKS=1;

-- =====================================================
-- 1. Insert Users (one per role)
--    Passwords: Admin@1234 / Teacher@1234 / Student@1234
--    ⚠ Run via `python seed.py` to avoid $-escaping issues
-- =====================================================
-- See seed.py for the INSERT statements with proper hashing

-- =====================================================
-- Seed Data Complete
-- =====================================================
SELECT 'Run "python seed.py" to insert seed data!' AS status;
