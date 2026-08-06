"""
Authentication Schemas
"""

from typing import Optional
from pydantic import BaseModel, EmailStr, Field, validator
from datetime import datetime


class LoginRequest(BaseModel):
    """Login request schema

    `email` accepts either the user's email or their ID
    (employee_id for admin/teacher, student_id for students).
    """
    email: str = Field(..., min_length=1, description="User email or ID (employee_id / student_id)")
    password: str = Field(..., min_length=6, description="User password")
    remember_me: bool = Field(default=False, description="Remember me")
    
    class Config:
        json_schema_extra = {
            "example": {
                "email": "EMP-001",
                "password": "Admin@1234",
                "remember_me": False
            }
        }


class LoginResponse(BaseModel):
    """Login response schema"""
    access_token: str = Field(..., description="JWT access token")
    refresh_token: str = Field(..., description="JWT refresh token")
    token_type: str = Field(default="bearer", description="Token type")
    expires_in: int = Field(..., description="Token expiry in seconds")
    user: dict = Field(..., description="User information")
    
    class Config:
        json_schema_extra = {
            "example": {
                "access_token": "eyJhbGciOiJIUzI1NiIs...",
                "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
                "token_type": "bearer",
                "expires_in": 3600,
                "user": {
                    "id": 1,
                    "email": "admin@lms.com",
                    "role": "admin",
                    "full_name": "System Administrator"
                }
            }
        }


class RegisterRequest(BaseModel):
    """Registration request schema"""
    email: EmailStr = Field(..., description="User email")
    password: str = Field(..., min_length=8, description="User password")
    confirm_password: str = Field(..., description="Confirm password")
    first_name: str = Field(..., min_length=1, max_length=100, description="First name")
    last_name: str = Field(..., min_length=1, max_length=100, description="Last name")
    role: Optional[str] = Field(default="public_user", description="Role: admin, teacher, student, or public_user (default: public_user)")
    department_id: Optional[int] = Field(default=None, description="Department ID")
    phone: Optional[str] = Field(default=None, description="Phone number")
    gender: Optional[str] = Field(default=None, description="Gender")
    
    @validator('confirm_password')
    def passwords_match(cls, v, values):
        if 'password' in values and v != values['password']:
            raise ValueError('Passwords do not match')
        return v
    
    @validator('gender')
    def validate_gender(cls, v):
        if v and v not in ['male', 'female', 'other']:
            raise ValueError('Gender must be male, female, or other')
        return v
    
    class Config:
        json_schema_extra = {
            "example": {
                "email": "student@example.com",
                "password": "StrongPass@123",
                "confirm_password": "StrongPass@123",
                "first_name": "John",
                "last_name": "Doe",
                "role": "student",
                "department_id": 1,
                "phone": "+92-300-1234567",
                "gender": "male"
            }
        }


class RegisterResponse(BaseModel):
    """Registration response schema"""
    user_id: int = Field(..., description="Created user ID")
    email: EmailStr = Field(..., description="User email")
    message: str = Field(default="User registered successfully", description="Success message")
    
    class Config:
        json_schema_extra = {
            "example": {
                "user_id": 10,
                "email": "student@example.com",
                "message": "User registered successfully"
            }
        }


class TokenRefreshRequest(BaseModel):
    """Token refresh request schema"""
    refresh_token: str = Field(..., description="Refresh token")
    
    class Config:
        json_schema_extra = {
            "example": {
                "refresh_token": "eyJhbGciOiJIUzI1NiIs..."
            }
        }


class TokenRefreshResponse(BaseModel):
    """Token refresh response schema"""
    access_token: str = Field(..., description="New JWT access token")
    token_type: str = Field(default="bearer", description="Token type")
    expires_in: int = Field(..., description="Token expiry in seconds")
    
    class Config:
        json_schema_extra = {
            "example": {
                "access_token": "eyJhbGciOiJIUzI1NiIs...",
                "token_type": "bearer",
                "expires_in": 3600
            }
        }


class PasswordChangeRequest(BaseModel):
    """Password change request schema"""
    old_password: str = Field(..., description="Current password")
    new_password: str = Field(..., min_length=8, description="New password")
    confirm_password: str = Field(..., description="Confirm new password")
    
    @validator('confirm_password')
    def passwords_match(cls, v, values):
        if 'new_password' in values and v != values['new_password']:
            raise ValueError('Passwords do not match')
        return v


class PasswordResetRequest(BaseModel):
    """Password reset request schema"""
    email: EmailStr = Field(..., description="User email")
    
    class Config:
        json_schema_extra = {
            "example": {
                "email": "user@example.com"
            }
        }


class PasswordResetConfirmRequest(BaseModel):
    """Password reset confirm schema"""
    token: str = Field(..., description="Reset token")
    new_password: str = Field(..., min_length=8, description="New password")
    confirm_password: str = Field(..., description="Confirm new password")
    
    @validator('confirm_password')
    def passwords_match(cls, v, values):
        if 'new_password' in values and v != values['new_password']:
            raise ValueError('Passwords do not match')
        return v


class VerifyEmailRequest(BaseModel):
    """Email verification request schema"""
    token: str = Field(..., description="Verification token")
    
    class Config:
        json_schema_extra = {
            "example": {
                "token": "abcdef123456..."
            }
        }


__all__ = [
    "LoginRequest",
    "LoginResponse",
    "RegisterRequest",
    "RegisterResponse",
    "TokenRefreshRequest",
    "TokenRefreshResponse",
    "PasswordChangeRequest",
    "PasswordResetRequest",
    "PasswordResetConfirmRequest",
    "VerifyEmailRequest",
]