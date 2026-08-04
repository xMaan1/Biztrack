"""
User Model - Core Authentication
"""

from sqlalchemy import Column, Integer, String, Boolean, TIMESTAMP, ForeignKey, Text, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from ..core.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    email = Column(String(255), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(Enum('admin', 'teacher', 'student', 'public_user', name='user_role'), nullable=False, server_default='public_user')
    role_id = Column(Integer, ForeignKey("roles.id"), nullable=True, server_default=None)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=True)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    last_login_at = Column(TIMESTAMP, nullable=True)
    login_attempts = Column(Integer, default=0, server_default="0")
    locked_until = Column(TIMESTAMP, nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.current_timestamp())
    updated_at = Column(
        TIMESTAMP,
        server_default=func.current_timestamp(),
        onupdate=func.current_timestamp()
    )
    deleted_at = Column(TIMESTAMP, nullable=True)

    # Relationships
    department = relationship("Department", foreign_keys=[department_id], back_populates="users")
    profile = relationship("UserProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    
    # Teacher relationships
    taught_courses = relationship("Course", foreign_keys="Course.teacher_id", back_populates="teacher")
    
    # Student relationships
    enrollments = relationship("CourseEnrollment", back_populates="student")
    lecture_progress = relationship("LectureProgress", back_populates="student")
    submissions = relationship("AssignmentSubmission", back_populates="student")
    
    # Role-specific record relationships (one-to-one)
    student_record = relationship("Student", back_populates="user", uselist=False)
    teacher_record = relationship("Teacher", back_populates="user", uselist=False)
    admin_record = relationship("Admin", back_populates="user", uselist=False)

    # Other relationships
    audit_logs = relationship("AuditLog", back_populates="user")
    notifications = relationship("Notification", back_populates="user")
    face_encodings = relationship("FaceEncoding", back_populates="user")
    course_reviews = relationship("CourseReview", back_populates="student")

    def __repr__(self):
        return f"<User(id={self.id}, email='{self.email}', role='{self.role}')>"


# Export User class
__all__ = ["User"]
