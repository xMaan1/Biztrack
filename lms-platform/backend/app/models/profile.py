"""
User Profile Model
"""

from sqlalchemy import Column, Integer, String, Text, TIMESTAMP, ForeignKey, Enum, Date
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from ..core.database import Base


class UserProfile(Base):
    __tablename__ = "user_profiles"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    middle_name = Column(String(100), nullable=True)
    date_of_birth = Column(Date, nullable=True)
    gender = Column(Enum("male", "female", "other"), nullable=True)
    phone = Column(String(20), nullable=True)
    address = Column(Text, nullable=True)
    city = Column(String(100), nullable=True)
    state = Column(String(100), nullable=True)
    postal_code = Column(String(20), nullable=True)
    country = Column(String(100), default="Pakistan")
    profile_picture_url = Column(String(500), nullable=True)
    bio = Column(Text, nullable=True)
    employee_id = Column(String(50), nullable=True)
    student_id = Column(String(50), nullable=True)
    emergency_contact_name = Column(String(200), nullable=True)
    emergency_contact_phone = Column(String(20), nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.current_timestamp())
    updated_at = Column(
        TIMESTAMP,
        server_default=func.current_timestamp(),
        onupdate=func.current_timestamp()
    )

    # Relationships
    user = relationship("User", back_populates="profile")

    @property
    def full_name(self):
        if self.middle_name:
            return f"{self.first_name} {self.middle_name} {self.last_name}"
        return f"{self.first_name} {self.last_name}"

    def __repr__(self):
        return f"<UserProfile(id={self.id}, user_id={self.user_id}, name='{self.full_name}')>"


__all__ = ["UserProfile"]


__all__ = ["UserProfile"]