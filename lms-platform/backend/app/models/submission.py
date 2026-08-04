"""
Assignment Submission Model
"""

from sqlalchemy import Column, Integer, String, Boolean, TIMESTAMP, ForeignKey, DECIMAL, Text, BigInteger, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from ..core.database import Base


class AssignmentSubmission(Base):
    __tablename__ = "assignment_submissions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    assignment_id = Column(Integer, ForeignKey("assignments.id"), nullable=False)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    file_name = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_size = Column(BigInteger, nullable=False)  # Size in bytes
    mime_type = Column(String(100), nullable=False)
    submission_text = Column(Text, nullable=True)
    is_late = Column(Boolean, default=False)
    plagiarism_score = Column(DECIMAL(5, 2), nullable=True)
    grade = Column(DECIMAL(5, 2), nullable=True)
    feedback = Column(Text, nullable=True)
    status = Column(
        Enum("submitted", "graded", "returned", "pending_review"),
        default="submitted"
    )
    submitted_at = Column(TIMESTAMP, server_default=func.current_timestamp())
    graded_at = Column(TIMESTAMP, nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.current_timestamp())
    updated_at = Column(
        TIMESTAMP,
        server_default=func.current_timestamp(),
        onupdate=func.current_timestamp()
    )
    deleted_at = Column(TIMESTAMP, nullable=True)

    # Relationships
    assignment = relationship("Assignment", back_populates="submissions")
    student = relationship("User", back_populates="submissions")

    def __repr__(self):
        return f"<AssignmentSubmission(id={self.id}, assignment_id={self.assignment_id}, student_id={self.student_id})>"


__all__ = ["AssignmentSubmission"]