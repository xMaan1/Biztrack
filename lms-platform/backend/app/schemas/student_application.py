"""
Student Application Schemas
"""
from typing import Optional, List, Any
from pydantic import BaseModel, Field, validator
from datetime import datetime, date

class StudentApplicationPersonal(BaseModel):
    """Personal information step"""
    full_name: str = Field(..., min_length=1, max_length=255)
    email: str = Field(...)
    phone: Optional[str] = None
    cnic_passport: Optional[str] = None
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = "Pakistan"

    @validator('gender')
    def validate_gender(cls, v):
        if v and v not in ['male', 'female', 'other']:
            raise ValueError('Gender must be male, female, or other')
        return v

class StudentApplicationAcademic(BaseModel):
    """Academic information step"""
    current_qualification: Optional[str] = None
    school_college_university: Optional[str] = None
    previous_qualification: Optional[str] = None
    field_of_study: Optional[str] = None
    gpa_percentage: Optional[str] = None

class StudentApplicationLearning(BaseModel):
    """Learning information step"""
    interested_courses: Optional[List[str]] = None
    learning_category: Optional[List[str]] = None
    previous_experience: Optional[str] = None
    career_goals: Optional[str] = None
    learning_mode: Optional[str] = None
    availability: Optional[str] = None

class StudentApplicationSubmit(BaseModel):
    """Full student application submission"""
    # Personal
    full_name: str = Field(..., min_length=1, max_length=255)
    email: str = Field(...)
    phone: Optional[str] = None
    cnic_passport: Optional[str] = None
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = "Pakistan"
    # Academic
    current_qualification: Optional[str] = None
    school_college_university: Optional[str] = None
    previous_qualification: Optional[str] = None
    field_of_study: Optional[str] = None
    gpa_percentage: Optional[str] = None
    # Learning
    interested_courses: Optional[List[str]] = None
    learning_category: Optional[List[str]] = None
    previous_experience: Optional[str] = None
    career_goals: Optional[str] = None
    learning_mode: Optional[str] = None
    availability: Optional[str] = None
    # Declaration
    declaration: bool = Field(..., description="Must confirm all information is correct")

    @validator('declaration')
    def validate_declaration(cls, v):
        if not v:
            raise ValueError('You must confirm that all information provided is correct')
        return v

    @validator('gender')
    def validate_gender(cls, v):
        if v and v not in ['male', 'female', 'other']:
            raise ValueError('Gender must be male, female, or other')
        return v

class StudentApplicationResponse(BaseModel):
    """Student application response"""
    id: int
    user_id: int
    status: str
    full_name: str
    email: str
    phone: Optional[str] = None
    cnic_passport: Optional[str] = None
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None
    current_qualification: Optional[str] = None
    school_college_university: Optional[str] = None
    previous_qualification: Optional[str] = None
    field_of_study: Optional[str] = None
    gpa_percentage: Optional[str] = None
    interested_courses: Optional[Any] = None
    learning_category: Optional[Any] = None
    previous_experience: Optional[str] = None
    career_goals: Optional[str] = None
    learning_mode: Optional[str] = None
    availability: Optional[str] = None
    reviewed_by: Optional[int] = None
    reviewed_at: Optional[datetime] = None
    admin_remarks: Optional[str] = None
    rejection_reason: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class StudentApplicationListResponse(BaseModel):
    """Paginated student application list"""
    applications: List[StudentApplicationResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
