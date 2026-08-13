import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from ...config.database_config import Base


class Department(Base):
    __tablename__ = "lms_departments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(100), nullable=False)
    code = Column(String(20), nullable=False)
    description = Column(Text)
    head_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        Index("ix_lms_departments_tenant_name", "tenant_id", "name", unique=True),
        Index("ix_lms_departments_tenant_code", "tenant_id", "code", unique=True),
        Index("ix_lms_departments_tenant_id", "tenant_id"),
    )

    tenant = relationship("Tenant")
    head_user = relationship("User")
    courses = relationship("Course", back_populates="department", passive_deletes=True)
