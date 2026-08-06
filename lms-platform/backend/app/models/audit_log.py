"""
Audit Log Model
"""

from sqlalchemy import Column, Integer, String, TIMESTAMP, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from ..core.database import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    action = Column(String(100), nullable=False)  # CREATE, UPDATE, DELETE, LOGIN, LOGOUT, VIEW
    resource_type = Column(String(50), nullable=False)  # user, course, lecture, assignment, etc.
    resource_id = Column(Integer, nullable=True)
    old_values = Column(JSON, nullable=True)
    new_values = Column(JSON, nullable=True)
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(Text, nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.current_timestamp())

    # Relationships
    user = relationship("User", back_populates="audit_logs")

    def __repr__(self):
        return f"<AuditLog(id={self.id}, action='{self.action}', resource_type='{self.resource_type}')>"


__all__ = ["AuditLog"]