"""
Teacher Application Model
"""

from sqlalchemy import Column, Integer, String, Text, Boolean, TIMESTAMP, ForeignKey, Enum, Date, Numeric, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from ..core.database import Base


class TeacherApplication(Base):
    __tablename__ = "teacher_applications"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    status = Column(Enum('submitted', 'reviewed', 'selected', 'rejected', name='teacher_app_status'), nullable=False, server_default='submitted')

    # Personal Information
    full_name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=False)
    phone = Column(String(50), nullable=True)
    cnic = Column(String(50), nullable=True)
    date_of_birth = Column(Date, nullable=True)
    gender = Column(Enum('male', 'female', 'other', name='teacher_app_gender'), nullable=True)
    address = Column(Text, nullable=True)
    city = Column(String(100), nullable=True)
    country = Column(String(100), nullable=True, server_default='Pakistan')

    # Professional Information
    highest_qualification = Column(String(255), nullable=True)
    university = Column(String(255), nullable=True)
    degree = Column(String(255), nullable=True)
    specialization = Column(String(255), nullable=True)
    teaching_experience = Column(String(100), nullable=True)
    current_job = Column(String(255), nullable=True)
    skills = Column(JSON, nullable=True)
    languages = Column(JSON, nullable=True)
    linkedin = Column(String(500), nullable=True)
    portfolio_website = Column(String(500), nullable=True)

    # Teaching Information
    subjects = Column(JSON, nullable=True)
    categories = Column(JSON, nullable=True)
    online_teaching_experience = Column(String(100), nullable=True)
    offline_teaching_experience = Column(String(100), nullable=True)
    expected_salary = Column(Numeric(10, 2), nullable=True)
    available_days = Column(String(255), nullable=True)
    available_time = Column(String(255), nullable=True)
    teaching_statement = Column(Text, nullable=True)

    # Admin fields
    reviewed_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    reviewed_at = Column(TIMESTAMP, nullable=True)
    admin_remarks = Column(Text, nullable=True)
    rejection_reason = Column(Text, nullable=True)

    # Timestamps
    created_at = Column(TIMESTAMP, server_default=func.current_timestamp())
    updated_at = Column(TIMESTAMP, server_default=func.current_timestamp(), onupdate=func.current_timestamp())

    # Relationships
    user = relationship("User", foreign_keys=[user_id], backref="teacher_applications")
    reviewer = relationship("User", foreign_keys=[reviewed_by])
    documents = relationship("ApplicationDocument", primaryjoin="and_(ApplicationDocument.application_type=='teacher', foreign(ApplicationDocument.application_id)==TeacherApplication.id)", viewonly=True)
    status_logs = relationship("ApplicationStatusLog", primaryjoin="and_(ApplicationStatusLog.application_type=='teacher', foreign(ApplicationStatusLog.application_id)==TeacherApplication.id)", viewonly=True)

    def __repr__(self):
        return f"<TeacherApplication(id={self.id}, user_id={self.user_id}, status='{self.status}')>"


__all__ = ["TeacherApplication"]
