"""
API Router Aggregator
Combines all route modules into a single router
"""

from fastapi import APIRouter

from .auth.auth_router import router as auth_router
from .users.user_router import router as user_router
from .courses.course_router import router as course_router
from .attendance.attendance_router import router as attendance_router
from .attendance.face_recognition_router import router as face_recognition_router
from .assignments.assignment_router import router as assignment_router
from .grades.grade_router import router as grade_router
from .reports.report_router import router as report_router
from .departments.department_router import router as department_router
from .notifications.notification_router import router as notification_router
from .lectures.lecture_router import router as lecture_router
from .live_sessions.live_session_router import router as live_session_router
from .enrollments.enrollment_router import router as enrollment_router
from .applications.teacher_application_router import router as teacher_application_router
from .applications.student_application_router import router as student_application_router

# Create main API router
api_router = APIRouter()

# Include all sub-routers
api_router.include_router(auth_router, prefix="/auth", tags=["Authentication"])
api_router.include_router(user_router, prefix="/users", tags=["Users"])
api_router.include_router(course_router, prefix="/courses", tags=["Courses"])
api_router.include_router(department_router, prefix="/departments", tags=["Departments"])
api_router.include_router(attendance_router, prefix="/attendance", tags=["Attendance"])
api_router.include_router(face_recognition_router, prefix="/face-recognition", tags=["Face Recognition"])
api_router.include_router(assignment_router, prefix="/assignments", tags=["Assignments"])
api_router.include_router(grade_router, prefix="/grades", tags=["Grades"])
api_router.include_router(report_router, prefix="/reports", tags=["Reports"])
api_router.include_router(notification_router, prefix="/notifications", tags=["Notifications"])
api_router.include_router(lecture_router, prefix="/lectures", tags=["Lectures"])
api_router.include_router(live_session_router, prefix="/live-sessions", tags=["Live Sessions"])
api_router.include_router(enrollment_router, prefix="/enrollments", tags=["Enrollments"])
api_router.include_router(teacher_application_router, prefix="/applications", tags=["Teacher Applications"])
api_router.include_router(student_application_router, prefix="/applications", tags=["Student Applications"])

__all__ = ["api_router"]