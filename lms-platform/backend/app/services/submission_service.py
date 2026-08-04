"""
Submission Service
Handles assignment submissions, file management, and grading
"""

from typing import Optional, List
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import and_, func

from ..core.exceptions import NotFoundError, ConflictError, ValidationError
from ..core.config import settings
from ..models import AssignmentSubmission, Assignment, User
from ..schemas.submission import SubmissionCreate, SubmissionUpdate


class SubmissionService:
    """Assignment submission service"""

    @staticmethod
    def get_submission_by_id(
        db: Session,
        submission_id: int
    ) -> Optional[AssignmentSubmission]:
        """Get submission by ID"""
        return db.query(AssignmentSubmission).filter(
            AssignmentSubmission.id == submission_id,
            AssignmentSubmission.deleted_at.is_(None)
        ).first()

    @staticmethod
    def get_student_submission(
        db: Session,
        assignment_id: int,
        student_id: int
    ) -> Optional[AssignmentSubmission]:
        """Get submission by assignment and student"""
        return db.query(AssignmentSubmission).filter(
            AssignmentSubmission.assignment_id == assignment_id,
            AssignmentSubmission.student_id == student_id,
            AssignmentSubmission.deleted_at.is_(None)
        ).first()

    @staticmethod
    def get_assignment_submissions(
        db: Session,
        assignment_id: int,
        skip: int = 0,
        limit: int = 20,
        status: Optional[str] = None
    ) -> tuple[List[AssignmentSubmission], int]:
        """
        Get submissions for an assignment
        """
        query = db.query(AssignmentSubmission).filter(
            AssignmentSubmission.assignment_id == assignment_id,
            AssignmentSubmission.deleted_at.is_(None)
        )

        if status:
            query = query.filter(AssignmentSubmission.status == status)

        total = query.count()
        submissions = query.order_by(
            AssignmentSubmission.submitted_at.desc()
        ).offset(skip).limit(limit).all()

        return submissions, total

    @staticmethod
    def submit_assignment(
        db: Session,
        submission_data: SubmissionCreate
    ) -> AssignmentSubmission:
        """
        Submit an assignment
        """
        # Check if assignment exists and is published
        assignment = db.query(Assignment).filter(
            Assignment.id == submission_data.assignment_id,
            Assignment.is_published == True,
            Assignment.deleted_at.is_(None)
        ).first()
        if not assignment:
            raise NotFoundError("Assignment not found or not published", resource_type="Assignment", resource_id=submission_data.assignment_id)

        # Check if student exists
        student = db.query(User).filter(
            User.id == submission_data.student_id,
            User.deleted_at.is_(None)
        ).first()
        if not student:
            raise NotFoundError("Student not found", resource_type="User", resource_id=submission_data.student_id)

        # Check if already submitted
        existing = SubmissionService.get_student_submission(
            db,
            submission_data.assignment_id,
            submission_data.student_id
        )
        if existing:
            raise ConflictError("You have already submitted this assignment")

        # Validate file size
        if submission_data.file_size and submission_data.file_size > settings.MAX_UPLOAD_SIZE:
            raise ValidationError(f"File size exceeds maximum allowed size of {settings.MAX_UPLOAD_SIZE} bytes")

        # Check if submission is late
        is_late = False
        if assignment.deadline:
            is_late = datetime.now() > assignment.deadline

        if is_late and not assignment.allow_late_submission:
            raise ValidationError("Late submissions are not allowed for this assignment")

        # Create submission (exclude fields that are explicitly set below)
        submission = AssignmentSubmission(
            **submission_data.dict(exclude={'is_late', 'status', 'plagiarism_score'}),
            submitted_at=datetime.now(),
            is_late=is_late,
            status='submitted'
        )

        db.add(submission)
        db.commit()
        db.refresh(submission)

        return submission

    @staticmethod
    def update_submission(
        db: Session,
        submission_id: int,
        submission_data: SubmissionUpdate
    ) -> AssignmentSubmission:
        """
        Update a submission (student can update before grading)
        """
        submission = SubmissionService.get_submission_by_id(db, submission_id)
        if not submission:
            raise NotFoundError("Submission not found", resource_type="Submission", resource_id=submission_id)

        # Check if already graded
        if submission.status == 'graded':
            raise ValidationError("Cannot update a graded submission")

        # Update fields
        update_dict = submission_data.dict(exclude_unset=True)
        for field, value in update_dict.items():
            if value is not None:
                setattr(submission, field, value)

        submission.updated_at = datetime.now()

        db.commit()
        db.refresh(submission)

        return submission

    @staticmethod
    def grade_submission(
        db: Session,
        submission_id: int,
        score: float,
        feedback: Optional[str] = None
    ) -> AssignmentSubmission:
        """
        Grade a submission
        """
        submission = SubmissionService.get_submission_by_id(db, submission_id)
        if not submission:
            raise NotFoundError("Submission not found", resource_type="Submission", resource_id=submission_id)

        # Check if already graded
        if submission.status == 'graded':
            raise ValidationError("Submission already graded")

        # Update submission
        submission.grade = score
        submission.feedback = feedback
        submission.status = 'graded'
        submission.graded_at = datetime.now()

        db.commit()
        db.refresh(submission)

        return submission

    @staticmethod
    def delete_submission(
        db: Session,
        submission_id: int
    ) -> bool:
        """
        Delete a submission (soft delete)
        """
        submission = SubmissionService.get_submission_by_id(db, submission_id)
        if not submission:
            raise NotFoundError("Submission not found", resource_type="Submission", resource_id=submission_id)

        submission.deleted_at = datetime.now()
        db.commit()
        return True