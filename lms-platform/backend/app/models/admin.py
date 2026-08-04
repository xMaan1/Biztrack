"""
Admin Model - Role-specific table for admins
"""

from sqlalchemy import Column, Integer, String, Enum, ForeignKey, TIMESTAMP
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from ..core.database import Base


class Admin(Base):
    __tablename__ = "admins"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    employee_number = Column(String(50), nullable=True, comment="Official employee ID number")
    admin_level = Column(
        Enum("super", "regular", name="admin_level_enum"),
        default="regular",
        server_default="regular",
    )
    created_at = Column(TIMESTAMP, server_default=func.current_timestamp())
    updated_at = Column(
        TIMESTAMP,
        server_default=func.current_timestamp(),
        onupdate=func.current_timestamp(),
    )

    # Relationships
    user = relationship("User", back_populates="admin_record")

    def __repr__(self):
        return f"<Admin(id={self.id}, user_id={self.user_id}, admin_level='{self.admin_level}')>"


__all__ = ["Admin"]
