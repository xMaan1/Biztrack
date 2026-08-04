"""
Dependency Injection for FastAPI
"""

from typing import Optional, List
from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session

from .database import get_db_session
from .security import get_current_user, get_current_user_optional
from .exceptions import PermissionError
from .config import settings


def get_db() -> Session:
    """
    Dependency for database session
    """
    return next(get_db_session())


async def require_role(required_roles: List[str], current_user: dict = Depends(get_current_user)) -> dict:
    """
    Role-based authorization dependency
    """
    user_role = current_user.get("role", "").lower()
    
    # Admin has all access
    if user_role == "admin":
        return current_user
    
    # Check if user's role is in required roles
    if user_role not in required_roles:
        raise PermissionError(
            message=f"Access denied. Required roles: {', '.join(required_roles)}"
        )
    
    return current_user


async def require_teacher(current_user: dict = Depends(get_current_user)) -> dict:
    """
    Dependency to require teacher role
    """
    return await require_role(["teacher", "admin"], current_user)


async def require_student(current_user: dict = Depends(get_current_user)) -> dict:
    """
    Dependency to require student role
    """
    return await require_role(["student", "admin"], current_user)


async def require_admin(current_user: dict = Depends(get_current_user)) -> dict:
    """
    Dependency to require admin role
    """
    return await require_role(["admin"], current_user)


async def require_teacher_or_student(current_user: dict = Depends(get_current_user)) -> dict:
    """
    Dependency to require teacher or student role
    """
    return await require_role(["teacher", "student", "admin"], current_user)


def get_pagination_params(
    page: int = 1,
    page_size: int = settings.DEFAULT_PAGE_SIZE,
) -> dict:
    """
    Dependency for pagination parameters
    """
    if page < 1:
        page = 1
    
    if page_size < 1:
        page_size = settings.DEFAULT_PAGE_SIZE
    
    if page_size > settings.MAX_PAGE_SIZE:
        page_size = settings.MAX_PAGE_SIZE
    
    return {
        "page": page,
        "page_size": page_size,
        "offset": (page - 1) * page_size,
        "limit": page_size,
    }


async def get_current_teacher(
    current_user: dict = Depends(require_teacher)
) -> dict:
    """
    Get current user with teacher validation
    """
    return current_user


async def get_current_student(
    current_user: dict = Depends(require_student)
) -> dict:
    """
    Get current user with student validation
    """
    return current_user


async def get_current_admin(
    current_user: dict = Depends(require_admin)
) -> dict:
    """
    Get current user with admin validation
    """
    return current_user


__all__ = [
    "get_db",
    "require_role",
    "require_teacher",
    "require_student",
    "require_admin",
    "require_teacher_or_student",
    "get_pagination_params",
    "get_current_teacher",
    "get_current_student",
    "get_current_admin",
]