"""
Face Encoding Model
"""

from sqlalchemy import Column, Integer, String, Boolean, TIMESTAMP, ForeignKey, JSON, DECIMAL
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from ..core.database import Base


class FaceEncoding(Base):
    __tablename__ = "face_encodings"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    encoding_data = Column(JSON, nullable=False)  # Face encoding vector as JSON array
    image_path = Column(String(500), nullable=False)  # Path to reference image
    confidence_threshold = Column(DECIMAL(5, 2), default=0.60)
    is_active = Column(Boolean, default=True)
    created_at = Column(TIMESTAMP, server_default=func.current_timestamp())
    updated_at = Column(
        TIMESTAMP,
        server_default=func.current_timestamp(),
        onupdate=func.current_timestamp()
    )

    # Relationships
    user = relationship("User", back_populates="face_encodings")

    def __repr__(self):
        return f"<FaceEncoding(id={self.id}, user_id={self.user_id}, is_active={self.is_active})>"


__all__ = ["FaceEncoding"]