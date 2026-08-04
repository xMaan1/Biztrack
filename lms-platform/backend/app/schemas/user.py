"""
User Schemas
"""

from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field, validator
from datetime import datetime, date


class UserBase(BaseModel):
    """Base user schema"""
    email: EmailStr = Field(..., description="User email")
    role: str = Field(..., description="Role: admin, teacher, or student")
    department_id: Optional[int] = Field(default=None, description="Department ID")
    is_active: bool = Field(default=True, description="Is active")
    is_verified: bool = Field(default=False, description="Is verified")
    
    @validator('role')
    def validate_role(cls, v):
        if v not in ['admin', 'teacher', 'student', 'public_user']:
            raise ValueError('Role must be admin, teacher, student, or public_user')
        return v


class UserCreate(UserBase):
    """User creation schema"""
    password: str = Field(..., min_length=8, description="User password")
    
    @validator('password')
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters')
        return v


class UserUpdate(BaseModel):
    """User update schema"""
    email: Optional[EmailStr] = Field(default=None, description="User email")
    role: Optional[str] = Field(default=None, description="Role: admin, teacher, or student")
    department_id: Optional[int] = Field(default=None, description="Department ID")
    is_active: Optional[bool] = Field(default=None, description="Is active")
    is_verified: Optional[bool] = Field(default=None, description="Is verified")
    
    @validator('role')
    def validate_role(cls, v):
        if v is not None and v not in ['admin', 'teacher', 'student', 'public_user']:
            raise ValueError('Role must be admin, teacher, student, or public_user')
        return v


class UserResponse(BaseModel):
    """User response schema"""
    id: int
    email: str
    role: str
    department_id: Optional[int] = None
    is_active: bool
    is_verified: bool
    last_login_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class UserProfileBase(BaseModel):
    """Base user profile schema"""
    first_name: str = Field(default="", max_length=100)
    last_name: str = Field(default="", max_length=100)
    middle_name: Optional[str] = Field(default=None, max_length=100)
    date_of_birth: Optional[date] = Field(default=None)
    gender: Optional[str] = Field(default=None)
    phone: Optional[str] = Field(default=None, max_length=20)
    address: Optional[str] = Field(default=None)
    city: Optional[str] = Field(default=None, max_length=100)
    state: Optional[str] = Field(default=None, max_length=100)
    postal_code: Optional[str] = Field(default=None, max_length=20)
    country: str = Field(default="Pakistan", max_length=100)
    profile_picture_url: Optional[str] = Field(default=None, max_length=500)
    bio: Optional[str] = Field(default=None)
    employee_id: Optional[str] = Field(default=None, max_length=50)
    student_id: Optional[str] = Field(default=None, max_length=50)
    emergency_contact_name: Optional[str] = Field(default=None, max_length=200)
    emergency_contact_phone: Optional[str] = Field(default=None, max_length=20)
    
    @validator('gender')
    def validate_gender(cls, v):
        if v and v not in ['male', 'female', 'other']:
            raise ValueError('Gender must be male, female, or other')
        return v


class UserProfileCreate(UserProfileBase):
    """User profile creation schema"""
    user_id: int = Field(..., description="User ID")


class UserProfileUpdate(BaseModel):
    """User profile update schema"""
    first_name: Optional[str] = Field(default=None, min_length=1, max_length=100)
    last_name: Optional[str] = Field(default=None, min_length=1, max_length=100)
    middle_name: Optional[str] = Field(default=None, max_length=100)
    date_of_birth: Optional[date] = Field(default=None)
    gender: Optional[str] = Field(default=None)
    phone: Optional[str] = Field(default=None, max_length=20)
    address: Optional[str] = Field(default=None)
    city: Optional[str] = Field(default=None, max_length=100)
    state: Optional[str] = Field(default=None, max_length=100)
    postal_code: Optional[str] = Field(default=None, max_length=20)
    country: Optional[str] = Field(default=None, max_length=100)
    profile_picture_url: Optional[str] = Field(default=None, max_length=500)
    bio: Optional[str] = Field(default=None)
    employee_id: Optional[str] = Field(default=None, max_length=50)
    student_id: Optional[str] = Field(default=None, max_length=50)
    emergency_contact_name: Optional[str] = Field(default=None, max_length=200)
    emergency_contact_phone: Optional[str] = Field(default=None, max_length=20)
    
    @validator('gender')
    def validate_gender(cls, v):
        if v and v not in ['male', 'female', 'other']:
            raise ValueError('Gender must be male, female, or other')
        return v


class UserProfileResponse(BaseModel):
    """User profile response schema"""
    id: int
    user_id: int
    first_name: str
    last_name: str
    middle_name: Optional[str] = None
    full_name: Optional[str] = None
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    postal_code: Optional[str] = None
    country: Optional[str] = None
    profile_picture_url: Optional[str] = None
    bio: Optional[str] = None
    employee_id: Optional[str] = None
    student_id: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class UserWithProfileResponse(BaseModel):
    """User with profile response schema"""
    id: int
    email: str
    role: str
    role_id: Optional[int] = None
    department_id: Optional[int] = None
    is_active: bool
    is_verified: bool
    last_login_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    profile: Optional[UserProfileResponse] = None
    department_name: Optional[str] = None
    
    class Config:
        from_attributes = True


class UserUpdateRequest(BaseModel):
    """Combined user update request from frontend (matches PUT /users/{id} payload)"""
    email: Optional[EmailStr] = Field(default=None, description="User email")
    role: Optional[str] = Field(default=None, description="Role: admin, teacher, or student")
    department_id: Optional[int] = Field(default=None, description="Department ID")
    is_active: Optional[bool] = Field(default=None, description="Is active")
    is_verified: Optional[bool] = Field(default=None, description="Is verified")
    profile: Optional[UserProfileUpdate] = Field(default=None, description="Profile fields")

    @validator('role')
    def validate_role(cls, v):
        if v is not None and v not in ['admin', 'teacher', 'student', 'public_user']:
            raise ValueError('Role must be admin, teacher, student, or public_user')
        return v


class UserCreateRequest(BaseModel):
    """Combined user creation request from frontend"""
    email: EmailStr = Field(..., description="User email")
    password: str = Field(..., min_length=8, description="User password")
    role: str = Field(..., description="Role: admin, teacher, or student")
    department_id: Optional[int] = Field(default=None, description="Department ID")
    is_active: Optional[bool] = Field(default=True)
    is_verified: Optional[bool] = Field(default=False)
    first_name: Optional[str] = Field(default=None, max_length=100)
    last_name: Optional[str] = Field(default=None, max_length=100)
    phone: Optional[str] = Field(default=None, max_length=20)
    student_number: Optional[str] = Field(default=None, max_length=50)
    employee_number: Optional[str] = Field(default=None, max_length=50)
    specialization: Optional[str] = Field(default=None, max_length=200)
    
    @validator('role')
    def validate_role(cls, v):
        if v not in ['admin', 'teacher', 'student', 'public_user']:
            raise ValueError('Role must be admin, teacher, student, or public_user')
        return v


__all__ = [
    "UserBase",
    "UserCreate",
    "UserCreateRequest",
    "UserUpdate",
    "UserUpdateRequest",
    "UserResponse",
    "UserProfileBase",
    "UserProfileCreate",
    "UserProfileUpdate",
    "UserProfileResponse",
    "UserWithProfileResponse",
]
