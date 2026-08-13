import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime, Boolean, Integer, ForeignKey, Index
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from ...config.database_config import Base


class Lecture(Base):
    __tablename__ = "lms_lectures"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    course_id = Column(UUID(as_uuid=True), ForeignKey("lms_courses.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    lecture_number = Column(Integer, nullable=False)
    video_url = Column(String(500))
    video_duration = Column(Integer)
    thumbnail_url = Column(String(500))
    is_published = Column(Boolean, default=False)
    is_free_preview = Column(Boolean, default=False)
    order_index = Column(Integer, nullable=False, default=0)
    deleted_at = Column(DateTime, nullable=True)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        Index("ix_lms_lectures_tenant_id", "tenant_id"),
        Index("ix_lms_lectures_course", "course_id"),
        Index("ix_lms_lectures_order", "course_id", "order_index"),
        Index("ix_lms_lectures_published", "is_published"),
    )

    tenant = relationship("Tenant")
    course = relationship("Course", back_populates="lectures")
    materials = relationship("LectureMaterial", back_populates="lecture", passive_deletes=True)
    progress = relationship("LectureProgress", back_populates="lecture", passive_deletes=True)
