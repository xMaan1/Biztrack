"""
Grade Model
"""

from sqlalchemy import Column, Integer, String, TIMESTAMP, ForeignKey, DECIMAL, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from ..core.database import Base


class Grade(Base):
    __tablename__ = "grades"

    id = Column(Integer, primary_key=True, autoincrement=True)
    enrollment_id = Column(Integer, ForeignKey("course_enrollments.id"), nullable=False)
    assignment_id = Column(Integer, ForeignKey("assignments.id"), nullable=True)
    score = Column(DECIMAL(5, 2), nullable=True)
    letter_grade = Column(String(5), nullable=True)
    percentage = Column(DECIMAL(5, 2), nullable=True)
    feedback = Column(Text, nullable=True)
    graded_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    graded_at = Column(TIMESTAMP, nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.current_timestamp())
    updated_at = Column(
        TIMESTAMP,
        server_default=func.current_timestamp(),
        onupdate=func.current_timestamp()
    )

    # Relationships
    enrollment = relationship("CourseEnrollment", back_populates="grades")
    assignment = relationship("Assignment", back_populates="grades")
    grader = relationship("User", foreign_keys=[graded_by])

    def __repr__(self):
        return f"<Grade(id={self.id}, enrollment_id={self.enrollment_id}, score={self.score})>"


__all__ = ["Grade"]