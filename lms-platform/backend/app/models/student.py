"""
Student Model - Role-specific table for students
"""

from sqlalchemy import Column, Integer, String, Enum, DECIMAL, ForeignKey, TIMESTAMP
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from ..core.database import Base


class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    student_number = Column(String(50), nullable=True, comment="Official student ID number")
    enrollment_year = Column(Integer, nullable=True, comment="Year of enrollment")
    gpa = Column(DECIMAL(3, 2), nullable=True, comment="Current GPA (0.00-4.00)")
    academic_status = Column(
        Enum("active", "probation", "suspended", "graduated", "withdrawn", name="academic_status_enum"),
        default="active",
        server_default="active",
    )
    created_at = Column(TIMESTAMP, server_default=func.current_timestamp())
    updated_at = Column(
        TIMESTAMP,
        server_default=func.current_timestamp(),
        onupdate=func.current_timestamp(),
    )

    # Relationships
    user = relationship("User", back_populates="student_record")

    def __repr__(self):
        return f"<Student(id={self.id}, user_id={self.user_id}, student_number='{self.student_number}')>"


__all__ = ["Student"]
