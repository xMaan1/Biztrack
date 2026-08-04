"""
Authentication Router
Handles login, registration, token refresh, and logout
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from datetime import datetime

from ....core.database import get_db_session
from ....core.security import get_current_user
from ....core.exceptions import AuthenticationError, ValidationError, ConflictError
from ....schemas.auth import (
    LoginRequest,
    LoginResponse,
    RegisterRequest,
    RegisterResponse,
    TokenRefreshRequest,
    TokenRefreshResponse,
    PasswordChangeRequest,
)
from ....schemas.common import ResponseWrapper
from ....services.auth_service import AuthService
from ....services.notification_service import NotificationService
from ....models import User, UserProfile

# Router create karein
router = APIRouter()


@router.post("/login", response_model=ResponseWrapper)
async def login(
    request: LoginRequest,
    db: Session = Depends(get_db_session)
):
    """
    Authenticate user and return access token
    """
    try:
        # Check if first login before authentication updates last_login_at
        existing_user = (
            db.query(User)
            .outerjoin(UserProfile)
            .filter(
                or_(
                    User.email == request.email,
                    UserProfile.employee_id == request.email,
                    UserProfile.student_id == request.email,
                ),
                User.deleted_at.is_(None),
            )
            .first()
        )
        is_first_login = existing_user is not None and existing_user.last_login_at is None

        user, access_token, refresh_token = AuthService.authenticate_user(
            db,
            request.email,
            request.password
        )

        # Send welcome notification on first login
        if is_first_login:
            full_name = user.profile.full_name if user.profile else user.email
            NotificationService.create_notification(
                db,
                user_id=user.id,
                title="Welcome to LMS Platform!",
                message=f"Hi {full_name}, welcome to the Learning Management System. Start exploring your courses and stay on track with your learning journey.",
                type="success",
            )

        return ResponseWrapper(
            success=True,
            message="Login successful",
            data=LoginResponse(
                access_token=access_token,
                refresh_token=refresh_token,
                token_type="bearer",
                expires_in=3600,
                user={
                    "id": user.id,
                    "email": user.email,
                    "role": user.role if user.role else None,
                    "full_name": user.profile.full_name if user.profile else user.email,
                }
            )
        )
    except AuthenticationError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"error": {"code": "AUTH_ERROR", "message": str(e)}}
        )


@router.post("/register", response_model=ResponseWrapper)
async def register(
    request: RegisterRequest,
    db: Session = Depends(get_db_session)
):
    """
    Register a new user
    """
    try:
        user = AuthService.register_user(db, request)

        return ResponseWrapper(
            success=True,
            message="Registration successful. Please verify your email.",
            data=RegisterResponse(
                user_id=user.id,
                email=user.email,
                message="Registration successful"
            )
        )
    except ConflictError as e:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"error": {"code": "CONFLICT", "message": str(e)}}
        )
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"error": {"code": "VALIDATION_ERROR", "message": str(e)}}
        )


@router.post("/refresh", response_model=ResponseWrapper)
async def refresh_token(
    request: TokenRefreshRequest,
    db: Session = Depends(get_db_session)
):
    """
    Refresh access token using refresh token
    """
    try:
        new_access_token, new_refresh_token = AuthService.refresh_access_token(
            db,
            request.refresh_token
        )

        return ResponseWrapper(
            success=True,
            message="Token refreshed successfully",
            data=TokenRefreshResponse(
                access_token=new_access_token,
                token_type="bearer",
                expires_in=3600
            )
        )
    except AuthenticationError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"error": {"code": "AUTH_ERROR", "message": str(e)}}
        )


@router.post("/logout", response_model=ResponseWrapper)
async def logout(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db_session)
):
    """
    Logout user (invalidate token)
    """
    try:
        AuthService.logout_user(db, current_user["user_id"], current_user.get("token_jti"))
        
        return ResponseWrapper(
            success=True,
            message="Logged out successfully"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": {"code": "LOGOUT_ERROR", "message": str(e)}}
        )


@router.post("/change-password", response_model=ResponseWrapper)
async def change_password(
    request: PasswordChangeRequest,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db_session)
):
    """
    Change user password
    """
    try:
        AuthService.change_password(
            db,
            current_user["user_id"],
            request.old_password,
            request.new_password
        )

        return ResponseWrapper(
            success=True,
            message="Password changed successfully"
        )
    except AuthenticationError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"error": {"code": "AUTH_ERROR", "message": str(e)}}
        )
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"error": {"code": "VALIDATION_ERROR", "message": str(e)}}
        )