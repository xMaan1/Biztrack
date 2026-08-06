"""
Report Service
Handles reports and analytics
"""

from typing import Dict, Any, Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import func, and_

from ..models import User, Course, CourseEnrollment, AttendanceSession, AttendanceRecord, Grade, Assignment


class ReportService:
    """Report and analytics service"""

    @staticmethod
    def get_enrollment_statistics(
        db: Session,
        course_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Get enrollment statistics
        """
        query = db.query(CourseEnrollment)
        
        if course_id:
            query = query.filter(CourseEnrollment.course_id == course_id)
        
        total = query.count()
        active = query.filter(CourseEnrollment.status == 'active').count()
        completed = query.filter(CourseEnrollment.status == 'completed').count()
        dropped = query.filter(CourseEnrollment.status == 'dropped').count()
        pending = query.filter(CourseEnrollment.status == 'pending').count()
        
        return {
            "total_enrollments": total,
            "active": active,
            "completed": completed,
            "dropped": dropped,
            "pending": pending
        }

    @staticmethod
    def get_attendance_statistics(
        db: Session,
        course_id: int
    ) -> Dict[str, Any]:
        """
        Get attendance statistics for a course
        """
        sessions = db.query(AttendanceSession).filter(
            AttendanceSession.course_id == course_id,
            AttendanceSession.deleted_at.is_(None)
        ).count()
        
        records = db.query(AttendanceRecord).join(
            AttendanceSession
        ).filter(
            AttendanceSession.course_id == course_id
        )
        
        total_records = records.count()
        present = records.filter(AttendanceRecord.status == 'present').count()
        absent = records.filter(AttendanceRecord.status == 'absent').count()
        late = records.filter(AttendanceRecord.status == 'late').count()
        excused = records.filter(AttendanceRecord.status == 'excused').count()
        
        return {
            "course_id": course_id,
            "total_sessions": sessions,
            "total_records": total_records,
            "present": present,
            "absent": absent,
            "late": late,
            "excused": excused,
            "attendance_percentage": round((present + late) / total_records * 100, 2) if total_records > 0 else 0
        }

    @staticmethod
    def get_grade_distribution(
        db: Session,
        course_id: int
    ) -> Dict[str, Any]:
        """
        Get grade distribution for a course
        """
        grades = db.query(Grade).join(
            CourseEnrollment
        ).filter(
            CourseEnrollment.course_id == course_id
        )
        
        distribution = {
            'A': grades.filter(Grade.letter_grade == 'A').count(),
            'B': grades.filter(Grade.letter_grade == 'B').count(),
            'C': grades.filter(Grade.letter_grade == 'C').count(),
            'D': grades.filter(Grade.letter_grade == 'D').count(),
            'F': grades.filter(Grade.letter_grade == 'F').count(),
        }
        
        total = sum(distribution.values())
        
        return {
            "course_id": course_id,
            "distribution": distribution,
            "total_grades": total
        }

    @staticmethod
    def get_course_performance(
        db: Session,
        course_id: int
    ) -> Dict[str, Any]:
        """
        Get course performance analytics
        """
        # Get course info
        course = db.query(Course).filter(Course.id == course_id).first()
        if not course:
            return {"error": "Course not found"}
        
        # Get enrollment stats
        enrollments = db.query(CourseEnrollment).filter(
            CourseEnrollment.course_id == course_id
        )
        
        total_students = enrollments.count()
        active_students = enrollments.filter(CourseEnrollment.status == 'active').count()
        
        # Get average grade
        avg_grade = db.query(func.avg(Grade.score)).join(
            CourseEnrollment
        ).filter(
            CourseEnrollment.course_id == course_id
        ).scalar()
        
        # Get assignment completion
        assignments = db.query(Assignment).filter(
            Assignment.course_id == course_id,
            Assignment.is_published == True
        ).count()
        
        return {
            "course_id": course_id,
            "course_title": course.title,
            "total_students": total_students,
            "active_students": active_students,
            "average_grade": round(avg_grade, 2) if avg_grade else None,
            "total_assignments": assignments,
            "completion_rate": round(active_students / total_students * 100, 2) if total_students > 0 else 0
        }

    @staticmethod
    def get_system_statistics(
        db: Session
    ) -> Dict[str, Any]:
        """
        Get system-wide statistics
        """
        total_users = db.query(User).filter(User.deleted_at.is_(None)).count()
        total_students = db.query(User).filter(
            User.role == 'student',
            User.deleted_at.is_(None)
        ).count()
        total_teachers = db.query(User).filter(
            User.role == 'teacher',
            User.deleted_at.is_(None)
        ).count()
        total_courses = db.query(Course).filter(Course.deleted_at.is_(None)).count()
        total_enrollments = db.query(CourseEnrollment).count()
        
        return {
            "total_users": total_users,
            "total_students": total_students,
            "total_teachers": total_teachers,
            "total_courses": total_courses,
            "total_enrollments": total_enrollments,
            "active_enrollments": db.query(CourseEnrollment).filter(CourseEnrollment.status == 'active').count()
        }


__all__ = ["ReportService"]