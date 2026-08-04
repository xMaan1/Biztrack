"""
Quiz Model (For future expansion)
"""

from sqlalchemy import Column, Integer, String, Text, Boolean, TIMESTAMP, ForeignKey, DECIMAL
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from ..core.database import Base


class Quiz(Base):
    __tablename__ = "quizzes"

    id = Column(Integer, primary_key=True, autoincrement=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    duration_minutes = Column(Integer, nullable=False)
    passing_score = Column(DECIMAL(5, 2), default=60.00)
    is_published = Column(Boolean, default=False)
    created_at = Column(TIMESTAMP, server_default=func.current_timestamp())
    updated_at = Column(
        TIMESTAMP,
        server_default=func.current_timestamp(),
        onupdate=func.current_timestamp()
    )
    deleted_at = Column(TIMESTAMP, nullable=True)

    # Relationships
    course = relationship("Course", back_populates="quizzes")

    def __repr__(self):
        return f"<Quiz(id={self.id}, title='{self.title}', course_id={self.course_id})>"


__all__ = ["Quiz"]