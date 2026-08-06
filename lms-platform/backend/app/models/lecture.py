"""
Lecture Model
"""

from sqlalchemy import Column, Integer, String, Text, Boolean, TIMESTAMP, ForeignKey, DECIMAL, Sequence
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from ..core.database import Base


class Lecture(Base):
    __tablename__ = "lectures"

    id = Column(Integer, primary_key=True, autoincrement=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    lecture_number = Column(Integer, nullable=False)
    video_url = Column(String(500), nullable=True)
    video_duration = Column(Integer, nullable=True)  # Duration in seconds
    thumbnail_url = Column(String(500), nullable=True)
    is_published = Column(Boolean, default=False)
    is_free_preview = Column(Boolean, default=False)
    order_index = Column(Integer, nullable=False, default=0)
    created_at = Column(TIMESTAMP, server_default=func.current_timestamp())
    updated_at = Column(
        TIMESTAMP,
        server_default=func.current_timestamp(),
        onupdate=func.current_timestamp()
    )
    deleted_at = Column(TIMESTAMP, nullable=True)

    # Relationships
    course = relationship("Course", back_populates="lectures")
    materials = relationship("LectureMaterial", back_populates="lecture")
    progress = relationship("LectureProgress", back_populates="lecture")

    def __repr__(self):
        return f"<Lecture(id={self.id}, title='{self.title}', course_id={self.course_id})>"


__all__ = ["Lecture"]


__all__ = ["Lecture"]