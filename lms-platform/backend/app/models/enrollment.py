"""
Course Enrollment Model
"""

from sqlalchemy import Column, Integer, TIMESTAMP, ForeignKey, Enum, String, DECIMAL
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from ..core.database import Base


class CourseEnrollment(Base):
    __tablename__ = "course_enrollments"

    id = Column(Integer, primary_key=True, autoincrement=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    enrollment_date = Column(TIMESTAMP, server_default=func.current_timestamp())
    status = Column(
        Enum("active", "dropped", "completed", "pending"),
        default="pending"
    )
    grade = Column(String(5), nullable=True)
    grade_points = Column(DECIMAL(3, 2), nullable=True)
    completion_percentage = Column(DECIMAL(5, 2), default=0.00)
    dropped_at = Column(TIMESTAMP, nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.current_timestamp())
    updated_at = Column(
        TIMESTAMP,
        server_default=func.current_timestamp(),
        onupdate=func.current_timestamp()
    )

    # Relationships
    course = relationship("Course", back_populates="enrollments")
    student = relationship("User", back_populates="enrollments")
    grades = relationship("Grade", back_populates="enrollment")

    def __repr__(self):
        return f"<CourseEnrollment(id={self.id}, course_id={self.course_id}, student_id={self.student_id})>"


__all__ = ["CourseEnrollment"]