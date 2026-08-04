"""
Enrollment Service
Handles course enrollment, management, and tracking
"""

from typing import Optional, List
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import and_, func

from ..core.exceptions import NotFoundError, ConflictError, ValidationError
from ..models import Course, User, CourseEnrollment
from ..schemas.enrollment import EnrollmentCreate, EnrollmentUpdate


class EnrollmentService:
    """Course enrollment service"""

    @staticmethod
    def get_enrollment_by_id(
        db: Session,
        enrollment_id: int
    ) -> Optional[CourseEnrollment]:
        """Get enrollment by ID"""
        return db.query(CourseEnrollment).filter(
            CourseEnrollment.id == enrollment_id
        ).first()

    @staticmethod
    def get_enrollment(
        db: Session,
        course_id: int,
        student_id: int
    ) -> Optional[CourseEnrollment]:
        """Get enrollment by course and student"""
        return db.query(CourseEnrollment).filter(
            CourseEnrollment.course_id == course_id,
            CourseEnrollment.student_id == student_id
        ).first()

    @staticmethod
    def get_student_enrollments(
        db: Session,
        student_id: int,
        status: Optional[str] = None
    ) -> List[CourseEnrollment]:
        """Get all enrollments for a student"""
        query = db.query(CourseEnrollment).filter(
            CourseEnrollment.student_id == student_id
        )

        if status:
            query = query.filter(CourseEnrollment.status == status)

        return query.order_by(CourseEnrollment.created_at.desc()).all()

    @staticmethod
    def get_course_enrollments(
        db: Session,
        course_id: int,
        status: Optional[str] = None,
        skip: int = 0,
        limit: int = 20
    ) -> tuple[List[CourseEnrollment], int]:
        """
        Get enrollments for a course with pagination
        """
        query = db.query(CourseEnrollment).filter(
            CourseEnrollment.course_id == course_id
        )

        if status:
            query = query.filter(CourseEnrollment.status == status)

        total = query.count()
        enrollments = query.offset(skip).limit(limit).all()

        return enrollments, total

    @staticmethod
    def enroll_student(
        db: Session,
        enrollment_data: EnrollmentCreate
    ) -> CourseEnrollment:
        """
        Enroll a student in a course
        """
        # Check if course exists
        course = db.query(Course).filter(
            Course.id == enrollment_data.course_id,
            Course.deleted_at.is_(None)
        ).first()
        if not course:
            raise NotFoundError("Course not found", resource_type="Course", resource_id=enrollment_data.course_id)

        # Check if student exists
        student = db.query(User).filter(
            User.id == enrollment_data.student_id,
            User.deleted_at.is_(None)
        ).first()
        if not student:
            raise NotFoundError("Student not found", resource_type="User", resource_id=enrollment_data.student_id)

        # Check if already enrolled
        existing = EnrollmentService.get_enrollment(
            db,
            enrollment_data.course_id,
            enrollment_data.student_id
        )
        if existing:
            raise ConflictError("Student is already enrolled in this course")

        # Check if course is full
        if course.current_enrollment >= course.max_students:
            raise ValidationError("Course is full. Maximum capacity reached.")

        # Create enrollment
        enrollment = CourseEnrollment(
            course_id=enrollment_data.course_id,
            student_id=enrollment_data.student_id,
            status=enrollment_data.status or 'active',
            enrollment_date=datetime.now(),
        )

        db.add(enrollment)
        db.flush()
        
        # Update course enrollment count
        course.current_enrollment = db.query(CourseEnrollment).filter(
            CourseEnrollment.course_id == course.id,
            CourseEnrollment.status == 'active'
        ).count()

        db.commit()
        db.refresh(enrollment)

        return enrollment

    @staticmethod
    def update_enrollment(
        db: Session,
        enrollment_id: int,
        enrollment_data: EnrollmentUpdate
    ) -> CourseEnrollment:
        """
        Update enrollment status or grade
        """
        enrollment = EnrollmentService.get_enrollment_by_id(db, enrollment_id)
        if not enrollment:
            raise NotFoundError("Enrollment not found", resource_type="Enrollment", resource_id=enrollment_id)

        # Update fields
        update_dict = enrollment_data.dict(exclude_unset=True)
        for field, value in update_dict.items():
            if value is not None:
                setattr(enrollment, field, value)

        # If status is being changed to 'dropped' or 'completed'
        if enrollment_data.status in ['dropped', 'completed']:
            if enrollment_data.status == 'dropped':
                enrollment.dropped_at = datetime.now()

        db.commit()
        db.refresh(enrollment)

        return enrollment

    @staticmethod
    def drop_enrollment(
        db: Session,
        enrollment_id: int
    ) -> bool:
        """
        Drop a course enrollment
        """
        enrollment = EnrollmentService.get_enrollment_by_id(db, enrollment_id)
        if not enrollment:
            raise NotFoundError("Enrollment not found", resource_type="Enrollment", resource_id=enrollment_id)

        enrollment.status = 'dropped'
        enrollment.dropped_at = datetime.now()

        # Update course enrollment count
        course = enrollment.course
        if course:
            course.current_enrollment = db.query(CourseEnrollment).filter(
                CourseEnrollment.course_id == course.id,
                CourseEnrollment.status == 'active'
            ).count()

        db.commit()
        return True

    @staticmethod
    def get_enrollment_statistics(
        db: Session,
        course_id: int
    ) -> dict:
        """
        Get enrollment statistics for a course
        """
        total = db.query(CourseEnrollment).filter(
            CourseEnrollment.course_id == course_id
        ).count()

        active = db.query(CourseEnrollment).filter(
            CourseEnrollment.course_id == course_id,
            CourseEnrollment.status == 'active'
        ).count()

        completed = db.query(CourseEnrollment).filter(
            CourseEnrollment.course_id == course_id,
            CourseEnrollment.status == 'completed'
        ).count()

        dropped = db.query(CourseEnrollment).filter(
            CourseEnrollment.course_id == course_id,
            CourseEnrollment.status == 'dropped'
        ).count()

        pending = db.query(CourseEnrollment).filter(
            CourseEnrollment.course_id == course_id,
            CourseEnrollment.status == 'pending'
        ).count()

        return {
            "total": total,
            "active": active,
            "completed": completed,
            "dropped": dropped,
            "pending": pending,
        }