"""
Attendance Router
Handles attendance session management and record keeping
"""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from datetime import datetime, timedelta

from ....core.database import get_db_session
from ....core.security import get_current_user
from ....core.dependencies import require_teacher, require_student, require_teacher_or_student, require_admin
from ....core.exceptions import NotFoundError, ConflictError, ValidationError
from ....schemas.attendance import (
    AttendanceSessionCreate,
    AttendanceSessionUpdate,
    AttendanceSessionResponse,
    AttendanceRecordCreate,
    AttendanceRecordResponse,
    QRCodeResponse,
)
from ....schemas.common import ResponseWrapper
from ....services.attendance_service import AttendanceService
from ....models import AttendanceRecord, AttendanceSession

router = APIRouter()


@router.get("/sessions", response_model=ResponseWrapper)
async def get_attendance_sessions(
    course_id: Optional[int] = Query(None, description="Filter by course"),
    date_from: Optional[datetime] = Query(None, description="Date from"),
    date_to: Optional[datetime] = Query(None, description="Date to"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    db: Session = Depends(get_db_session),
    current_user: dict = Depends(require_teacher_or_student)
):
    """
    Get attendance sessions with filters and pagination
    """
    skip = (page - 1) * page_size
    
    # Build query
    query = db.query(AttendanceSession).filter(
        AttendanceSession.deleted_at.is_(None)
    )
    
    if course_id:
        query = query.filter(AttendanceSession.course_id == course_id)
    
    if date_from:
        query = query.filter(AttendanceSession.session_date >= date_from)
    
    if date_to:
        query = query.filter(AttendanceSession.session_date <= date_to)
    
    # If student, only show sessions for their courses
    if current_user.get("role") == "student":
        from ....models import CourseEnrollment
        enrolled_courses = db.query(CourseEnrollment.course_id).filter(
            CourseEnrollment.student_id == current_user["user_id"],
            CourseEnrollment.status == "active"
        ).subquery()
        query = query.filter(AttendanceSession.course_id.in_(enrolled_courses))
    
    total = query.count()
    sessions = query.offset(skip).limit(page_size).order_by(
        AttendanceSession.session_date.desc()
    ).all()
    
    # Convert to response
    session_responses = []
    for session in sessions:
        # Get stats
        total_students = db.query(AttendanceRecord).filter(
            AttendanceRecord.session_id == session.id
        ).count()
        
        present_count = db.query(AttendanceRecord).filter(
            AttendanceRecord.session_id == session.id,
            AttendanceRecord.status == "present"
        ).count()
        
        absent_count = db.query(AttendanceRecord).filter(
            AttendanceRecord.session_id == session.id,
            AttendanceRecord.status == "absent"
        ).count()
        
        session_responses.append(AttendanceSessionResponse(
            id=session.id,
            course_id=session.course_id,
            course_title=session.course.title if session.course else None,
            teacher_id=session.teacher_id,
            teacher_name=session.teacher.profile.full_name if session.teacher and session.teacher.profile else None,
            session_title=session.session_title,
            session_date=session.session_date,
            start_time=session.start_time,
            end_time=session.end_time,
            session_type=session.session_type,
            qr_code=session.qr_code,
            qr_expires_at=session.qr_expires_at,
            manual_attendance_allowed=session.manual_attendance_allowed,
            face_recognition_enabled=session.face_recognition_enabled,
            location=session.location,
            created_at=session.created_at,
            updated_at=session.updated_at,
            total_students=total_students,
            present_count=present_count,
            absent_count=absent_count
        ))
    
    total_pages = (total + page_size - 1) // page_size
    
    return ResponseWrapper(
        success=True,
        message="Attendance sessions retrieved successfully",
        data={
            "sessions": session_responses,
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": total_pages
        }
    )


@router.post("/sessions", response_model=ResponseWrapper)
async def create_attendance_session(
    session_data: AttendanceSessionCreate,
    db: Session = Depends(get_db_session),
    current_user: dict = Depends(require_teacher)
):
    """
    Create a new attendance session (Teacher/Admin only)
    """
    try:
        session = AttendanceService.create_attendance_session(db, session_data)
        
        return ResponseWrapper(
            success=True,
            message="Attendance session created successfully",
            data=AttendanceSessionResponse(
                id=session.id,
                course_id=session.course_id,
                course_title=session.course.title if session.course else None,
                teacher_id=session.teacher_id,
                teacher_name=session.teacher.profile.full_name if session.teacher and session.teacher.profile else None,
                session_title=session.session_title,
                session_date=session.session_date,
                start_time=session.start_time,
                end_time=session.end_time,
                session_type=session.session_type,
                qr_code=session.qr_code,
                qr_expires_at=session.qr_expires_at,
                manual_attendance_allowed=session.manual_attendance_allowed,
                face_recognition_enabled=session.face_recognition_enabled,
                location=session.location,
                created_at=session.created_at,
                updated_at=session.updated_at,
                total_students=0,
                present_count=0,
                absent_count=0
            )
        )
    except NotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": {"code": "NOT_FOUND", "message": str(e)}}
        )


@router.get("/sessions/{session_id}", response_model=ResponseWrapper)
async def get_attendance_session(
    session_id: int,
    db: Session = Depends(get_db_session),
    current_user: dict = Depends(require_teacher_or_student)
):
    """
    Get attendance session details by ID
    """
    try:
        session = AttendanceService.get_session_by_id(db, session_id)
        if not session:
            raise NotFoundError("Attendance session not found", resource_type="AttendanceSession", resource_id=session_id)
        
        # Get stats
        total_students = db.query(AttendanceRecord).filter(
            AttendanceRecord.session_id == session.id
        ).count()
        
        present_count = db.query(AttendanceRecord).filter(
            AttendanceRecord.session_id == session.id,
            AttendanceRecord.status == "present"
        ).count()
        
        absent_count = db.query(AttendanceRecord).filter(
            AttendanceRecord.session_id == session.id,
            AttendanceRecord.status == "absent"
        ).count()
        
        return ResponseWrapper(
            success=True,
            message="Attendance session retrieved successfully",
            data=AttendanceSessionResponse(
                id=session.id,
                course_id=session.course_id,
                course_title=session.course.title if session.course else None,
                teacher_id=session.teacher_id,
                teacher_name=session.teacher.profile.full_name if session.teacher and session.teacher.profile else None,
                session_title=session.session_title,
                session_date=session.session_date,
                start_time=session.start_time,
                end_time=session.end_time,
                session_type=session.session_type,
                qr_code=session.qr_code,
                qr_expires_at=session.qr_expires_at,
                manual_attendance_allowed=session.manual_attendance_allowed,
                face_recognition_enabled=session.face_recognition_enabled,
                location=session.location,
                created_at=session.created_at,
                updated_at=session.updated_at,
                total_students=total_students,
                present_count=present_count,
                absent_count=absent_count
            )
        )
    except NotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": {"code": "NOT_FOUND", "message": str(e)}}
        )


@router.put("/sessions/{session_id}", response_model=ResponseWrapper)
async def update_attendance_session(
    session_id: int,
    session_data: AttendanceSessionUpdate,
    db: Session = Depends(get_db_session),
    current_user: dict = Depends(require_teacher)
):
    """
    Update an attendance session (Teacher/Admin only)
    """
    try:
        session = AttendanceService.update_attendance_session(db, session_id, session_data)
        
        return ResponseWrapper(
            success=True,
            message="Attendance session updated successfully",
            data=AttendanceSessionResponse(
                id=session.id,
                course_id=session.course_id,
                course_title=session.course.title if session.course else None,
                teacher_id=session.teacher_id,
                teacher_name=session.teacher.profile.full_name if session.teacher and session.teacher.profile else None,
                session_title=session.session_title,
                session_date=session.session_date,
                start_time=session.start_time,
                end_time=session.end_time,
                session_type=session.session_type,
                qr_code=session.qr_code,
                qr_expires_at=session.qr_expires_at,
                manual_attendance_allowed=session.manual_attendance_allowed,
                face_recognition_enabled=session.face_recognition_enabled,
                location=session.location,
                created_at=session.created_at,
                updated_at=session.updated_at
            )
        )
    except NotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": {"code": "NOT_FOUND", "message": str(e)}}
        )


@router.post("/sessions/{session_id}/regenerate-qr", response_model=ResponseWrapper)
async def regenerate_qr_code(
    session_id: int,
    db: Session = Depends(get_db_session),
    current_user: dict = Depends(require_teacher)
):
    """
    Regenerate QR code for an attendance session
    """
    try:
        new_qr_code = AttendanceService.regenerate_qr_code(db, session_id)
        
        return ResponseWrapper(
            success=True,
            message="QR code regenerated successfully",
            data=QRCodeResponse(
                qr_code=new_qr_code,
                qr_image_url=f"/api/v1/attendance/qr/{new_qr_code}/image",
                expires_at=datetime.now() + timedelta(minutes=5),
                session_id=session_id
            )
        )
    except NotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": {"code": "NOT_FOUND", "message": str(e)}}
        )


@router.post("/sessions/{session_id}/mark", response_model=ResponseWrapper)
async def mark_attendance(
    session_id: int,
    record_data: AttendanceRecordCreate,
    db: Session = Depends(get_db_session),
    current_user: dict = Depends(require_teacher)
):
    """
    Mark attendance for a student (Teacher/Admin only)
    """
    try:
        record_data.session_id = session_id
        record = AttendanceService.mark_attendance(db, record_data)
        
        return ResponseWrapper(
            success=True,
            message="Attendance marked successfully",
            data=AttendanceRecordResponse(
                id=record.id,
                session_id=record.session_id,
                student_id=record.student_id,
                student_name=record.student.profile.full_name if record.student and record.student.profile else None,
                status=record.status,
                check_in_time=record.check_in_time,
                check_out_time=record.check_out_time,
                verification_method=record.verification_method,
                face_match_confidence=record.face_match_confidence,
                location_lat=record.location_lat,
                location_lng=record.location_lng,
                remarks=record.remarks,
                marked_by=record.marked_by,
                created_at=record.created_at,
                updated_at=record.updated_at
            )
        )
    except NotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": {"code": "NOT_FOUND", "message": str(e)}}
        )
    except ConflictError as e:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"error": {"code": "CONFLICT", "message": str(e)}}
        )


@router.get("/sessions/{session_id}/records", response_model=ResponseWrapper)
async def get_session_records(
    session_id: int,
    status: Optional[str] = Query(None, description="Filter by status"),
    db: Session = Depends(get_db_session),
    current_user: dict = Depends(require_teacher)
):
    """
    Get all attendance records for a session (Teacher/Admin only)
    """
    try:
        records = AttendanceService.get_session_records(db, session_id, status)
        
        record_responses = []
        for record in records:
            record_responses.append(AttendanceRecordResponse(
                id=record.id,
                session_id=record.session_id,
                student_id=record.student_id,
                student_name=record.student.profile.full_name if record.student and record.student.profile else None,
                status=record.status,
                check_in_time=record.check_in_time,
                check_out_time=record.check_out_time,
                verification_method=record.verification_method,
                face_match_confidence=record.face_match_confidence,
                location_lat=record.location_lat,
                location_lng=record.location_lng,
                remarks=record.remarks,
                marked_by=record.marked_by,
                created_at=record.created_at,
                updated_at=record.updated_at
            ))
        
        return ResponseWrapper(
            success=True,
            message="Attendance records retrieved successfully",
            data={
                "records": record_responses,
                "total": len(record_responses)
            }
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": {"code": "ERROR", "message": str(e)}}
        )


@router.get("/my-attendance", response_model=ResponseWrapper)
async def get_my_attendance(
    course_id: Optional[int] = Query(None, description="Filter by course"),
    db: Session = Depends(get_db_session),
    current_user: dict = Depends(require_student)
):
    """
    Get attendance records for the current student
    """
    try:
        summary = AttendanceService.get_student_attendance_summary(
            db,
            current_user["user_id"],
            course_id
        )
        
        return ResponseWrapper(
            success=True,
            message="Attendance summary retrieved successfully",
            data=summary
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": {"code": "ERROR", "message": str(e)}}
        )