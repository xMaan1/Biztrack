"""
Attendance Schemas
"""

from typing import Optional, List
from pydantic import BaseModel, Field
from datetime import datetime, date, time


class AttendanceSessionBase(BaseModel):
    """Base attendance session schema"""
    course_id: int = Field(..., description="Course ID")
    teacher_id: int = Field(..., description="Teacher ID")
    session_title: str = Field(..., min_length=1, max_length=255)
    session_date: date = Field(..., description="Session date")
    start_time: time = Field(..., description="Start time")
    end_time: time = Field(..., description="End time")
    session_type: str = Field(default="lecture", description="Session type")
    manual_attendance_allowed: bool = Field(default=True)
    face_recognition_enabled: bool = Field(default=False)
    location: Optional[str] = Field(default=None, max_length=255)


class AttendanceSessionCreate(AttendanceSessionBase):
    """Attendance session creation schema"""
    pass


class AttendanceSessionUpdate(BaseModel):
    """Attendance session update schema"""
    session_title: Optional[str] = Field(default=None, min_length=1, max_length=255)
    session_date: Optional[date] = Field(default=None)
    start_time: Optional[time] = Field(default=None)
    end_time: Optional[time] = Field(default=None)
    session_type: Optional[str] = Field(default=None)
    manual_attendance_allowed: Optional[bool] = Field(default=None)
    face_recognition_enabled: Optional[bool] = Field(default=None)
    location: Optional[str] = Field(default=None, max_length=255)


class AttendanceSessionResponse(BaseModel):
    """Attendance session response schema"""
    id: int
    course_id: int
    course_title: Optional[str] = None
    teacher_id: int
    teacher_name: Optional[str] = None
    session_title: str
    session_date: date
    start_time: time
    end_time: time
    session_type: str
    qr_code: Optional[str] = None
    qr_expires_at: Optional[datetime] = None
    manual_attendance_allowed: bool
    face_recognition_enabled: bool
    location: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    total_students: Optional[int] = 0
    present_count: Optional[int] = 0
    absent_count: Optional[int] = 0
    
    class Config:
        from_attributes = True


class AttendanceRecordBase(BaseModel):
    """Base attendance record schema"""
    session_id: int = Field(..., description="Session ID")
    student_id: int = Field(..., description="Student ID")
    status: str = Field(default="present", description="Attendance status")
    verification_method: str = Field(default="manual")
    face_match_confidence: Optional[float] = Field(default=None, ge=0, le=100)
    location_lat: Optional[float] = Field(default=None)
    location_lng: Optional[float] = Field(default=None)
    remarks: Optional[str] = Field(default=None)


class AttendanceRecordCreate(AttendanceRecordBase):
    """Attendance record creation schema"""
    pass


class AttendanceRecordUpdate(BaseModel):
    """Attendance record update schema"""
    status: Optional[str] = Field(default=None)
    check_in_time: Optional[datetime] = Field(default=None)
    check_out_time: Optional[datetime] = Field(default=None)
    verification_method: Optional[str] = Field(default=None)
    face_match_confidence: Optional[float] = Field(default=None, ge=0, le=100)
    location_lat: Optional[float] = Field(default=None)
    location_lng: Optional[float] = Field(default=None)
    remarks: Optional[str] = Field(default=None)


class AttendanceRecordResponse(BaseModel):
    """Attendance record response schema"""
    id: int
    session_id: int
    student_id: int
    student_name: Optional[str] = None
    status: str
    check_in_time: Optional[datetime] = None
    check_out_time: Optional[datetime] = None
    verification_method: str
    face_match_confidence: Optional[float] = None
    location_lat: Optional[float] = None
    location_lng: Optional[float] = None
    remarks: Optional[str] = None
    marked_by: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class QRCodeResponse(BaseModel):
    """QR code response schema"""
    qr_code: str = Field(..., description="QR code identifier")
    qr_image_url: str = Field(..., description="QR code image URL")
    expires_at: datetime = Field(..., description="Expiry time")
    session_id: int = Field(..., description="Session ID")


class FaceRecognitionRequest(BaseModel):
    """Face recognition request schema"""
    session_id: int = Field(..., description="Session ID")
    image_data: str = Field(..., description="Base64 encoded image data")
    student_id: Optional[int] = Field(default=None, description="Optional student ID")


class FaceRecognitionResponse(BaseModel):
    """Face recognition response schema"""
    success: bool = Field(..., description="Whether recognition was successful")
    student_id: Optional[int] = Field(default=None, description="Recognized student ID")
    student_name: Optional[str] = Field(default=None, description="Student name")
    confidence: float = Field(..., description="Confidence score")
    message: str = Field(..., description="Response message")


__all__ = [
    "AttendanceSessionBase",
    "AttendanceSessionCreate",
    "AttendanceSessionUpdate",
    "AttendanceSessionResponse",
    "AttendanceRecordBase",
    "AttendanceRecordCreate",
    "AttendanceRecordUpdate",
    "AttendanceRecordResponse",
    "QRCodeResponse",
    "FaceRecognitionRequest",
    "FaceRecognitionResponse",
]