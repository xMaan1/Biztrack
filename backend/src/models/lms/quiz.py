import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime, Boolean, Integer, Numeric, ForeignKey, Index
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from ...config.database_config import Base


class Quiz(Base):
    __tablename__ = "lms_quizzes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    course_id = Column(UUID(as_uuid=True), ForeignKey("lms_courses.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    duration_minutes = Column(Integer, nullable=False)
    passing_score = Column(Numeric(5, 2), default=60)
    is_published = Column(Boolean, default=False)
    deleted_at = Column(DateTime, nullable=True)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        Index("ix_lms_quizzes_tenant_id", "tenant_id"),
        Index("ix_lms_quizzes_course", "course_id"),
        Index("ix_lms_quizzes_published", "is_published"),
    )

    tenant = relationship("Tenant")
    course = relationship("Course", back_populates="quizzes")
