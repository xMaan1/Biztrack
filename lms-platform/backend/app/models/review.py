"""
Course Review Model
"""

from sqlalchemy import Column, Integer, String, Text, Boolean, TIMESTAMP, ForeignKey, CheckConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from ..core.database import Base


class CourseReview(Base):
    __tablename__ = "course_reviews"

    id = Column(Integer, primary_key=True, autoincrement=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    rating = Column(Integer, nullable=False)
    review = Column(Text, nullable=True)
    is_approved = Column(Boolean, default=False)
    created_at = Column(TIMESTAMP, server_default=func.current_timestamp())
    updated_at = Column(
        TIMESTAMP,
        server_default=func.current_timestamp(),
        onupdate=func.current_timestamp()
    )
    deleted_at = Column(TIMESTAMP, nullable=True)

    # Table constraints
    __table_args__ = (
        CheckConstraint('rating >= 1 AND rating <= 5', name='check_rating_range'),
    )

    # Relationships
    course = relationship("Course", back_populates="reviews")
    student = relationship("User", back_populates="course_reviews")

    def __repr__(self):
        return f"<CourseReview(id={self.id}, course_id={self.course_id}, rating={self.rating})>"


__all__ = ["CourseReview"]