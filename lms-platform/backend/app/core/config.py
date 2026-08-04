"""
Configuration Management for LMS Platform
Loads environment variables and provides application settings
"""

import os
from typing import List, Optional
from pathlib import Path
from pydantic_settings import BaseSettings
from pydantic import Field, validator


class Settings(BaseSettings):
    """
    Application settings loaded from .env file
    """
    
    # Application
    APP_NAME: str = Field(default="LMS Platform")
    APP_VERSION: str = Field(default="1.0.0")
    DEBUG: bool = Field(default=True)
    ENVIRONMENT: str = Field(default="development")
    API_V1_PREFIX: str = Field(default="/api/v1")
    
    # Server
    HOST: str = Field(default="0.0.0.0")
    PORT: int = Field(default=8001)
    RELOAD: bool = Field(default=True)
    
    # Database
    DB_HOST: str = Field(default="localhost")
    DB_PORT: int = Field(default=3306)
    DB_NAME: str = Field(default="lms_db")
    DB_USER: str = Field(default="root")
    DB_PASSWORD: str = Field(default="")
    DB_POOL_SIZE: int = Field(default=10)
    DB_MAX_OVERFLOW: int = Field(default=20)
    
    # Security
    SECRET_KEY: str = Field(default="your-super-secret-key-change-in-production")
    ALGORITHM: str = Field(default="HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=60)
    REFRESH_TOKEN_EXPIRE_DAYS: int = Field(default=7)
    
    # CORS
    CORS_ORIGINS: List[str] = Field(
        default=["http://localhost:3000", "http://localhost:3001"]
    )
    CORS_CREDENTIALS: bool = Field(default=True)
    CORS_METHODS: List[str] = Field(default=["*"])
    CORS_HEADERS: List[str] = Field(default=["*"])
    
    # File Upload
    UPLOAD_DIR: str = Field(default="uploads")
    MAX_UPLOAD_SIZE: int = Field(default=10737418240)  # 10GB
    ALLOWED_VIDEO_EXTENSIONS: List[str] = Field(
        default=[".mp4", ".avi", ".mov", ".mkv", ".webm"]
    )
    ALLOWED_DOCUMENT_EXTENSIONS: List[str] = Field(
        default=[".pdf", ".doc", ".docx", ".ppt", ".pptx", ".xls", ".xlsx", ".txt"]
    )
    ALLOWED_IMAGE_EXTENSIONS: List[str] = Field(
        default=[".jpg", ".jpeg", ".png", ".gif", ".svg", ".webp"]
    )
    
    # Face Recognition
    FACE_RECOGNITION_ENABLED: bool = Field(default=True)
    FACE_ENCODING_DIR: str = Field(default="uploads/face_encodings")
    FACE_MATCH_THRESHOLD: float = Field(default=0.6)
    
    # QR Code
    QR_CODE_EXPIRE_MINUTES: int = Field(default=5)
    QR_CODE_IMAGE_FORMAT: str = Field(default="png")
    
    # Email (SMTP)
    SMTP_HOST: Optional[str] = Field(default=None)
    SMTP_PORT: Optional[int] = Field(default=587)
    SMTP_USER: Optional[str] = Field(default=None)
    SMTP_PASSWORD: Optional[str] = Field(default=None)
    SMTP_FROM_EMAIL: Optional[str] = Field(default=None)
    SMTP_FROM_NAME: Optional[str] = Field(default=None)
    
    # Logging
    LOG_LEVEL: str = Field(default="INFO")
    LOG_FILE: str = Field(default="logs/app.log")
    LOG_MAX_SIZE: int = Field(default=10485760)  # 10MB
    LOG_BACKUP_COUNT: int = Field(default=5)
    
    # Session
    SESSION_TIMEOUT_MINUTES: int = Field(default=60)
    MAX_LOGIN_ATTEMPTS: int = Field(default=5)
    LOCKOUT_DURATION_MINUTES: int = Field(default=30)
    
    # Pagination
    DEFAULT_PAGE_SIZE: int = Field(default=20)
    MAX_PAGE_SIZE: int = Field(default=100)
    
    @validator("CORS_ORIGINS", pre=True)
    def parse_cors_origins(cls, v):
        """Parse CORS origins from string or list"""
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        return v
    
    @validator("ALLOWED_VIDEO_EXTENSIONS", "ALLOWED_DOCUMENT_EXTENSIONS", 
               "ALLOWED_IMAGE_EXTENSIONS", "CORS_METHODS", "CORS_HEADERS", pre=True)
    def parse_list_fields(cls, v):
        """Parse list fields from string or list"""
        if isinstance(v, str):
            return [item.strip() for item in v.split(",") if item.strip()]
        return v
    
    @property
    def DATABASE_URL(self) -> str:
        """
        Build database connection URL for SQLAlchemy
        """
        return (
            f"mysql+pymysql://{self.DB_USER}:{self.DB_PASSWORD}"
            f"@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"
            f"?charset=utf8mb4"
        )
    
    @property
    def DATABASE_URL_SYNC(self) -> str:
        """
        Build database connection URL for synchronous operations
        """
        return (
            f"mysql+pymysql://{self.DB_USER}:{self.DB_PASSWORD}"
            f"@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"
        )
    
    class Config:
        """Pydantic configuration"""
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True
        extra = "ignore"


# Create global settings instance
settings = Settings()


# Helper function to get upload directories
def get_upload_paths() -> dict:
    """
    Get all upload directory paths
    """
    base_dir = settings.UPLOAD_DIR
    return {
        "base": base_dir,
        "videos": os.path.join(base_dir, "videos"),
        "materials": os.path.join(base_dir, "materials"),
        "submissions": os.path.join(base_dir, "submissions"),
        "face_encodings": os.path.join(base_dir, "face_encodings"),
        "temp": os.path.join(base_dir, "temp"),
        "thumbnails": os.path.join(base_dir, "thumbnails"),
        "avatars": os.path.join(base_dir, "avatars"),
    }


# Export settings for easy import
__all__ = ["settings", "get_upload_paths"]