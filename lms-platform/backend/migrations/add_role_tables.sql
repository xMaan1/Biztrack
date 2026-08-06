-- =====================================================
-- MIGRATION: Add Role-Specific Tables
-- Students, Teachers, Admins
-- =====================================================

USE lms_db;

-- =====================================================
-- 1. STUDENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS students (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT UNIQUE NOT NULL,
    student_number VARCHAR(50) NULL COMMENT 'Official student ID number',
    enrollment_year YEAR NULL COMMENT 'Year of enrollment',
    gpa DECIMAL(3,2) NULL COMMENT 'Current GPA (0.00-4.00)',
    academic_status ENUM('active', 'probation', 'suspended', 'graduated', 'withdrawn') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_students_user (user_id),
    INDEX idx_students_number (student_number),
    INDEX idx_students_status (academic_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 2. TEACHERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS teachers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT UNIQUE NOT NULL,
    employee_number VARCHAR(50) NULL COMMENT 'Official employee ID number',
    hire_date DATE NULL COMMENT 'Date of hire',
    specialization VARCHAR(255) NULL COMMENT 'Area of specialization',
    employment_type ENUM('full_time', 'part_time', 'contract', 'visiting') DEFAULT 'full_time',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_teachers_user (user_id),
    INDEX idx_teachers_number (employee_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 3. ADMINS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS admins (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT UNIQUE NOT NULL,
    employee_number VARCHAR(50) NULL COMMENT 'Official employee ID number',
    admin_level ENUM('super', 'regular') DEFAULT 'regular' COMMENT 'Admin privilege level',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_admins_user (user_id),
    INDEX idx_admins_number (employee_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 4. TRIGGERS — Auto-insert into role table on user creation
-- =====================================================

DELIMITER $$

-- Trigger: After a user is inserted, create role-specific row
CREATE TRIGGER after_user_insert_role
AFTER INSERT ON users
FOR EACH ROW
BEGIN
    IF NEW.role = 'student' THEN
        INSERT INTO students (user_id) VALUES (NEW.id);
    ELSEIF NEW.role = 'teacher' THEN
        INSERT INTO teachers (user_id) VALUES (NEW.id);
    ELSEIF NEW.role = 'admin' THEN
        INSERT INTO admins (user_id) VALUES (NEW.id);
    END IF;
END$$

-- Trigger: After a user's role is updated, sync role tables
CREATE TRIGGER after_user_update_role
AFTER UPDATE ON users
FOR EACH ROW
BEGIN
    IF OLD.role != NEW.role THEN
        IF OLD.role = 'student' THEN
            DELETE FROM students WHERE user_id = NEW.id;
        ELSEIF OLD.role = 'teacher' THEN
            DELETE FROM teachers WHERE user_id = NEW.id;
        ELSEIF OLD.role = 'admin' THEN
            DELETE FROM admins WHERE user_id = NEW.id;
        END IF;

        IF NEW.role = 'student' THEN
            INSERT INTO students (user_id) VALUES (NEW.id);
        ELSEIF NEW.role = 'teacher' THEN
            INSERT INTO teachers (user_id) VALUES (NEW.id);
        ELSEIF NEW.role = 'admin' THEN
            INSERT INTO admins (user_id) VALUES (NEW.id);
        END IF;
    END IF;
END$$

DELIMITER ;

-- =====================================================
-- 5. BACKFILL — Populate role tables from existing users
-- =====================================================

INSERT INTO students (user_id, academic_status)
SELECT id, 'active' FROM users
WHERE role = 'student'
AND id NOT IN (SELECT user_id FROM students);

INSERT INTO teachers (user_id, employment_type)
SELECT id, 'full_time' FROM users
WHERE role = 'teacher'
AND id NOT IN (SELECT user_id FROM teachers);

INSERT INTO admins (user_id, admin_level)
SELECT id, 'super' FROM users
WHERE role = 'admin'
AND id NOT IN (SELECT user_id FROM admins);

-- =====================================================
-- Migration Complete
-- =====================================================
SELECT 'Role tables created and backfilled successfully!' AS status;
