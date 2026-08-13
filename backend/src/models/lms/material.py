import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime, Boolean, BigInteger, ForeignKey, Index
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from ...config.database_config import Base


class LectureMaterial(Base):
    __tablename__ = "lms_lecture_materials"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    lecture_id = Column(UUID(as_uuid=True), ForeignKey("lms_lectures.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    file_name = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_size = Column(BigInteger, nullable=False)
    mime_type = Column(String(100), nullable=False)
    is_downloadable = Column(Boolean, default=True)
    deleted_at = Column(DateTime, nullable=True)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        Index("ix_lms_lecture_materials_tenant_id", "tenant_id"),
        Index("ix_lms_lecture_materials_lecture", "lecture_id"),
    )

    tenant = relationship("Tenant")
    lecture = relationship("Lecture", back_populates="materials")
