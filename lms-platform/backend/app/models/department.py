"""
Department Model
"""

from sqlalchemy import Column, Integer, String, Text, TIMESTAMP, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from ..core.database import Base


class Department(Base):
    __tablename__ = "departments"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), unique=True, nullable=False)
    code = Column(String(20), unique=True, nullable=False)
    description = Column(Text, nullable=True)
    head_teacher_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.current_timestamp())
    updated_at = Column(
        TIMESTAMP,
        server_default=func.current_timestamp(),
        onupdate=func.current_timestamp()
    )

    # Relationships
    head_teacher = relationship("User", foreign_keys=[head_teacher_id], backref="headed_departments")
    users = relationship("User", foreign_keys="User.department_id", back_populates="department")
    courses = relationship("Course", back_populates="department")

    def __repr__(self):
        return f"<Department(id={self.id}, name='{self.name}', code='{self.code}')>"


# ✅ Export Department class
__all__ = ["Department"]