"""
Assignment Model
"""

from sqlalchemy import Column, Integer, String, Text, Boolean, TIMESTAMP, ForeignKey, DECIMAL, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from ..core.database import Base


class Assignment(Base):
    __tablename__ = "assignments"

    id = Column(Integer, primary_key=True, autoincrement=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    instructions = Column(Text, nullable=True)
    max_score = Column(DECIMAL(5, 2), nullable=False, default=100.00)
    deadline = Column(DateTime, nullable=False)
    is_published = Column(Boolean, default=False)
    allow_late_submission = Column(Boolean, default=False)
    late_submission_penalty = Column(DECIMAL(5, 2), default=0.00)
    max_file_size = Column(Integer, default=10485760)  # 10MB default
    allowed_file_types = Column(String(255), default=".pdf,.doc,.docx,.zip")
    created_at = Column(TIMESTAMP, server_default=func.current_timestamp())
    updated_at = Column(
        TIMESTAMP,
        server_default=func.current_timestamp(),
        onupdate=func.current_timestamp()
    )
    deleted_at = Column(TIMESTAMP, nullable=True)

    # Relationships
    course = relationship("Course", back_populates="assignments")
    submissions = relationship("AssignmentSubmission", back_populates="assignment")
    grades = relationship("Grade", back_populates="assignment")

    def __repr__(self):
        return f"<Assignment(id={self.id}, title='{self.title}', course_id={self.course_id})>"


__all__ = ["Assignment"]