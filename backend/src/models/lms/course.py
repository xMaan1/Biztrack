import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime, Date, Boolean, Integer, ForeignKey, Index
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from ...config.database_config import Base


class Course(Base):
    __tablename__ = "lms_courses"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    code = Column(String(50), nullable=False)
    description = Column(Text)
    credits = Column(Integer, default=3)
    department_id = Column(UUID(as_uuid=True), ForeignKey("lms_departments.id"), nullable=False)
    teacher_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    semester = Column(String(20), nullable=False)
    academic_year = Column(String(20), nullable=False)
    max_students = Column(Integer, default=30)
    current_enrollment = Column(Integer, default=0)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    is_published = Column(Boolean, default=False)
    thumbnail_url = Column(String(500))
    syllabus_url = Column(String(500))
    deleted_at = Column(DateTime, nullable=True)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        Index("ix_lms_courses_tenant_code", "tenant_id", "code", unique=True),
        Index("ix_lms_courses_tenant_id", "tenant_id"),
        Index("ix_lms_courses_teacher", "teacher_id"),
        Index("ix_lms_courses_department", "department_id"),
        Index("ix_lms_courses_published", "is_published"),
    )

    tenant = relationship("Tenant")
    department = relationship("Department", back_populates="courses")
    teacher = relationship("User")
    lectures = relationship("Lecture", back_populates="course", passive_deletes=True)
    enrollments = relationship("Enrollment", back_populates="course", passive_deletes=True)
    reviews = relationship("CourseReview", back_populates="course", passive_deletes=True)
    quizzes = relationship("Quiz", back_populates="course", passive_deletes=True)
