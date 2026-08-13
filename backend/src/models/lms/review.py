import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime, Boolean, Integer, ForeignKey, Index
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from ...config.database_config import Base


class CourseReview(Base):
    __tablename__ = "lms_course_reviews"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    course_id = Column(UUID(as_uuid=True), ForeignKey("lms_courses.id", ondelete="CASCADE"), nullable=False)
    student_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    rating = Column(Integer, nullable=False)
    review = Column(Text)
    is_approved = Column(Boolean, default=False)
    deleted_at = Column(DateTime, nullable=True)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        Index("ix_lms_course_reviews_tenant_id", "tenant_id"),
        Index("ix_lms_course_reviews_course_student", "course_id", "student_id", unique=True),
        Index("ix_lms_course_reviews_rating", "rating"),
        Index("ix_lms_course_reviews_approved", "is_approved"),
    )

    tenant = relationship("Tenant")
    course = relationship("Course", back_populates="reviews")
    student = relationship("User", foreign_keys=[student_id])
