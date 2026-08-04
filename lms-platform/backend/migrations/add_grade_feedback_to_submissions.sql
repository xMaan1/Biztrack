-- Add grade and feedback columns to assignment_submissions table
-- Run this SQL against the lms_db database

ALTER TABLE assignment_submissions
  ADD COLUMN `grade` DECIMAL(5,2) NULL AFTER `plagiarism_score`,
  ADD COLUMN `feedback` TEXT NULL AFTER `grade`;
