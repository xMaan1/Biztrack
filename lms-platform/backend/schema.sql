-- =====================================================
-- LMS PLATFORM - COMPLETE DATABASE SCHEMA
-- MySQL / XAMPP Compatible
-- Version: 1.0.0
-- =====================================================

-- Drop database if exists (for fresh installation)
DROP DATABASE IF EXISTS lms_db;

-- Create database with proper character set
CREATE DATABASE lms_db 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

-- Use the database
USE lms_db;

-- =====================================================
-- 1. ROLES TABLE
-- =====================================================
CREATE TABLE roles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) UNIQUE NOT NULL COMMENT 'admin, teacher, student',
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 2. DEPARTMENTS TABLE
-- =====================================================
CREATE TABLE departments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) UNIQUE NOT NULL,
    code VARCHAR(20) UNIQUE NOT NULL,
    description TEXT,
    head_teacher_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 3. USERS TABLE (Core Authentication)
-- =====================================================
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'teacher', 'student', 'public_user') NOT NULL DEFAULT 'public_user' COMMENT 'Select role: admin, teacher, student, or public_user',
    role_id INT NULL COMMENT 'FK to roles table',
    department_id INT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    last_login_at TIMESTAMP NULL,
    login_attempts INT DEFAULT 0,
    locked_until TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE SET NULL,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
    
    INDEX idx_users_email (email),
    INDEX idx_users_role (role),
    INDEX idx_users_active (is_active),
    INDEX idx_users_deleted (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 4. USER PROFILES TABLE
-- =====================================================
CREATE TABLE user_profiles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100) NULL,
    date_of_birth DATE NULL,
    gender ENUM('male', 'female', 'other') NULL,
    phone VARCHAR(20) NULL,
    address TEXT NULL,
    city VARCHAR(100) NULL,
    state VARCHAR(100) NULL,
    postal_code VARCHAR(20) NULL,
    country VARCHAR(100) DEFAULT 'Pakistan',
    profile_picture_url VARCHAR(500) NULL,
    bio TEXT NULL,
    employee_id VARCHAR(50) NULL COMMENT 'For teachers/admin',
    student_id VARCHAR(50) NULL COMMENT 'For students',
    emergency_contact_name VARCHAR(200) NULL,
    emergency_contact_phone VARCHAR(20) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    INDEX idx_profile_user (user_id),
    INDEX idx_profile_name (first_name, last_name),
    INDEX idx_profile_student_id (student_id),
    INDEX idx_profile_employee_id (employee_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 5. COURSES TABLE
-- =====================================================
CREATE TABLE courses (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    credits INT DEFAULT 3,
    department_id INT NOT NULL,
    teacher_id INT NOT NULL,
    semester VARCHAR(20) NOT NULL COMMENT 'Fall 2024, Spring 2024, etc.',
    academic_year VARCHAR(20) NOT NULL COMMENT '2024-2025',
    max_students INT DEFAULT 30,
    current_enrollment INT DEFAULT 0,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_published BOOLEAN DEFAULT FALSE,
    thumbnail_url VARCHAR(500) NULL,
    syllabus_url VARCHAR(500) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE RESTRICT,
    FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE RESTRICT,
    
    INDEX idx_courses_teacher (teacher_id),
    INDEX idx_courses_department (department_id),
    INDEX idx_courses_code (code),
    INDEX idx_courses_semester (semester),
    INDEX idx_courses_published (is_published),
    INDEX idx_courses_dates (start_date, end_date),
    INDEX idx_courses_deleted (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 6. COURSE ENROLLMENTS TABLE
-- =====================================================
CREATE TABLE course_enrollments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    course_id INT NOT NULL,
    student_id INT NOT NULL,
    enrollment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('active', 'dropped', 'completed', 'pending') DEFAULT 'pending',
    grade VARCHAR(5) NULL COMMENT 'A, B, C, D, F, INC, W',
    grade_points DECIMAL(3,2) NULL,
    completion_percentage DECIMAL(5,2) DEFAULT 0.00,
    dropped_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    
    UNIQUE KEY unique_enrollment (course_id, student_id),
    INDEX idx_enrollment_course (course_id),
    INDEX idx_enrollment_student (student_id),
    INDEX idx_enrollment_status (status),
    INDEX idx_enrollment_grade (grade)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 7. LECTURES TABLE
-- =====================================================
CREATE TABLE lectures (
    id INT PRIMARY KEY AUTO_INCREMENT,
    course_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    lecture_number INT NOT NULL,
    video_url VARCHAR(500) NULL,
    video_duration INT NULL COMMENT 'Duration in seconds',
    thumbnail_url VARCHAR(500) NULL,
    is_published BOOLEAN DEFAULT FALSE,
    is_free_preview BOOLEAN DEFAULT FALSE,
    order_index INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    
    INDEX idx_lectures_course (course_id),
    INDEX idx_lectures_order (course_id, order_index),
    INDEX idx_lectures_published (is_published),
    INDEX idx_lectures_deleted (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 8. LECTURE MATERIALS TABLE (PDFs, Documents)
-- =====================================================
CREATE TABLE lecture_materials (
    id INT PRIMARY KEY AUTO_INCREMENT,
    lecture_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT NOT NULL COMMENT 'Size in bytes',
    mime_type VARCHAR(100) NOT NULL,
    is_downloadable BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    
    FOREIGN KEY (lecture_id) REFERENCES lectures(id) ON DELETE CASCADE,
    
    INDEX idx_materials_lecture (lecture_id),
    INDEX idx_materials_deleted (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 9. STUDENT LECTURE PROGRESS TABLE
-- =====================================================
CREATE TABLE lecture_progress (
    id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NOT NULL,
    lecture_id INT NOT NULL,
    progress_percentage DECIMAL(5,2) DEFAULT 0.00 COMMENT '0-100',
    is_completed BOOLEAN DEFAULT FALSE,
    last_watched_at TIMESTAMP NULL,
    watch_time_seconds INT DEFAULT 0 COMMENT 'Total watch time',
    completed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (lecture_id) REFERENCES lectures(id) ON DELETE CASCADE,
    
    UNIQUE KEY unique_progress (student_id, lecture_id),
    INDEX idx_progress_student (student_id),
    INDEX idx_progress_lecture (lecture_id),
    INDEX idx_progress_completed (is_completed)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 10. ATTENDANCE SESSIONS TABLE
-- =====================================================
CREATE TABLE attendance_sessions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    course_id INT NOT NULL,
    teacher_id INT NOT NULL,
    session_title VARCHAR(255) NOT NULL,
    session_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    session_type ENUM('lecture', 'lab', 'tutorial', 'exam') DEFAULT 'lecture',
    qr_code VARCHAR(255) UNIQUE NULL COMMENT 'Unique QR code token',
    qr_expires_at TIMESTAMP NULL,
    manual_attendance_allowed BOOLEAN DEFAULT TRUE,
    face_recognition_enabled BOOLEAN DEFAULT FALSE,
    location VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE RESTRICT,
    
    INDEX idx_attendance_course (course_id),
    INDEX idx_attendance_teacher (teacher_id),
    INDEX idx_attendance_date (session_date),
    INDEX idx_attendance_qr (qr_code),
    INDEX idx_attendance_deleted (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 11. ATTENDANCE RECORDS TABLE
-- =====================================================
CREATE TABLE attendance_records (
    id INT PRIMARY KEY AUTO_INCREMENT,
    session_id INT NOT NULL,
    student_id INT NOT NULL,
    status ENUM('present', 'absent', 'late', 'excused') DEFAULT 'absent',
    check_in_time TIMESTAMP NULL,
    check_out_time TIMESTAMP NULL,
    verification_method ENUM('manual', 'qr_scan', 'face_recognition', 'auto') DEFAULT 'manual',
    face_match_confidence DECIMAL(5,2) NULL COMMENT 'Face recognition confidence %',
    location_lat DECIMAL(10,8) NULL COMMENT 'GPS latitude',
    location_lng DECIMAL(11,8) NULL COMMENT 'GPS longitude',
    remarks TEXT NULL,
    marked_by INT NULL COMMENT 'User ID who marked attendance',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (session_id) REFERENCES attendance_sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (marked_by) REFERENCES users(id) ON DELETE SET NULL,
    
    UNIQUE KEY unique_attendance (session_id, student_id),
    INDEX idx_attendance_session (session_id),
    INDEX idx_attendance_student (student_id),
    INDEX idx_attendance_status (status),
    INDEX idx_attendance_verification (verification_method),
    INDEX idx_attendance_checkin (check_in_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 12. FACE ENCODINGS TABLE (For AI Recognition)
-- =====================================================
CREATE TABLE face_encodings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    encoding_data JSON NOT NULL COMMENT 'Face encoding vector as JSON array',
    image_path VARCHAR(500) NOT NULL COMMENT 'Path to reference image',
    confidence_threshold DECIMAL(5,2) DEFAULT 0.60 COMMENT 'Minimum confidence for match',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    UNIQUE KEY unique_face_user (user_id),
    INDEX idx_face_user (user_id),
    INDEX idx_face_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 13. ASSIGNMENTS TABLE
-- =====================================================
CREATE TABLE assignments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    course_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    instructions TEXT,
    max_score DECIMAL(5,2) NOT NULL DEFAULT 100.00,
    deadline DATETIME NOT NULL,
    is_published BOOLEAN DEFAULT FALSE,
    allow_late_submission BOOLEAN DEFAULT FALSE,
    late_submission_penalty DECIMAL(5,2) DEFAULT 0.00 COMMENT 'Penalty percentage per day',
    max_file_size INT DEFAULT 10485760 COMMENT 'Max file size in bytes (10MB default)',
    allowed_file_types VARCHAR(255) DEFAULT '.pdf,.doc,.docx,.zip' COMMENT 'Comma separated extensions',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    
    INDEX idx_assignments_course (course_id),
    INDEX idx_assignments_deadline (deadline),
    INDEX idx_assignments_published (is_published),
    INDEX idx_assignments_deleted (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 14. ASSIGNMENT SUBMISSIONS TABLE
-- =====================================================
CREATE TABLE assignment_submissions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    assignment_id INT NOT NULL,
    student_id INT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT NOT NULL COMMENT 'Size in bytes',
    mime_type VARCHAR(100) NOT NULL,
    submission_text TEXT NULL,
    is_late BOOLEAN DEFAULT FALSE,
    plagiarism_score DECIMAL(5,2) NULL COMMENT 'Plagiarism percentage',
    status ENUM('submitted', 'graded', 'returned', 'pending_review') DEFAULT 'submitted',
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    graded_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    
    FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    
    UNIQUE KEY unique_submission (assignment_id, student_id),
    INDEX idx_submission_assignment (assignment_id),
    INDEX idx_submission_student (student_id),
    INDEX idx_submission_status (status),
    INDEX idx_submission_deleted (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 15. GRADES TABLE
-- =====================================================
CREATE TABLE grades (
    id INT PRIMARY KEY AUTO_INCREMENT,
    enrollment_id INT NOT NULL,
    assignment_id INT NULL,
    score DECIMAL(5,2) NULL,
    letter_grade VARCHAR(5) NULL,
    percentage DECIMAL(5,2) NULL,
    feedback TEXT NULL,
    graded_by INT NULL,
    graded_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (enrollment_id) REFERENCES course_enrollments(id) ON DELETE CASCADE,
    FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE SET NULL,
    FOREIGN KEY (graded_by) REFERENCES users(id) ON DELETE SET NULL,
    
    INDEX idx_grade_enrollment (enrollment_id),
    INDEX idx_grade_assignment (assignment_id),
    INDEX idx_grade_letter (letter_grade),
    INDEX idx_grade_graded_by (graded_by),
    
    -- Ensure only one grade per assignment per enrollment
    UNIQUE KEY unique_grade_assignment (enrollment_id, assignment_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 16. AUDIT LOGS TABLE
-- =====================================================
CREATE TABLE audit_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NULL,
    action VARCHAR(100) NOT NULL COMMENT 'CREATE, UPDATE, DELETE, LOGIN, LOGOUT, VIEW',
    resource_type VARCHAR(50) NOT NULL COMMENT 'user, course, lecture, assignment, etc.',
    resource_id INT NULL,
    old_values JSON NULL,
    new_values JSON NULL,
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    
    INDEX idx_audit_user (user_id),
    INDEX idx_audit_resource (resource_type, resource_id),
    INDEX idx_audit_action (action),
    INDEX idx_audit_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 17. NOTIFICATIONS TABLE
-- =====================================================
CREATE TABLE notifications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL COMMENT 'info, success, warning, error',
    is_read BOOLEAN DEFAULT FALSE,
    link VARCHAR(500) NULL,
    read_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    INDEX idx_notifications_user (user_id),
    INDEX idx_notifications_read (is_read),
    INDEX idx_notifications_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 18. SYSTEM SETTINGS TABLE
-- =====================================================
CREATE TABLE system_settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT NOT NULL,
    setting_group VARCHAR(50) NOT NULL DEFAULT 'general',
    description TEXT NULL,
    is_editable BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_settings_key (setting_key),
    INDEX idx_settings_group (setting_group)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 19. SESSION TOKENS TABLE (For JWT Blacklist/Refresh)
-- =====================================================
CREATE TABLE session_tokens (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    token_jti VARCHAR(255) UNIQUE NOT NULL COMMENT 'JWT ID',
    token_type ENUM('access', 'refresh') NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    is_revoked BOOLEAN DEFAULT FALSE,
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    INDEX idx_token_user (user_id),
    INDEX idx_token_jti (token_jti),
    INDEX idx_token_expires (expires_at),
    INDEX idx_token_revoked (is_revoked)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 20. COURSE REVIEWS TABLE
-- =====================================================
CREATE TABLE course_reviews (
    id INT PRIMARY KEY AUTO_INCREMENT,
    course_id INT NOT NULL,
    student_id INT NOT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review TEXT NULL,
    is_approved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    
    UNIQUE KEY unique_review (course_id, student_id),
    INDEX idx_review_course (course_id),
    INDEX idx_review_rating (rating),
    INDEX idx_review_approved (is_approved)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 21. QUIZ/EXAM TABLE (For future expansion)
-- =====================================================
CREATE TABLE quizzes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    course_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    duration_minutes INT NOT NULL,
    passing_score DECIMAL(5,2) DEFAULT 60.00,
    is_published BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    
    INDEX idx_quiz_course (course_id),
    INDEX idx_quiz_published (is_published)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 22. STUDENTS TABLE (Role-specific)
-- =====================================================
CREATE TABLE students (
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
-- 23. TEACHERS TABLE (Role-specific)
-- =====================================================
CREATE TABLE teachers (
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
-- 24. ADMINS TABLE (Role-specific)
-- =====================================================
CREATE TABLE admins (
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
-- Insert Default Roles
-- =====================================================
INSERT INTO roles (name, description) VALUES
('admin', 'System Administrator with full access'),
('teacher', 'Instructor with course management capabilities'),
('student', 'Student with course enrollment and learning access');

-- =====================================================
-- Insert Default System Settings
-- =====================================================
INSERT INTO system_settings (setting_key, setting_value, setting_group, description) VALUES
('site_name', 'LMS Platform', 'general', 'Name of the LMS system'),
('site_logo', '/images/logo.png', 'general', 'Path to site logo'),
('default_language', 'en', 'general', 'Default language for the system'),
('timezone', 'Asia/Karachi', 'general', 'System timezone'),
('max_upload_size', '104857600', 'file_upload', 'Maximum file upload size in bytes (100MB)'),
('allowed_video_types', '.mp4,.avi,.mov,.mkv', 'file_upload', 'Allowed video file extensions'),
('allowed_document_types', '.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx', 'file_upload', 'Allowed document file extensions'),
('email_verification_required', 'true', 'auth', 'Require email verification for new users'),
('default_user_role', 'student', 'auth', 'Default role for new user registrations'),
('session_timeout_minutes', '60', 'security', 'Session timeout in minutes'),
('max_login_attempts', '5', 'security', 'Maximum login attempts before lockout'),
('lockout_duration_minutes', '30', 'security', 'Lockout duration in minutes after failed attempts'),
('jwt_expiry_minutes', '60', 'security', 'JWT token expiry time in minutes'),
('jwt_refresh_expiry_days', '7', 'security', 'JWT refresh token expiry in days'),
('face_recognition_enabled', 'true', 'attendance', 'Enable face recognition for attendance'),
('qr_code_expiry_minutes', '5', 'attendance', 'QR code expiry time in minutes'),
('attendance_auto_mark_after_minutes', '15', 'attendance', 'Auto mark absent after minutes');

-- =====================================================
-- Create Triggers for Automatic Updates
-- =====================================================

-- Trigger to update course current_enrollment on enrollment
DELIMITER $$
CREATE TRIGGER update_course_enrollment_after_insert
AFTER INSERT ON course_enrollments
FOR EACH ROW
BEGIN
    UPDATE courses 
    SET current_enrollment = (
        SELECT COUNT(*) 
        FROM course_enrollments 
        WHERE course_id = NEW.course_id 
        AND status = 'active'
    )
    WHERE id = NEW.course_id;
END$$

CREATE TRIGGER update_course_enrollment_after_update
AFTER UPDATE ON course_enrollments
FOR EACH ROW
BEGIN
    IF OLD.status != NEW.status THEN
        UPDATE courses 
        SET current_enrollment = (
            SELECT COUNT(*) 
            FROM course_enrollments 
            WHERE course_id = NEW.course_id 
            AND status = 'active'
        )
        WHERE id = NEW.course_id;
    END IF;
END$$

CREATE TRIGGER update_course_enrollment_after_delete
AFTER DELETE ON course_enrollments
FOR EACH ROW
BEGIN
    UPDATE courses 
    SET current_enrollment = (
        SELECT COUNT(*) 
        FROM course_enrollments 
        WHERE course_id = OLD.course_id 
        AND status = 'active'
    )
    WHERE id = OLD.course_id;
END$$

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
-- Create Views for Common Queries
-- =====================================================

-- View: Student Enrollment Summary
CREATE OR REPLACE VIEW v_student_enrollments AS
SELECT 
    u.id AS student_id,
    u.email,
    up.first_name,
    up.last_name,
    up.student_id,
    c.id AS course_id,
    c.title AS course_title,
    c.code AS course_code,
    ce.status AS enrollment_status,
    ce.grade,
    ce.completion_percentage,
    ce.enrollment_date
FROM users u
JOIN user_profiles up ON u.id = up.user_id
JOIN course_enrollments ce ON u.id = ce.student_id
JOIN courses c ON ce.course_id = c.id
WHERE u.role = 'student'
AND u.deleted_at IS NULL;

-- View: Course Progress Summary
CREATE OR REPLACE VIEW v_course_progress AS
SELECT 
    ce.student_id,
    ce.course_id,
    c.title AS course_title,
    COUNT(DISTINCT l.id) AS total_lectures,
    COUNT(DISTINCT lp.lecture_id) AS completed_lectures,
    ROUND(COUNT(DISTINCT lp.lecture_id) / COUNT(DISTINCT l.id) * 100, 2) AS progress_percentage,
    AVG(lp.progress_percentage) AS avg_watch_progress,
    ce.completion_percentage AS overall_completion
FROM course_enrollments ce
JOIN courses c ON ce.course_id = c.id
JOIN lectures l ON c.id = l.course_id AND l.is_published = TRUE
LEFT JOIN lecture_progress lp ON l.id = lp.lecture_id AND lp.student_id = ce.student_id
WHERE ce.status = 'active'
GROUP BY ce.student_id, ce.course_id;

-- View: Attendance Summary
CREATE OR REPLACE VIEW v_attendance_summary AS
SELECT 
    s.course_id,
    s.student_id,
    u.email,
    up.first_name,
    up.last_name,
    COUNT(DISTINCT a.session_id) AS total_sessions,
    SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) AS present_count,
    SUM(CASE WHEN a.status = 'absent' THEN 1 ELSE 0 END) AS absent_count,
    SUM(CASE WHEN a.status = 'late' THEN 1 ELSE 0 END) AS late_count,
    SUM(CASE WHEN a.status = 'excused' THEN 1 ELSE 0 END) AS excused_count,
    ROUND(SUM(CASE WHEN a.status IN ('present', 'late') THEN 1 ELSE 0 END) / COUNT(DISTINCT a.session_id) * 100, 2) AS attendance_percentage
FROM attendance_sessions s
JOIN attendance_records a ON s.id = a.session_id
JOIN users u ON a.student_id = u.id
JOIN user_profiles up ON u.id = up.user_id
GROUP BY s.course_id, a.student_id;

-- =====================================================
-- Indexes for Performance Optimization
-- =====================================================

-- Additional indexes for common queries
CREATE INDEX idx_course_enrollments_composite ON course_enrollments(course_id, student_id, status);
CREATE INDEX idx_attendance_composite ON attendance_records(session_id, student_id, status);
CREATE INDEX idx_grades_composite ON grades(enrollment_id, assignment_id);
CREATE INDEX idx_notifications_composite ON notifications(user_id, is_read, created_at DESC);
CREATE INDEX idx_lecture_progress_composite ON lecture_progress(student_id, lecture_id, is_completed);

-- Full-text search indexes
ALTER TABLE courses ADD FULLTEXT INDEX ft_courses_search (title, description, code);
ALTER TABLE user_profiles ADD FULLTEXT INDEX ft_profile_search (first_name, last_name, bio);
ALTER TABLE assignments ADD FULLTEXT INDEX ft_assignments_search (title, description);

-- =====================================================
-- APPLICATION SYSTEM TABLES
-- =====================================================

-- Teacher Applications
CREATE TABLE IF NOT EXISTS teacher_applications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    status ENUM('submitted','reviewed','selected','rejected') NOT NULL DEFAULT 'submitted',
    -- Personal Information
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    cnic VARCHAR(50),
    date_of_birth DATE,
    gender ENUM('male','female','other'),
    address TEXT,
    city VARCHAR(100),
    country VARCHAR(100) DEFAULT 'Pakistan',
    -- Professional Information
    highest_qualification VARCHAR(255),
    university VARCHAR(255),
    degree VARCHAR(255),
    specialization VARCHAR(255),
    teaching_experience VARCHAR(100),
    current_job VARCHAR(255),
    skills JSON,
    languages JSON,
    linkedin VARCHAR(500),
    portfolio_website VARCHAR(500),
    -- Teaching Information
    subjects JSON,
    categories JSON,
    online_teaching_experience VARCHAR(100),
    offline_teaching_experience VARCHAR(100),
    expected_salary DECIMAL(10,2),
    available_days VARCHAR(255),
    available_time VARCHAR(255),
    teaching_statement TEXT,
    -- Admin fields
    reviewed_by INT NULL,
    reviewed_at TIMESTAMP NULL,
    admin_remarks TEXT NULL,
    rejection_reason TEXT NULL,
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_teacher_app_status (status),
    INDEX idx_teacher_app_user (user_id)
) ENGINE=InnoDB;

-- Student Applications
CREATE TABLE IF NOT EXISTS student_applications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    status ENUM('submitted','reviewed','selected','rejected') NOT NULL DEFAULT 'submitted',
    -- Personal Information
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    cnic_passport VARCHAR(100),
    date_of_birth DATE,
    gender ENUM('male','female','other'),
    address TEXT,
    city VARCHAR(100),
    country VARCHAR(100) DEFAULT 'Pakistan',
    -- Academic Information
    current_qualification VARCHAR(255),
    school_college_university VARCHAR(255),
    previous_qualification VARCHAR(255),
    field_of_study VARCHAR(255),
    gpa_percentage VARCHAR(50),
    -- Learning Information
    interested_courses JSON,
    learning_category JSON,
    previous_experience TEXT,
    career_goals TEXT,
    learning_mode VARCHAR(100),
    availability VARCHAR(255),
    -- Admin fields
    reviewed_by INT NULL,
    reviewed_at TIMESTAMP NULL,
    admin_remarks TEXT NULL,
    rejection_reason TEXT NULL,
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_student_app_status (status),
    INDEX idx_student_app_user (user_id)
) ENGINE=InnoDB;

-- Application Documents
CREATE TABLE IF NOT EXISTS application_documents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    application_type ENUM('teacher','student') NOT NULL,
    application_id INT NOT NULL,
    document_type VARCHAR(50) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT DEFAULT 0,
    mime_type VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_app_doc_lookup (application_type, application_id)
) ENGINE=InnoDB;

-- Application Status Logs
CREATE TABLE IF NOT EXISTS application_status_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    application_type ENUM('teacher','student') NOT NULL,
    application_id INT NOT NULL,
    old_status VARCHAR(20) NULL,
    new_status VARCHAR(20) NOT NULL,
    changed_by INT NULL,
    remarks TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_app_log_lookup (application_type, application_id)
) ENGINE=InnoDB;

-- =====================================================
-- Database Schema Complete
-- =====================================================
SELECT 'Database schema created successfully!' AS status;