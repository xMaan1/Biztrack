"""
Authentication Service
Handles login, registration, token management, and authentication logic
"""

from typing import Optional, Dict, Any, Tuple
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import or_

from ..core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    create_refresh_token,
    generate_jti,
    validate_password_strength,
)
from ..core.exceptions import (
    AuthenticationError,
    ValidationError,
    NotFoundError,
    ConflictError,
)
from ..models import User, UserProfile, Role
from ..models.student import Student
from ..models.teacher import Teacher
from ..models.admin import Admin
from ..schemas.auth import LoginRequest, RegisterRequest
from ..schemas.user import UserCreate, UserProfileCreate


class AuthService:
    """Authentication service with JWT token management"""

    @staticmethod
    def authenticate_user(
        db: Session,
        identifier: str,
        password: str
    ) -> Tuple[User, str, str]:
        """
        Authenticate user and generate tokens
        `identifier` can be an email, employee_id, or student_id.
        Returns: (user, access_token, refresh_token)
        """
        # Find user by email OR by their ID (employee_id / student_id)
        identifier = identifier.strip()

        user = (
            db.query(User)
            .outerjoin(UserProfile)
            .filter(
                or_(
                    User.email == identifier,
                    UserProfile.employee_id == identifier,
                    UserProfile.student_id == identifier,
                ),
                User.deleted_at.is_(None),
            )
            .first()
        )

        if not user:
            raise AuthenticationError("Invalid email, ID, or password")

        # Check if account is locked
        if user.locked_until and user.locked_until > datetime.now():
            remaining = user.locked_until - datetime.now()
            raise AuthenticationError(
                f"Account is locked. Try again in {remaining.seconds // 60} minutes"
            )

        # Check if user is active (before any state changes)
        if not user.is_active:
            raise AuthenticationError("Account is deactivated. Please contact administrator")

        # Verify password
        if not verify_password(password, user.password_hash):
            # Increment login attempts
            user.login_attempts = (user.login_attempts or 0) + 1
            
            # Lock account after max attempts
            if user.login_attempts >= 5:
                user.locked_until = datetime.now() + timedelta(minutes=30)
                db.commit()
                raise AuthenticationError(
                    "Account locked due to too many failed attempts. Try again in 30 minutes"
                )
            
            db.commit()
            raise AuthenticationError("Invalid email, ID, or password")

        # Reset login attempts on successful login
        user.login_attempts = 0
        user.locked_until = None
        user.last_login_at = datetime.now()

        db.commit()
        db.refresh(user)

        # Generate tokens
        token_data = {
            "sub": str(user.id),
            "email": user.email,
            "role": user.role if user.role else None,
            "full_name": user.profile.full_name if user.profile else user.email,
            "jti": generate_jti(),
        }

        access_token = create_access_token(token_data)
        refresh_token = create_refresh_token(token_data)

        return user, access_token, refresh_token

    @staticmethod
    def register_user(
        db: Session,
        register_data: RegisterRequest
    ) -> User:
        """
        Register a new user
        """
        # Check if email already exists
        existing_user = db.query(User).filter(
            User.email == register_data.email,
            User.deleted_at.is_(None)
        ).first()

        if existing_user:
            raise ConflictError("Email already registered")

        # Validate password strength
        is_valid, message = validate_password_strength(register_data.password)
        if not is_valid:
            raise ValidationError(message)

        # Check if role is valid
        valid_roles = ['admin', 'teacher', 'student', 'public_user']
        if register_data.role not in valid_roles:
            register_data.role = 'public_user'

        # Look up role_id from roles table
        role_obj = db.query(Role).filter(Role.name == register_data.role).first()
        role_id = role_obj.id if role_obj else None

        # Create user
        user = User(
            email=register_data.email,
            password_hash=get_password_hash(register_data.password),
            role=register_data.role,
            role_id=role_id,
            department_id=register_data.department_id,
            is_active=True,
            is_verified=False,
        )

        db.add(user)
        db.flush()

        # Create user profile
        profile_data = UserProfileCreate(
            user_id=user.id,
            first_name=register_data.first_name,
            last_name=register_data.last_name,
            phone=register_data.phone,
            gender=register_data.gender,
        )

        profile = UserProfile(**profile_data.dict())
        db.add(profile)

        db.commit()
        db.refresh(user)

        return user

    @staticmethod
    def refresh_access_token(
        db: Session,
        refresh_token: str
    ) -> Tuple[str, str]:
        """
        Refresh access token using refresh token
        Returns: (new_access_token, new_refresh_token)
        """
        from ..core.security import validate_token, decode_token

        try:
            # Validate refresh token
            payload = validate_token(refresh_token, "refresh")
            
            # Get user
            user_id = int(payload["sub"])
            user = db.query(User).filter(
                User.id == user_id,
                User.deleted_at.is_(None)
            ).first()

            if not user:
                raise AuthenticationError("User not found")

            if not user.is_active:
                raise AuthenticationError("Account is deactivated")

            # Generate new tokens
            token_data = {
                "sub": str(user.id),
                "email": user.email,
            "role": user.role if user.role else None,
                "full_name": user.profile.full_name if user.profile else user.email,
                "jti": generate_jti(),
            }

            new_access_token = create_access_token(token_data)
            new_refresh_token = create_refresh_token(token_data)

            return new_access_token, new_refresh_token

        except Exception as e:
            raise AuthenticationError("Invalid refresh token")

    @staticmethod
    def change_password(
        db: Session,
        user_id: int,
        old_password: str,
        new_password: str
    ) -> bool:
        """
        Change user password
        """
        user = db.query(User).filter(
            User.id == user_id,
            User.deleted_at.is_(None)
        ).first()

        if not user:
            raise NotFoundError("User not found", resource_type="User", resource_id=user_id)

        # Verify old password
        if not verify_password(old_password, user.password_hash):
            raise AuthenticationError("Current password is incorrect")

        # Validate new password strength
        is_valid, message = validate_password_strength(new_password)
        if not is_valid:
            raise ValidationError(message)

        # Update password
        user.password_hash = get_password_hash(new_password)
        db.commit()

        return True

    @staticmethod
    def logout_user(
        db: Session,
        user_id: int,
        token_jti: str
    ) -> bool:
        """
        Logout user by invalidating token
        """
        # In a real implementation, add token to blacklist
        # For now, we'll just update last activity
        user = db.query(User).filter(User.id == user_id).first()
        if user:
            user.updated_at = datetime.now()
            db.commit()

        return True