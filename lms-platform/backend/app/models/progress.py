"""
Lecture Progress Model
"""

from sqlalchemy import Column, Integer, Boolean, TIMESTAMP, ForeignKey, DECIMAL
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from ..core.database import Base


class LectureProgress(Base):
    __tablename__ = "lecture_progress"

    id = Column(Integer, primary_key=True, autoincrement=True)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    lecture_id = Column(Integer, ForeignKey("lectures.id"), nullable=False)
    progress_percentage = Column(DECIMAL(5, 2), default=0.00)
    is_completed = Column(Boolean, default=False)
    last_watched_at = Column(TIMESTAMP, nullable=True)
    watch_time_seconds = Column(Integer, default=0)
    completed_at = Column(TIMESTAMP, nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.current_timestamp())
    updated_at = Column(
        TIMESTAMP,
        server_default=func.current_timestamp(),
        onupdate=func.current_timestamp()
    )

    # Relationships
    student = relationship("User", foreign_keys=[student_id], back_populates="lecture_progress")
    lecture = relationship("Lecture", back_populates="progress")

    def __repr__(self):
        return f"<LectureProgress(id={self.id}, student_id={self.student_id}, lecture_id={self.lecture_id})>"


__all__ = ["LectureProgress"]