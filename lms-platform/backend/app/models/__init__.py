"""
Database Models - SQLAlchemy ORM
All models are imported here for easy access
"""

from .user import User
from .role import Role
from .profile import UserProfile
from .department import Department
from .course import Course
from .enrollment import CourseEnrollment
from .lecture import Lecture
from .material import LectureMaterial
from .attendance import AttendanceSession, AttendanceRecord
from .face_encoding import FaceEncoding
from .assignment import Assignment
from .submission import AssignmentSubmission
from .grade import Grade
from .audit_log import AuditLog
from .notification import Notification
from .live_session import LiveSession
from .quiz import Quiz
from .review import CourseReview
from .progress import LectureProgress
from .student import Student
from .teacher import Teacher
from .admin import Admin
from .teacher_application import TeacherApplication
from .student_application import StudentApplication
from .application_document import ApplicationDocument
from .application_status_log import ApplicationStatusLog
from .course_deletion_request import CourseDeletionRequest

__all__ = [
    "User",
    "Role",
    "UserProfile",
    "Department",
    "Course",
    "CourseEnrollment",
    "Lecture",
    "LectureMaterial",
    "AttendanceSession",
    "AttendanceRecord",
    "FaceEncoding",
    "Assignment",
    "AssignmentSubmission",
    "Grade",
    "AuditLog",
    "Notification",
    "LiveSession",
    "Quiz",
    "CourseReview",
    "LectureProgress",
    "Student",
    "Teacher",
    "Admin",
    "TeacherApplication",
    "StudentApplication",
    "ApplicationDocument",
    "ApplicationStatusLog",
    "CourseDeletionRequest",
]