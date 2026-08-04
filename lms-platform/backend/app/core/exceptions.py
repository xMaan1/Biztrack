"""
Custom Exceptions for LMS Platform
"""

from typing import Optional, Dict, Any
from fastapi import HTTPException, status


class LMSException(Exception):
    """Base exception for LMS"""
    def __init__(
        self,
        message: str,
        code: str = "INTERNAL_ERROR",
        status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR,
        details: Optional[Dict[str, Any]] = None
    ):
        self.message = message
        self.code = code
        self.status_code = status_code
        self.details = details or {}
        super().__init__(message)


class AuthenticationError(LMSException):
    """Authentication related errors"""
    def __init__(
        self,
        message: str = "Authentication failed",
        details: Optional[Dict[str, Any]] = None
    ):
        super().__init__(
            message=message,
            code="AUTH_ERROR",
            status_code=status.HTTP_401_UNAUTHORIZED,
            details=details
        )


class TokenError(LMSException):
    """Token related errors"""
    def __init__(
        self,
        message: str = "Invalid or expired token",
        status_code: int = status.HTTP_401_UNAUTHORIZED,
        details: Optional[Dict[str, Any]] = None
    ):
        super().__init__(
            message=message,
            code="TOKEN_ERROR",
            status_code=status_code,
            details=details
        )


class PermissionError(LMSException):
    """Permission/Authorization errors"""
    def __init__(
        self,
        message: str = "Insufficient permissions",
        details: Optional[Dict[str, Any]] = None
    ):
        super().__init__(
            message=message,
            code="PERMISSION_DENIED",
            status_code=status.HTTP_403_FORBIDDEN,
            details=details
        )


class NotFoundError(LMSException):
    """Resource not found errors"""
    def __init__(
        self,
        message: str = "Resource not found",
        resource_type: Optional[str] = None,
        resource_id: Optional[int] = None,
        details: Optional[Dict[str, Any]] = None
    ):
        if resource_type and resource_id:
            message = f"{resource_type} with ID {resource_id} not found"
        
        super().__init__(
            message=message,
            code="NOT_FOUND",
            status_code=status.HTTP_404_NOT_FOUND,
            details=details
        )


class ValidationError(LMSException):
    """Data validation errors"""
    def __init__(
        self,
        message: str = "Validation failed",
        details: Optional[Dict[str, Any]] = None
    ):
        super().__init__(
            message=message,
            code="VALIDATION_ERROR",
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            details=details
        )


class ConflictError(LMSException):
    """Resource conflict errors (duplicate, etc.)"""
    def __init__(
        self,
        message: str = "Resource conflict",
        details: Optional[Dict[str, Any]] = None
    ):
        super().__init__(
            message=message,
            code="CONFLICT",
            status_code=status.HTTP_409_CONFLICT,
            details=details
        )


class DatabaseError(LMSException):
    """Database related errors"""
    def __init__(
        self,
        message: str = "Database operation failed",
        details: Optional[Dict[str, Any]] = None
    ):
        super().__init__(
            message=message,
            code="DATABASE_ERROR",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            details=details
        )


class FileUploadError(LMSException):
    """File upload related errors"""
    def __init__(
        self,
        message: str = "File upload failed",
        details: Optional[Dict[str, Any]] = None
    ):
        super().__init__(
            message=message,
            code="FILE_UPLOAD_ERROR",
            status_code=status.HTTP_400_BAD_REQUEST,
            details=details
        )


class FaceRecognitionError(LMSException):
    """Face recognition related errors"""
    def __init__(
        self,
        message: str = "Face recognition failed",
        details: Optional[Dict[str, Any]] = None
    ):
        super().__init__(
            message=message,
            code="FACE_RECOGNITION_ERROR",
            status_code=status.HTTP_400_BAD_REQUEST,
            details=details
        )


class RateLimitError(LMSException):
    """Rate limiting errors"""
    def __init__(
        self,
        message: str = "Too many requests",
        details: Optional[Dict[str, Any]] = None
    ):
        super().__init__(
            message=message,
            code="RATE_LIMIT",
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            details=details
        )


# FastAPI HTTP exception factory
def http_exception_from_lms(exc: LMSException) -> HTTPException:
    """
    Convert LMSException to FastAPI HTTPException
    """
    return HTTPException(
        status_code=exc.status_code,
        detail={
            "error": {
                "code": exc.code,
                "message": exc.message,
                "details": exc.details,
            }
        }
    )


__all__ = [
    "LMSException",
    "AuthenticationError",
    "TokenError",
    "PermissionError",
    "NotFoundError",
    "ValidationError",
    "ConflictError",
    "DatabaseError",
    "FileUploadError",
    "FaceRecognitionError",
    "RateLimitError",
    "http_exception_from_lms",
]