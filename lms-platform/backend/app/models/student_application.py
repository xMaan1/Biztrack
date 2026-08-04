"""
Student Application Model
"""

from sqlalchemy import Column, Integer, String, Text, TIMESTAMP, ForeignKey, Enum, Date, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from ..core.database import Base


class StudentApplication(Base):
    __tablename__ = "student_applications"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    status = Column(Enum('submitted', 'reviewed', 'selected', 'rejected', name='student_app_status'), nullable=False, server_default='submitted')

    # Personal Information
    full_name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=False)
    phone = Column(String(50), nullable=True)
    cnic_passport = Column(String(100), nullable=True)
    date_of_birth = Column(Date, nullable=True)
    gender = Column(Enum('male', 'female', 'other', name='student_app_gender'), nullable=True)
    address = Column(Text, nullable=True)
    city = Column(String(100), nullable=True)
    country = Column(String(100), nullable=True, server_default='Pakistan')

    # Academic Information
    current_qualification = Column(String(255), nullable=True)
    school_college_university = Column(String(255), nullable=True)
    previous_qualification = Column(String(255), nullable=True)
    field_of_study = Column(String(255), nullable=True)
    gpa_percentage = Column(String(50), nullable=True)

    # Learning Information
    interested_courses = Column(JSON, nullable=True)
    learning_category = Column(JSON, nullable=True)
    previous_experience = Column(Text, nullable=True)
    career_goals = Column(Text, nullable=True)
    learning_mode = Column(String(100), nullable=True)
    availability = Column(String(255), nullable=True)

    # Admin fields
    reviewed_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    reviewed_at = Column(TIMESTAMP, nullable=True)
    admin_remarks = Column(Text, nullable=True)
    rejection_reason = Column(Text, nullable=True)

    # Timestamps
    created_at = Column(TIMESTAMP, server_default=func.current_timestamp())
    updated_at = Column(TIMESTAMP, server_default=func.current_timestamp(), onupdate=func.current_timestamp())

    # Relationships
    user = relationship("User", foreign_keys=[user_id], backref="student_applications")
    reviewer = relationship("User", foreign_keys=[reviewed_by])
    documents = relationship("ApplicationDocument", primaryjoin="and_(ApplicationDocument.application_type=='student', foreign(ApplicationDocument.application_id)==StudentApplication.id)", viewonly=True)
    status_logs = relationship("ApplicationStatusLog", primaryjoin="and_(ApplicationStatusLog.application_type=='student', foreign(ApplicationStatusLog.application_id)==StudentApplication.id)", viewonly=True)

    def __repr__(self):
        return f"<StudentApplication(id={self.id}, user_id={self.user_id}, status='{self.status}')>"


__all__ = ["StudentApplication"]
