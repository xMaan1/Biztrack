"""
Application Shared Schemas
"""
from typing import Optional, List
from pydantic import BaseModel, Field
from datetime import datetime

class ApplicationStatusUpdate(BaseModel):
    """Admin action on application"""
    admin_remarks: Optional[str] = None

class ApplicationRejectRequest(BaseModel):
    """Rejection with reason"""
    rejection_reason: str = Field(..., min_length=1, description="Reason for rejection")
    admin_remarks: Optional[str] = None

class ApplicationApproveTeacherRequest(BaseModel):
    """Teacher approval with role assignment"""
    department_id: Optional[int] = None
    designation: Optional[str] = None
    joining_date: Optional[str] = None
    assigned_courses: Optional[List[int]] = None
    admin_remarks: Optional[str] = None

class ApplicationApproveStudentRequest(BaseModel):
    """Student approval with enrollment assignment"""
    department_id: Optional[int] = None
    course_id: Optional[int] = None
    batch: Optional[str] = None
    section: Optional[str] = None
    enrollment_date: Optional[str] = None
    admin_remarks: Optional[str] = None

class ApplicationDocumentResponse(BaseModel):
    """Document response"""
    id: int
    application_type: str
    application_id: int
    document_type: str
    file_name: str
    file_path: str
    file_size: int
    mime_type: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class ApplicationStatusLogResponse(BaseModel):
    """Status log response"""
    id: int
    application_type: str
    application_id: int
    old_status: Optional[str] = None
    new_status: str
    changed_by: Optional[int] = None
    remarks: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class ApplicationDashboardStats(BaseModel):
    """Admin dashboard stats"""
    total_applications: int = 0
    teacher_applications: int = 0
    student_applications: int = 0
    submitted: int = 0
    reviewed: int = 0
    selected: int = 0
    rejected: int = 0
