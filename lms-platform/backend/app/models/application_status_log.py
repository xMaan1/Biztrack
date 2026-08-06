"""
Application Status Log Model
"""

from sqlalchemy import Column, Integer, String, Text, TIMESTAMP, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from ..core.database import Base


class ApplicationStatusLog(Base):
    __tablename__ = "application_status_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    application_type = Column(Enum('teacher', 'student', name='app_log_type'), nullable=False)
    application_id = Column(Integer, nullable=False)
    old_status = Column(String(20), nullable=True)
    new_status = Column(String(20), nullable=False)
    changed_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    remarks = Column(Text, nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.current_timestamp())

    # Relationships
    changer = relationship("User", foreign_keys=[changed_by])

    def __repr__(self):
        return f"<ApplicationStatusLog(id={self.id}, type='{self.application_type}', status='{self.old_status}->{self.new_status}')>"


__all__ = ["ApplicationStatusLog"]
