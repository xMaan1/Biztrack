"""
Assignment Service
Handles assignment creation, management, and retrieval
"""

from typing import Optional, List
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import and_, func

from ..core.exceptions import NotFoundError, ConflictError
from ..models import Assignment, Course, AssignmentSubmission
from ..schemas.assignment import AssignmentCreate, AssignmentUpdate


class AssignmentService:
    """Assignment management service"""

    @staticmethod
    def get_assignment_by_id(
        db: Session,
        assignment_id: int,
        include_deleted: bool = False
    ) -> Optional[Assignment]:
        """Get assignment by ID"""
        query = db.query(Assignment).filter(Assignment.id == assignment_id)
        if not include_deleted:
            query = query.filter(Assignment.deleted_at.is_(None))
        return query.first()

    @staticmethod
    def get_course_assignments(
        db: Session,
        course_id: int,
        skip: int = 0,
        limit: int = 20,
        is_published: Optional[bool] = None
    ) -> tuple[List[Assignment], int]:
        """
        Get assignments for a course
        """
        query = db.query(Assignment).filter(
            Assignment.course_id == course_id,
            Assignment.deleted_at.is_(None)
        )

        if is_published is not None:
            query = query.filter(Assignment.is_published == is_published)

        total = query.count()
        assignments = query.offset(skip).limit(limit).order_by(Assignment.deadline).all()

        return assignments, total

    @staticmethod
    def create_assignment(
        db: Session,
        assignment_data: AssignmentCreate
    ) -> Assignment:
        """
        Create a new assignment
        """
        # Check if course exists
        course = db.query(Course).filter(
            Course.id == assignment_data.course_id,
            Course.deleted_at.is_(None)
        ).first()
        if not course:
            raise NotFoundError("Course not found", resource_type="Course", resource_id=assignment_data.course_id)

        # Create assignment
        assignment = Assignment(**assignment_data.dict())
        db.add(assignment)
        db.commit()
        db.refresh(assignment)

        return assignment

    @staticmethod
    def update_assignment(
        db: Session,
        assignment_id: int,
        assignment_data: AssignmentUpdate
    ) -> Assignment:
        """
        Update an existing assignment
        """
        assignment = AssignmentService.get_assignment_by_id(db, assignment_id)
        if not assignment:
            raise NotFoundError("Assignment not found", resource_type="Assignment", resource_id=assignment_id)

        # Update fields
        update_dict = assignment_data.dict(exclude_unset=True)
        for field, value in update_dict.items():
            if value is not None:
                setattr(assignment, field, value)

        db.commit()
        db.refresh(assignment)

        return assignment

    @staticmethod
    def delete_assignment(
        db: Session,
        assignment_id: int,
        soft_delete: bool = True
    ) -> bool:
        """
        Delete an assignment
        """
        assignment = AssignmentService.get_assignment_by_id(db, assignment_id)
        if not assignment:
            raise NotFoundError("Assignment not found", resource_type="Assignment", resource_id=assignment_id)

        if soft_delete:
            assignment.deleted_at = datetime.now()
            assignment.is_published = False
        else:
            db.delete(assignment)

        db.commit()
        return True

    @staticmethod
    def publish_assignment(
        db: Session,
        assignment_id: int
    ) -> Assignment:
        """
        Publish an assignment
        """
        assignment = AssignmentService.get_assignment_by_id(db, assignment_id)
        if not assignment:
            raise NotFoundError("Assignment not found", resource_type="Assignment", resource_id=assignment_id)

        assignment.is_published = True
        db.commit()
        db.refresh(assignment)

        return assignment

    @staticmethod
    def get_assignment_statistics(
        db: Session,
        assignment_id: int
    ) -> dict:
        """
        Get statistics for an assignment
        """
        assignment = AssignmentService.get_assignment_by_id(db, assignment_id)
        if not assignment:
            raise NotFoundError("Assignment not found", resource_type="Assignment", resource_id=assignment_id)

        # Get submission statistics
        total_submissions = db.query(AssignmentSubmission).filter(
            AssignmentSubmission.assignment_id == assignment_id
        ).count()

        graded_submissions = db.query(AssignmentSubmission).filter(
            AssignmentSubmission.assignment_id == assignment_id,
            AssignmentSubmission.status == 'graded'
        ).count()

        # Get average score
        avg_score = db.query(func.avg(AssignmentSubmission.score)).filter(
            AssignmentSubmission.assignment_id == assignment_id,
            AssignmentSubmission.status == 'graded'
        ).scalar()

        return {
            "assignment_id": assignment_id,
            "title": assignment.title,
            "total_submissions": total_submissions,
            "graded_submissions": graded_submissions,
            "pending_grading": total_submissions - graded_submissions,
            "average_score": round(avg_score, 2) if avg_score else None,
            "deadline": assignment.deadline,
            "is_published": assignment.is_published,
        }