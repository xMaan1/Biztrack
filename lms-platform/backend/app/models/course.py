"""
Course Model
"""

from sqlalchemy import Column, Integer, String, Text, Boolean, TIMESTAMP, ForeignKey, Date, DECIMAL
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from ..core.database import Base


class Course(Base):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String(255), nullable=False)
    code = Column(String(50), unique=True, nullable=False)
    description = Column(Text, nullable=True)
    credits = Column(Integer, default=3)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=False)
    teacher_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    semester = Column(String(20), nullable=False)
    academic_year = Column(String(20), nullable=False)
    max_students = Column(Integer, default=30)
    current_enrollment = Column(Integer, default=0)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    is_published = Column(Boolean, default=False)
    thumbnail_url = Column(String(500), nullable=True)
    syllabus_url = Column(String(500), nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.current_timestamp())
    updated_at = Column(
        TIMESTAMP,
        server_default=func.current_timestamp(),
        onupdate=func.current_timestamp()
    )
    deleted_at = Column(TIMESTAMP, nullable=True)

    # Relationships
    department = relationship("Department", back_populates="courses")
    teacher = relationship("User", foreign_keys=[teacher_id], back_populates="taught_courses")
    enrollments = relationship("CourseEnrollment", back_populates="course")
    lectures = relationship("Lecture", back_populates="course")
    assignments = relationship("Assignment", back_populates="course")
    attendance_sessions = relationship("AttendanceSession", back_populates="course")
    reviews = relationship("CourseReview", back_populates="course")
    quizzes = relationship("Quiz", back_populates="course")

    def __repr__(self):
        return f"<Course(id={self.id}, title='{self.title}', code='{self.code}')>"


__all__ = ["Course"]