"""
Grade Service
Handles grade management, calculation, and reporting
"""

from datetime import datetime
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func

from ..core.exceptions import NotFoundError, ValidationError
from ..models import Grade, CourseEnrollment, Assignment, User
from ..schemas.grade import GradeCreate, GradeUpdate


class GradeService:
    """Grade management service"""

    @staticmethod
    def get_grade_by_id(
        db: Session,
        grade_id: int
    ) -> Optional[Grade]:
        """Get grade by ID"""
        return db.query(Grade).filter(Grade.id == grade_id).first()

    @staticmethod
    def get_student_grades(
        db: Session,
        student_id: int,
        course_id: Optional[int] = None
    ) -> List[Grade]:
        """
        Get grades for a student
        """
        query = db.query(Grade).join(
            CourseEnrollment,
            Grade.enrollment_id == CourseEnrollment.id
        ).filter(
            CourseEnrollment.student_id == student_id
        )

        if course_id:
            query = query.filter(CourseEnrollment.course_id == course_id)

        return query.order_by(Grade.created_at.desc()).all()

    @staticmethod
    def get_course_grades(
        db: Session,
        course_id: int,
        skip: int = 0,
        limit: int = 20
    ) -> tuple[List[Grade], int]:
        """
        Get grades for a course
        """
        query = db.query(Grade).join(
            CourseEnrollment,
            Grade.enrollment_id == CourseEnrollment.id
        ).filter(
            CourseEnrollment.course_id == course_id
        )

        total = query.count()
        grades = query.offset(skip).limit(limit).all()

        return grades, total

    @staticmethod
    def create_grade(
        db: Session,
        grade_data: GradeCreate
    ) -> Grade:
        """
        Create a new grade
        """
        # Check if enrollment exists
        enrollment = db.query(CourseEnrollment).filter(
            CourseEnrollment.id == grade_data.enrollment_id
        ).first()
        if not enrollment:
            raise NotFoundError("Enrollment not found", resource_type="Enrollment", resource_id=grade_data.enrollment_id)

        # Check if assignment exists (if provided)
        if grade_data.assignment_id:
            assignment = db.query(Assignment).filter(
                Assignment.id == grade_data.assignment_id,
                Assignment.deleted_at.is_(None)
            ).first()
            if not assignment:
                raise NotFoundError("Assignment not found", resource_type="Assignment", resource_id=grade_data.assignment_id)

        # Check if grade already exists for this enrollment and assignment
        if grade_data.assignment_id:
            existing = db.query(Grade).filter(
                Grade.enrollment_id == grade_data.enrollment_id,
                Grade.assignment_id == grade_data.assignment_id
            ).first()
            if existing:
                raise ValidationError("Grade already exists for this assignment")

        # Calculate letter grade based on percentage
        percentage = grade_data.percentage
        letter_grade = None

        if percentage is not None:
            if percentage >= 90:
                letter_grade = 'A'
            elif percentage >= 80:
                letter_grade = 'B'
            elif percentage >= 70:
                letter_grade = 'C'
            elif percentage >= 60:
                letter_grade = 'D'
            else:
                letter_grade = 'F'

        # Create grade
        grade = Grade(
            **grade_data.dict(),
            letter_grade=letter_grade or grade_data.letter_grade,
            graded_at=datetime.now()
        )

        db.add(grade)
        db.commit()
        db.refresh(grade)

        return grade

    @staticmethod
    def update_grade(
        db: Session,
        grade_id: int,
        grade_data: GradeUpdate
    ) -> Grade:
        """
        Update an existing grade
        """
        grade = GradeService.get_grade_by_id(db, grade_id)
        if not grade:
            raise NotFoundError("Grade not found", resource_type="Grade", resource_id=grade_id)

        # Update fields
        update_dict = grade_data.dict(exclude_unset=True)
        for field, value in update_dict.items():
            if value is not None:
                setattr(grade, field, value)

        # Recalculate letter grade if percentage changed
        if grade_data.percentage is not None:
            percentage = grade_data.percentage
            if percentage >= 90:
                grade.letter_grade = 'A'
            elif percentage >= 80:
                grade.letter_grade = 'B'
            elif percentage >= 70:
                grade.letter_grade = 'C'
            elif percentage >= 60:
                grade.letter_grade = 'D'
            else:
                grade.letter_grade = 'F'

        grade.graded_at = datetime.now()
        db.commit()
        db.refresh(grade)

        return grade

    @staticmethod
    def get_student_course_summary(
        db: Session,
        student_id: int,
        course_id: int
    ) -> Dict[str, Any]:
        """
        Get grade summary for a student in a course
        """
        # Get enrollment
        enrollment = db.query(CourseEnrollment).filter(
            CourseEnrollment.student_id == student_id,
            CourseEnrollment.course_id == course_id
        ).first()

        if not enrollment:
            raise NotFoundError("Student not enrolled in this course")

        # Get grades
        grades = db.query(Grade).filter(
            Grade.enrollment_id == enrollment.id
        ).all()

        # Calculate statistics
        total_assignments = len(grades)
        graded_assignments = len([g for g in grades if g.score is not None])
        
        scores = [float(g.score) for g in grades if g.score is not None]
        average_score = sum(scores) / len(scores) if scores else None
        
        # Calculate overall percentage
        overall_percentage = None
        if average_score is not None:
            # Assuming max score is 100
            overall_percentage = average_score

        from ..models import User
        from ..models.profile import UserProfile

        student_user = db.query(User).filter(User.id == student_id).first()
        student_profile = db.query(UserProfile).filter(UserProfile.user_id == student_id).first() if student_user else None
        student_name = student_profile.full_name if student_profile else (student_user.email if student_user else None)

        course = enrollment.course
        course_title = course.title if course else None

        return {
            "student_id": student_id,
            "student_name": student_name,
            "course_id": course_id,
            "course_title": course_title,
            "enrollment_id": enrollment.id,
            "total_assignments": total_assignments,
            "graded_assignments": graded_assignments,
            "average_score": round(average_score, 2) if average_score else None,
            "letter_grade": None,
            "overall_percentage": round(overall_percentage, 2) if overall_percentage else None,
        }