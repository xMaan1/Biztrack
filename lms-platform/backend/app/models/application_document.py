"""
Application Document Model
"""

from sqlalchemy import Column, Integer, String, BigInteger, TIMESTAMP, Enum
from sqlalchemy.sql import func

from ..core.database import Base


class ApplicationDocument(Base):
    __tablename__ = "application_documents"

    id = Column(Integer, primary_key=True, autoincrement=True)
    application_type = Column(Enum('teacher', 'student', name='app_doc_type'), nullable=False)
    application_id = Column(Integer, nullable=False)
    document_type = Column(String(50), nullable=False)
    file_name = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_size = Column(BigInteger, default=0)
    mime_type = Column(String(100), nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.current_timestamp())

    def __repr__(self):
        return f"<ApplicationDocument(id={self.id}, type='{self.document_type}', app='{self.application_type}:{self.application_id}')>"


__all__ = ["ApplicationDocument"]
