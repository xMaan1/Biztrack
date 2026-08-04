"""
Course Service
Handles course management, creation, and retrieval
"""

from datetime import datetime
from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import or_, func, and_

from ..core.exceptions import NotFoundError, ConflictError, ValidationError
from ..models import Course, Department, User, CourseEnrollment
from ..schemas.course import CourseCreate, CourseUpdate


class CourseService:
    """Course management service"""

    @staticmethod
    def get_course_by_id(
        db: Session,
        course_id: int,
        include_deleted: bool = False
    ) -> Optional[Course]:
        """Get course by ID"""
        query = db.query(Course).filter(Course.id == course_id)
        if not include_deleted:
            query = query.filter(Course.deleted_at.is_(None))
        return query.first()

    @staticmethod
    def get_course_by_code(
        db: Session,
        code: str,
        include_deleted: bool = False
    ) -> Optional[Course]:
        """Get course by code"""
        query = db.query(Course).filter(Course.code == code)
        if not include_deleted:
            query = query.filter(Course.deleted_at.is_(None))
        return query.first()

    @staticmethod
    def get_courses(
        db: Session,
        skip: int = 0,
        limit: int = 20,
        search: Optional[str] = None,
        department_id: Optional[int] = None,
        teacher_id: Optional[int] = None,
        semester: Optional[str] = None,
        is_published: Optional[bool] = None,
        student_id: Optional[int] = None
    ) -> tuple[List[Course], int]:
        """
        Get list of courses with filters
        """
        query = db.query(Course).filter(Course.deleted_at.is_(None))

        # Apply filters
        if search:
            search_term = f"%{search}%"
            query = query.filter(
                or_(
                    Course.title.ilike(search_term),
                    Course.code.ilike(search_term),
                    Course.description.ilike(search_term),
                )
            )

        if department_id:
            query = query.filter(Course.department_id == department_id)

        if teacher_id:
            query = query.filter(Course.teacher_id == teacher_id)

        if semester:
            query = query.filter(Course.semester == semester)

        if is_published is not None:
            query = query.filter(Course.is_published == is_published)

        # Filter by student enrollment
        if student_id:
            query = query.join(
                CourseEnrollment,
                and_(
                    CourseEnrollment.course_id == Course.id,
                    CourseEnrollment.student_id == student_id,
                    CourseEnrollment.status == 'active'
                )
            )

        # Get total count
        total = query.count()

        # Apply ordering before pagination
        courses = query.order_by(Course.created_at.desc()).offset(skip).limit(limit).all()

        return courses, total

    @staticmethod
    def create_course(
        db: Session,
        course_data: CourseCreate
    ) -> Course:
        """
        Create a new course
        """
        # Check if course code exists
        existing = db.query(Course).filter(
            Course.code == course_data.code,
            Course.deleted_at.is_(None)
        ).first()

        if existing:
            raise ConflictError(f"Course with code '{course_data.code}' already exists")

        # Check if department exists
        department = db.query(Department).filter(Department.id == course_data.department_id).first()
        if not department:
            raise NotFoundError("Department not found", resource_type="Department", resource_id=course_data.department_id)

        # Check if teacher exists
        teacher = db.query(User).filter(
            User.id == course_data.teacher_id,
            User.deleted_at.is_(None)
        ).first()
        if not teacher:
            raise NotFoundError("Teacher not found", resource_type="User", resource_id=course_data.teacher_id)

        # Create course
        course = Course(**course_data.dict())
        db.add(course)
        db.commit()
        db.refresh(course)

        return course

    @staticmethod
    def update_course(
        db: Session,
        course_id: int,
        course_data: CourseUpdate
    ) -> Course:
        """
        Update an existing course
        """
        course = CourseService.get_course_by_id(db, course_id)
        if not course:
            raise NotFoundError("Course not found", resource_type="Course", resource_id=course_id)

        # Check if code is being changed and is unique
        if course_data.code and course_data.code != course.code:
            existing = db.query(Course).filter(
                Course.code == course_data.code,
                Course.deleted_at.is_(None),
                Course.id != course_id
            ).first()
            if existing:
                raise ConflictError(f"Course with code '{course_data.code}' already exists")

        # Update fields
        update_dict = course_data.dict(exclude_unset=True)
        for field, value in update_dict.items():
            if value is not None:
                setattr(course, field, value)

        db.commit()
        db.refresh(course)

        return course

    @staticmethod
    def delete_course(
        db: Session,
        course_id: int,
        soft_delete: bool = True
    ) -> bool:
        """
        Delete a course
        """
        course = CourseService.get_course_by_id(db, course_id)
        if not course:
            raise NotFoundError("Course not found", resource_type="Course", resource_id=course_id)

        if soft_delete:
            course.deleted_at = datetime.now()
            course.is_published = False
        else:
            db.delete(course)

        db.commit()
        return True

    @staticmethod
    def publish_course(
        db: Session,
        course_id: int
    ) -> Course:
        """
        Publish a course
        """
        course = CourseService.get_course_by_id(db, course_id)
        if not course:
            raise NotFoundError("Course not found", resource_type="Course", resource_id=course_id)

        course.is_published = True
        db.commit()
        db.refresh(course)

        return course

    @staticmethod
    def unpublish_course(
        db: Session,
        course_id: int
    ) -> Course:
        """
        Unpublish a course
        """
        course = CourseService.get_course_by_id(db, course_id)
        if not course:
            raise NotFoundError("Course not found", resource_type="Course", resource_id=course_id)

        course.is_published = False
        db.commit()
        db.refresh(course)

        return course

    @staticmethod
    def get_course_statistics(
        db: Session,
        course_id: int
    ) -> dict:
        """
        Get statistics for a course
        """
        course = CourseService.get_course_by_id(db, course_id)
        if not course:
            raise NotFoundError("Course not found", resource_type="Course", resource_id=course_id)

        # Count enrollments
        total_enrollments = db.query(CourseEnrollment).filter(
            CourseEnrollment.course_id == course_id,
            CourseEnrollment.status == 'active'
        ).count()

        # Count lectures
        total_lectures = len(course.lectures) if course.lectures else 0

        # Count assignments
        total_assignments = len(course.assignments) if course.assignments else 0

        return {
            "course_id": course_id,
            "title": course.title,
            "total_enrollments": total_enrollments,
            "total_lectures": total_lectures,
            "total_assignments": total_assignments,
            "max_students": course.max_students,
            "current_enrollment": course.current_enrollment,
            "is_published": course.is_published,
        }