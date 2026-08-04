"""
Lecture Material Model
"""

from sqlalchemy import Column, Integer, String, Boolean, TIMESTAMP, ForeignKey, BigInteger
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from ..core.database import Base


class LectureMaterial(Base):
    __tablename__ = "lecture_materials"

    id = Column(Integer, primary_key=True, autoincrement=True)
    lecture_id = Column(Integer, ForeignKey("lectures.id"), nullable=False)
    title = Column(String(255), nullable=False)
    file_name = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_size = Column(BigInteger, nullable=False)  # Size in bytes
    mime_type = Column(String(100), nullable=False)
    is_downloadable = Column(Boolean, default=True)
    created_at = Column(TIMESTAMP, server_default=func.current_timestamp())
    updated_at = Column(
        TIMESTAMP,
        server_default=func.current_timestamp(),
        onupdate=func.current_timestamp()
    )
    deleted_at = Column(TIMESTAMP, nullable=True)

    # Relationships
    lecture = relationship("Lecture", back_populates="materials")

    def __repr__(self):
        return f"<LectureMaterial(id={self.id}, title='{self.title}', lecture_id={self.lecture_id})>"


__all__ = ["LectureMaterial"]