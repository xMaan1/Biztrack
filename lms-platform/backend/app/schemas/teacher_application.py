"""
Teacher Application Schemas
"""
from typing import Optional, List, Any
from pydantic import BaseModel, Field, validator
from datetime import datetime, date

class TeacherApplicationPersonal(BaseModel):
    """Personal information step"""
    full_name: str = Field(..., min_length=1, max_length=255)
    email: str = Field(...)
    phone: Optional[str] = None
    cnic: Optional[str] = None
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

class TeacherApplicationProfessional(BaseModel):
    """Professional information step"""
    highest_qualification: Optional[str] = None
    university: Optional[str] = None
    degree: Optional[str] = None
    specialization: Optional[str] = None
    teaching_experience: Optional[str] = None
    current_job: Optional[str] = None
    skills: Optional[List[str]] = None
    languages: Optional[List[str]] = None
    linkedin: Optional[str] = None
    portfolio_website: Optional[str] = None

class TeacherApplicationTeaching(BaseModel):
    """Teaching information step"""
    subjects: Optional[List[str]] = None
    categories: Optional[List[str]] = None
    online_teaching_experience: Optional[str] = None
    offline_teaching_experience: Optional[str] = None
    expected_salary: Optional[float] = None
    available_days: Optional[str] = None
    available_time: Optional[str] = None
    teaching_statement: Optional[str] = None

class TeacherApplicationSubmit(BaseModel):
    """Full teacher application submission"""
    # Personal
    full_name: str = Field(..., min_length=1, max_length=255)
    email: str = Field(...)
    phone: Optional[str] = None
    cnic: Optional[str] = None
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = "Pakistan"
    # Professional
    highest_qualification: Optional[str] = None
    university: Optional[str] = None
    degree: Optional[str] = None
    specialization: Optional[str] = None
    teaching_experience: Optional[str] = None
    current_job: Optional[str] = None
    skills: Optional[List[str]] = None
    languages: Optional[List[str]] = None
    linkedin: Optional[str] = None
    portfolio_website: Optional[str] = None
    # Teaching
    subjects: Optional[List[str]] = None
    categories: Optional[List[str]] = None
    online_teaching_experience: Optional[str] = None
    offline_teaching_experience: Optional[str] = None
    expected_salary: Optional[float] = None
    available_days: Optional[str] = None
    available_time: Optional[str] = None
    teaching_statement: Optional[str] = None
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

class TeacherApplicationResponse(BaseModel):
    """Teacher application response"""
    id: int
    user_id: int
    status: str
    full_name: str
    email: str
    phone: Optional[str] = None
    cnic: Optional[str] = None
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None
    highest_qualification: Optional[str] = None
    university: Optional[str] = None
    degree: Optional[str] = None
    specialization: Optional[str] = None
    teaching_experience: Optional[str] = None
    current_job: Optional[str] = None
    skills: Optional[Any] = None
    languages: Optional[Any] = None
    linkedin: Optional[str] = None
    portfolio_website: Optional[str] = None
    subjects: Optional[Any] = None
    categories: Optional[Any] = None
    online_teaching_experience: Optional[str] = None
    offline_teaching_experience: Optional[str] = None
    expected_salary: Optional[float] = None
    available_days: Optional[str] = None
    available_time: Optional[str] = None
    teaching_statement: Optional[str] = None
    reviewed_by: Optional[int] = None
    reviewed_at: Optional[datetime] = None
    admin_remarks: Optional[str] = None
    rejection_reason: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class TeacherApplicationListResponse(BaseModel):
    """Paginated teacher application list"""
    applications: List[TeacherApplicationResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
