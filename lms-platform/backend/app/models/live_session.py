from sqlalchemy import Column, Integer, String, Text, Boolean, TIMESTAMP, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..core.database import Base


class LiveSession(Base):
    __tablename__ = "live_sessions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    lecture_id = Column(Integer, ForeignKey("lectures.id"), nullable=True)
    teacher_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    session_code = Column(String(20), unique=True, nullable=False)
    status = Column(String(20), default="scheduled")  # scheduled, active, ended
    participant_ids = Column(JSON, nullable=True)
    invite_teachers = Column(JSON, nullable=True)
    invite_admins = Column(JSON, nullable=True)
    started_at = Column(TIMESTAMP, nullable=True)
    ended_at = Column(TIMESTAMP, nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.current_timestamp())
    updated_at = Column(TIMESTAMP, server_default=func.current_timestamp(), onupdate=func.current_timestamp())

    course = relationship("Course")
    lecture = relationship("Lecture")
    teacher = relationship("User")

    def __repr__(self):
        return f"<LiveSession(id={self.id}, title='{self.title}', code='{self.session_code}')>"


__all__ = ["LiveSession"]
