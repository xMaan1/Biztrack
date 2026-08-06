"""
Teacher Model - Role-specific table for teachers
"""

from sqlalchemy import Column, Integer, String, Enum, Date, ForeignKey, TIMESTAMP
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from ..core.database import Base


class Teacher(Base):
    __tablename__ = "teachers"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    employee_number = Column(String(50), nullable=True, comment="Official employee ID number")
    hire_date = Column(Date, nullable=True, comment="Date of hire")
    specialization = Column(String(255), nullable=True, comment="Area of specialization")
    employment_type = Column(
        Enum("full_time", "part_time", "contract", "visiting", name="employment_type_enum"),
        default="full_time",
        server_default="full_time",
    )
    created_at = Column(TIMESTAMP, server_default=func.current_timestamp())
    updated_at = Column(
        TIMESTAMP,
        server_default=func.current_timestamp(),
        onupdate=func.current_timestamp(),
    )

    # Relationships
    user = relationship("User", back_populates="teacher_record")

    def __repr__(self):
        return f"<Teacher(id={self.id}, user_id={self.user_id}, employee_number='{self.employee_number}')>"


__all__ = ["Teacher"]
