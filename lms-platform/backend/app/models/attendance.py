"""
Attendance Models
"""

from sqlalchemy import Column, Integer, String, TIMESTAMP, ForeignKey, Enum, Date, Time, DECIMAL, Boolean, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from ..core.database import Base


class AttendanceSession(Base):
    __tablename__ = "attendance_sessions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    teacher_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    session_title = Column(String(255), nullable=False)
    session_date = Column(Date, nullable=False)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    session_type = Column(
        Enum("lecture", "lab", "tutorial", "exam"),
        default="lecture"
    )
    qr_code = Column(String(255), unique=True, nullable=True)
    qr_expires_at = Column(TIMESTAMP, nullable=True)
    manual_attendance_allowed = Column(Boolean, default=True)
    face_recognition_enabled = Column(Boolean, default=False)
    location = Column(String(255), nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.current_timestamp())
    updated_at = Column(
        TIMESTAMP,
        server_default=func.current_timestamp(),
        onupdate=func.current_timestamp()
    )
    deleted_at = Column(TIMESTAMP, nullable=True)

    # Relationships
    course = relationship("Course", back_populates="attendance_sessions")
    teacher = relationship("User", foreign_keys=[teacher_id])
    records = relationship("AttendanceRecord", back_populates="session")

    def __repr__(self):
        return f"<AttendanceSession(id={self.id}, title='{self.session_title}', course_id={self.course_id})>"


class AttendanceRecord(Base):
    __tablename__ = "attendance_records"

    id = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(Integer, ForeignKey("attendance_sessions.id"), nullable=False)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(
        Enum("present", "absent", "late", "excused"),
        default="absent"
    )
    check_in_time = Column(TIMESTAMP, nullable=True)
    check_out_time = Column(TIMESTAMP, nullable=True)
    verification_method = Column(
        Enum("manual", "qr_scan", "face_recognition", "auto"),
        default="manual"
    )
    face_match_confidence = Column(DECIMAL(5, 2), nullable=True)
    location_lat = Column(DECIMAL(10, 8), nullable=True)
    location_lng = Column(DECIMAL(11, 8), nullable=True)
    remarks = Column(Text, nullable=True)
    marked_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.current_timestamp())
    updated_at = Column(
        TIMESTAMP,
        server_default=func.current_timestamp(),
        onupdate=func.current_timestamp()
    )

    # Relationships
    session = relationship("AttendanceSession", back_populates="records")
    student = relationship("User", foreign_keys=[student_id])
    marker = relationship("User", foreign_keys=[marked_by])

    def __repr__(self):
        return f"<AttendanceRecord(id={self.id}, session_id={self.session_id}, student_id={self.student_id}, status='{self.status}')>"


# ✅ Yeh add karein - Export both classes
__all__ = ["AttendanceSession", "AttendanceRecord"]