import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Numeric, ForeignKey, Index
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from ...config.database_config import Base


class Enrollment(Base):
    __tablename__ = "lms_course_enrollments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    course_id = Column(UUID(as_uuid=True), ForeignKey("lms_courses.id", ondelete="CASCADE"), nullable=False)
    student_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    status = Column(String(20), default="pending")
    grade = Column(String(5))
    grade_points = Column(Numeric(3, 2))
    completion_percentage = Column(Numeric(5, 2), default=0)
    dropped_at = Column(DateTime, nullable=True)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        Index("ix_lms_course_enrollments_tenant_id", "tenant_id"),
        Index("ix_lms_course_enrollments_course_student", "course_id", "student_id", unique=True),
        Index("ix_lms_course_enrollments_status", "status"),
    )

    tenant = relationship("Tenant")
    course = relationship("Course", back_populates="enrollments")
    student = relationship("User", foreign_keys=[student_id])
