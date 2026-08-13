import uuid
from datetime import datetime
from sqlalchemy import Column, DateTime, Boolean, Integer, Numeric, ForeignKey, Index
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from ...config.database_config import Base


class LectureProgress(Base):
    __tablename__ = "lms_lecture_progress"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    student_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    lecture_id = Column(UUID(as_uuid=True), ForeignKey("lms_lectures.id", ondelete="CASCADE"), nullable=False)
    progress_percentage = Column(Numeric(5, 2), default=0)
    is_completed = Column(Boolean, default=False)
    last_watched_at = Column(DateTime, nullable=True)
    watch_time_seconds = Column(Integer, default=0)
    completed_at = Column(DateTime, nullable=True)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        Index("ix_lms_lecture_progress_tenant_id", "tenant_id"),
        Index("ix_lms_lecture_progress_student_lecture", "student_id", "lecture_id", unique=True),
        Index("ix_lms_lecture_progress_student", "student_id"),
        Index("ix_lms_lecture_progress_lecture", "lecture_id"),
        Index("ix_lms_lecture_progress_completed", "is_completed"),
    )

    tenant = relationship("Tenant")
    student = relationship("User", foreign_keys=[student_id])
    lecture = relationship("Lecture", back_populates="progress")
