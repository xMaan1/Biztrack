"""
Core module exports
"""

from .config import settings, get_upload_paths
from .database import (
    Base,
    get_engine,
    get_session_factory,
    get_db_session,
    get_db_context,
    init_database,
    check_database_health,
    close_all_connections,
)
from .security import (
    verify_password,
    get_password_hash,
    create_access_token,
    create_refresh_token,
    decode_token,
    validate_token,
    get_current_user,
    get_current_user_optional,
    generate_jti,
    generate_verification_token,
    generate_reset_token,
    verify_role,
    check_permission,
    validate_password_strength,
    security_scheme,
)
from .exceptions import (
    LMSException,
    AuthenticationError,
    TokenError,
    PermissionError,
    NotFoundError,
    ValidationError,
    ConflictError,
    DatabaseError,
    FileUploadError,
    FaceRecognitionError,
    RateLimitError,
    http_exception_from_lms,
)

__all__ = [
    # Config
    "settings",
    "get_upload_paths",
    # Database
    "Base",
    "get_engine",
    "get_session_factory",
    "get_db_session",
    "get_db_context",
    "init_database",
    "check_database_health",
    "close_all_connections",
    # Security
    "verify_password",
    "get_password_hash",
    "create_access_token",
    "create_refresh_token",
    "decode_token",
    "validate_token",
    "get_current_user",
    "get_current_user_optional",
    "generate_jti",
    "generate_verification_token",
    "generate_reset_token",
    "verify_role",
    "check_permission",
    "validate_password_strength",
    "security_scheme",
    # Exceptions
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