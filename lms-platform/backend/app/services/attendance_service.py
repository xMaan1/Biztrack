"""
Attendance Service
Handles attendance session management, QR code generation, and record keeping
"""

import hashlib
import json
import random
import string
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import and_, func

from ..core.exceptions import NotFoundError, ConflictError, ValidationError
from ..models import AttendanceSession, AttendanceRecord, Course, User
from ..schemas.attendance import (
    AttendanceSessionCreate,
    AttendanceSessionUpdate,
    AttendanceRecordCreate,
    AttendanceRecordUpdate,
)


class AttendanceService:
    """Attendance management service"""

    @staticmethod
    def generate_qr_code_token(session_id: int) -> str:
        """
        Generate a unique QR code token for attendance session
        """
        # Combine session ID with random string and timestamp
        timestamp = datetime.now().isoformat()
        random_string = ''.join(random.choices(string.ascii_letters + string.digits, k=16))
        raw_token = f"{session_id}:{timestamp}:{random_string}"
        
        # Hash to create unique token
        token = hashlib.sha256(raw_token.encode()).hexdigest()
        return token

    @staticmethod
    def get_session_by_id(
        db: Session,
        session_id: int,
        include_deleted: bool = False
    ) -> Optional[AttendanceSession]:
        """Get attendance session by ID"""
        query = db.query(AttendanceSession).filter(AttendanceSession.id == session_id)
        if not include_deleted:
            query = query.filter(AttendanceSession.deleted_at.is_(None))
        return query.first()

    @staticmethod
    def get_session_by_qr(
        db: Session,
        qr_code: str
    ) -> Optional[AttendanceSession]:
        """Get attendance session by QR code"""
        return db.query(AttendanceSession).filter(
            AttendanceSession.qr_code == qr_code,
            AttendanceSession.qr_expires_at > datetime.now(),
            AttendanceSession.deleted_at.is_(None)
        ).first()

    @staticmethod
    def create_attendance_session(
        db: Session,
        session_data: AttendanceSessionCreate
    ) -> AttendanceSession:
        """
        Create a new attendance session
        """
        # Check if course exists
        course = db.query(Course).filter(
            Course.id == session_data.course_id,
            Course.deleted_at.is_(None)
        ).first()
        if not course:
            raise NotFoundError("Course not found", resource_type="Course", resource_id=session_data.course_id)

        # Check if teacher exists
        teacher = db.query(User).filter(
            User.id == session_data.teacher_id,
            User.deleted_at.is_(None)
        ).first()
        if not teacher:
            raise NotFoundError("Teacher not found", resource_type="User", resource_id=session_data.teacher_id)

        # Create session
        session = AttendanceSession(**session_data.dict())

        db.add(session)
        db.flush()

        # Generate QR code after flush so session.id is available
        if session_data.manual_attendance_allowed:
            session.qr_code = AttendanceService.generate_qr_code_token(session.id)
            session.qr_expires_at = datetime.now() + timedelta(minutes=5)

        db.commit()
        db.refresh(session)

        return session

    @staticmethod
    def update_attendance_session(
        db: Session,
        session_id: int,
        session_data: AttendanceSessionUpdate
    ) -> AttendanceSession:
        """
        Update an attendance session
        """
        session = AttendanceService.get_session_by_id(db, session_id)
        if not session:
            raise NotFoundError("Attendance session not found", resource_type="AttendanceSession", resource_id=session_id)

        # Update fields
        update_dict = session_data.dict(exclude_unset=True)
        for field, value in update_dict.items():
            if value is not None:
                setattr(session, field, value)

        # Regenerate QR code if requested
        if session_data.manual_attendance_allowed and not session.qr_code:
            session.qr_code = AttendanceService.generate_qr_code_token(session.id)
            session.qr_expires_at = datetime.now() + timedelta(minutes=5)

        db.commit()
        db.refresh(session)

        return session

    @staticmethod
    def regenerate_qr_code(
        db: Session,
        session_id: int
    ) -> str:
        """
        Regenerate QR code for a session
        """
        session = AttendanceService.get_session_by_id(db, session_id)
        if not session:
            raise NotFoundError("Attendance session not found", resource_type="AttendanceSession", resource_id=session_id)

        session.qr_code = AttendanceService.generate_qr_code_token(session.id)
        session.qr_expires_at = datetime.now() + timedelta(minutes=5)

        db.commit()

        return session.qr_code

    @staticmethod
    def mark_attendance(
        db: Session,
        record_data: AttendanceRecordCreate
    ) -> AttendanceRecord:
        """
        Mark attendance for a student
        """
        # Check if session exists and is valid
        session = AttendanceService.get_session_by_id(db, record_data.session_id)
        if not session:
            raise NotFoundError("Attendance session not found", resource_type="AttendanceSession", resource_id=record_data.session_id)

        # Check if student exists
        student = db.query(User).filter(
            User.id == record_data.student_id,
            User.deleted_at.is_(None)
        ).first()
        if not student:
            raise NotFoundError("Student not found", resource_type="User", resource_id=record_data.student_id)

        # Check if attendance already marked
        existing = db.query(AttendanceRecord).filter(
            AttendanceRecord.session_id == record_data.session_id,
            AttendanceRecord.student_id == record_data.student_id
        ).first()

        if existing:
            raise ConflictError("Attendance already marked for this student")

        # Create attendance record
        record = AttendanceRecord(
            **record_data.dict(),
            check_in_time=datetime.now(),
        )

        db.add(record)
        db.commit()
        db.refresh(record)

        return record

    @staticmethod
    def update_attendance_record(
        db: Session,
        record_id: int,
        record_data: AttendanceRecordUpdate
    ) -> AttendanceRecord:
        """
        Update an attendance record
        """
        record = db.query(AttendanceRecord).filter(AttendanceRecord.id == record_id).first()
        if not record:
            raise NotFoundError("Attendance record not found", resource_type="AttendanceRecord", resource_id=record_id)

        # Update fields
        update_dict = record_data.dict(exclude_unset=True)
        for field, value in update_dict.items():
            if value is not None:
                setattr(record, field, value)

        db.commit()
        db.refresh(record)

        return record

    @staticmethod
    def get_session_records(
        db: Session,
        session_id: int,
        status: Optional[str] = None
    ) -> List[AttendanceRecord]:
        """
        Get all attendance records for a session
        """
        query = db.query(AttendanceRecord).filter(
            AttendanceRecord.session_id == session_id
        )

        if status:
            query = query.filter(AttendanceRecord.status == status)

        return query.order_by(AttendanceRecord.student_id).all()

    @staticmethod
    def get_student_attendance_summary(
        db: Session,
        student_id: int,
        course_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Get attendance summary for a student
        """
        query = db.query(AttendanceRecord).filter(
            AttendanceRecord.student_id == student_id
        )

        if course_id:
            query = query.join(AttendanceSession).filter(
                AttendanceSession.course_id == course_id
            )

        total = query.count()
        present = query.filter(AttendanceRecord.status == 'present').count()
        absent = query.filter(AttendanceRecord.status == 'absent').count()
        late = query.filter(AttendanceRecord.status == 'late').count()
        excused = query.filter(AttendanceRecord.status == 'excused').count()

        attendance_percentage = (present + late) / total * 100 if total > 0 else 0

        return {
            "student_id": student_id,
            "total_sessions": total,
            "present": present,
            "absent": absent,
            "late": late,
            "excused": excused,
            "attendance_percentage": round(attendance_percentage, 2),
        }

    @staticmethod
    def get_course_attendance_summary(
        db: Session,
        course_id: int
    ) -> Dict[str, Any]:
        """
        Get attendance summary for a course
        """
        sessions = db.query(AttendanceSession).filter(
            AttendanceSession.course_id == course_id,
            AttendanceSession.deleted_at.is_(None)
        ).count()

        # Get total students enrolled
        from ..models import CourseEnrollment
        students = db.query(CourseEnrollment).filter(
            CourseEnrollment.course_id == course_id,
            CourseEnrollment.status == 'active'
        ).count()

        # Get attendance records
        records = db.query(AttendanceRecord).join(
            AttendanceSession
        ).filter(
            AttendanceSession.course_id == course_id
        )

        total_records = records.count()
        present = records.filter(AttendanceRecord.status == 'present').count()
        absent = records.filter(AttendanceRecord.status == 'absent').count()
        late = records.filter(AttendanceRecord.status == 'late').count()
        excused = records.filter(AttendanceRecord.status == 'excused').count()

        return {
            "course_id": course_id,
            "total_sessions": sessions,
            "total_students": students,
            "total_attendance_records": total_records,
            "present": present,
            "absent": absent,
            "late": late,
            "excused": excused,
            "average_attendance": round((present + late) / total_records * 100, 2) if total_records > 0 else 0,
        }