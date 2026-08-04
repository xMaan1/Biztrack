"""
User Service
Handles user management, profiles, and role-based operations
"""

from datetime import datetime
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import or_, func

from ..core.exceptions import NotFoundError, ConflictError, ValidationError
from ..core.security import get_password_hash, validate_password_strength
from ..models import User, UserProfile, Department, Role
from ..models.student import Student
from ..models.teacher import Teacher
from ..models.admin import Admin
from ..schemas.user import UserCreate, UserUpdate, UserProfileCreate, UserProfileUpdate


class UserService:
    """User management service"""

    @staticmethod
    def get_user_by_id(
        db: Session,
        user_id: int,
        include_deleted: bool = False
    ) -> Optional[User]:
        """
        Get user by ID
        """
        query = db.query(User).filter(User.id == user_id)
        if not include_deleted:
            query = query.filter(User.deleted_at.is_(None))
        return query.first()

    @staticmethod
    def get_user_by_email(
        db: Session,
        email: str,
        include_deleted: bool = False
    ) -> Optional[User]:
        """
        Get user by email
        """
        query = db.query(User).filter(User.email == email)
        if not include_deleted:
            query = query.filter(User.deleted_at.is_(None))
        return query.first()

    @staticmethod
    def get_users(
        db: Session,
        skip: int = 0,
        limit: int = 20,
        search: Optional[str] = None,
        role: Optional[str] = None,
        department_id: Optional[int] = None,
        is_active: Optional[bool] = None
    ) -> tuple[List[User], int]:
        """
        Get list of users with filters
        """
        query = db.query(User).filter(User.deleted_at.is_(None))

        # Apply filters
        if search:
            search_term = f"%{search}%"
            query = query.filter(
                or_(
                    User.email.ilike(search_term),
                    UserProfile.first_name.ilike(search_term),
                    UserProfile.last_name.ilike(search_term),
                )
            ).join(UserProfile, isouter=True)

        if role:
            query = query.filter(User.role == role)

        if department_id:
            query = query.filter(User.department_id == department_id)

        if is_active is not None:
            query = query.filter(User.is_active == is_active)

        # Get total count
        total = query.count()

        # Apply ordering and pagination
        users = query.order_by(User.created_at.desc()).offset(skip).limit(limit).all()

        return users, total

    @staticmethod
    def create_user(
        db: Session,
        user_data: UserCreate,
        profile_data: Optional[UserProfileCreate] = None,
        role_extra: Optional[Dict[str, Any]] = None
    ) -> User:
        """
        Create a new user and role-specific record
        role_extra: optional dict with role-specific fields (student_number, specialization, etc.)
        """
        # Check if email exists
        existing = db.query(User).filter(
            User.email == user_data.email,
            User.deleted_at.is_(None)
        ).first()

        if existing:
            raise ConflictError("Email already exists")

        # Validate password strength
        is_valid, message = validate_password_strength(user_data.password)
        if not is_valid:
            raise ValidationError(message)

        # Check if role is valid
        valid_roles = ['admin', 'teacher', 'student', 'public_user']
        if user_data.role not in valid_roles:
            raise NotFoundError("Role not found", resource_type="Role", resource_id=user_data.role)

        # Look up role_id from roles table
        role = db.query(Role).filter(Role.name == user_data.role).first()
        role_id = role.id if role else None

        # Create user — trigger will auto-insert into role table
        user = User(
            email=user_data.email,
            password_hash=get_password_hash(user_data.password),
            role=user_data.role,
            role_id=role_id,
            department_id=user_data.department_id,
            is_active=user_data.is_active,
            is_verified=user_data.is_verified,
        )

        db.add(user)
        db.flush()

        # Create profile if provided
        if profile_data:
            profile = UserProfile(
                user_id=user.id,
                **profile_data.dict(exclude={'user_id'})
            )
            db.add(profile)

        # Update role-specific record with extra data (created by trigger)
        if role_extra:
            if user.role == "student":
                student = db.query(Student).filter(Student.user_id == user.id).first()
                if student:
                    for key, value in role_extra.items():
                        if hasattr(student, key) and value is not None:
                            setattr(student, key, value)
            elif user.role == "teacher":
                teacher = db.query(Teacher).filter(Teacher.user_id == user.id).first()
                if teacher:
                    for key, value in role_extra.items():
                        if hasattr(teacher, key) and value is not None:
                            setattr(teacher, key, value)
            elif user.role == "admin":
                admin_rec = db.query(Admin).filter(Admin.user_id == user.id).first()
                if admin_rec:
                    for key, value in role_extra.items():
                        if hasattr(admin_rec, key) and value is not None:
                            setattr(admin_rec, key, value)

        db.commit()
        db.refresh(user)

        return user

    @staticmethod
    def update_user(
        db: Session,
        user_id: int,
        user_data: UserUpdate,
        profile_data: Optional[UserProfileUpdate] = None
    ) -> User:
        """
        Update user and profile
        """
        user = UserService.get_user_by_id(db, user_id)
        if not user:
            raise NotFoundError("User not found", resource_type="User", resource_id=user_id)

        # Update user fields
        update_dict = user_data.dict(exclude_unset=True)
        for field, value in update_dict.items():
            if value is not None:
                setattr(user, field, value)

        # Update profile if provided
        if profile_data:
            if not user.profile:
                # Create profile if doesn't exist
                profile = UserProfile(
                    user_id=user_id,
                    **profile_data.dict(exclude_unset=True)
                )
                db.add(profile)
            else:
                profile_update_dict = profile_data.dict(exclude_unset=True)
                for field, value in profile_update_dict.items():
                    if value is not None:
                        setattr(user.profile, field, value)

        db.commit()
        db.refresh(user)

        return user

    @staticmethod
    def delete_user(
        db: Session,
        user_id: int,
        soft_delete: bool = True
    ) -> bool:
        """
        Delete user (soft or hard)
        """
        user = UserService.get_user_by_id(db, user_id, include_deleted=True)
        if not user:
            raise NotFoundError("User not found", resource_type="User", resource_id=user_id)

        if soft_delete:
            # Soft delete
            user.deleted_at = datetime.now()
            user.is_active = False
        else:
            # Hard delete
            # First delete profile
            if user.profile:
                db.delete(user.profile)
            db.delete(user)

        db.commit()
        return True

    @staticmethod
    def update_password(
        db: Session,
        user_id: int,
        new_password: str
    ) -> bool:
        """
        Update user password (admin only)
        """
        user = UserService.get_user_by_id(db, user_id)
        if not user:
            raise NotFoundError("User not found", resource_type="User", resource_id=user_id)

        # Validate password strength
        is_valid, message = validate_password_strength(new_password)
        if not is_valid:
            raise ValidationError(message)

        user.password_hash = get_password_hash(new_password)
        db.commit()

        return True

    @staticmethod
    def get_user_profile(
        db: Session,
        user_id: int
    ) -> Optional[UserProfile]:
        """
        Get user profile
        """
        user = UserService.get_user_by_id(db, user_id)
        if not user:
            raise NotFoundError("User not found", resource_type="User", resource_id=user_id)

        return user.profile

    @staticmethod
    def get_students(
        db: Session,
        skip: int = 0,
        limit: int = 20,
        search: Optional[str] = None,
        is_active: Optional[bool] = None
    ) -> tuple[List, int]:
        """Get students with user data"""
        query = (
            db.query(Student, User, UserProfile)
            .join(User, Student.user_id == User.id)
            .outerjoin(UserProfile, User.id == UserProfile.user_id)
            .filter(User.deleted_at.is_(None))
        )
        if search:
            term = f"%{search}%"
            query = query.filter(
                or_(
                    User.email.ilike(term),
                    UserProfile.first_name.ilike(term),
                    UserProfile.last_name.ilike(term),
                    Student.student_number.ilike(term),
                )
            )
        if is_active is not None:
            query = query.filter(User.is_active == is_active)

        total = query.count()
        results = query.order_by(User.created_at.desc()).offset(skip).limit(limit).all()
        return results, total

    @staticmethod
    def get_teachers(
        db: Session,
        skip: int = 0,
        limit: int = 20,
        search: Optional[str] = None,
        is_active: Optional[bool] = None,
        department_id: Optional[int] = None
    ) -> tuple[List, int]:
        """Get teachers with user data"""
        query = (
            db.query(Teacher, User, UserProfile)
            .join(User, Teacher.user_id == User.id)
            .outerjoin(UserProfile, User.id == UserProfile.user_id)
            .filter(User.deleted_at.is_(None))
        )
        if search:
            term = f"%{search}%"
            query = query.filter(
                or_(
                    User.email.ilike(term),
                    UserProfile.first_name.ilike(term),
                    UserProfile.last_name.ilike(term),
                    Teacher.employee_number.ilike(term),
                )
            )
        if is_active is not None:
            query = query.filter(User.is_active == is_active)
        if department_id is not None:
            query = query.filter(User.department_id == department_id)

        total = query.count()
        results = query.order_by(User.created_at.desc()).offset(skip).limit(limit).all()
        return results, total

    @staticmethod
    def get_admins(
        db: Session,
        skip: int = 0,
        limit: int = 20,
        search: Optional[str] = None,
        is_active: Optional[bool] = None
    ) -> tuple[List, int]:
        """Get admins with user data"""
        query = (
            db.query(Admin, User, UserProfile)
            .join(User, Admin.user_id == User.id)
            .outerjoin(UserProfile, User.id == UserProfile.user_id)
            .filter(User.deleted_at.is_(None))
        )
        if search:
            term = f"%{search}%"
            query = query.filter(
                or_(
                    User.email.ilike(term),
                    UserProfile.first_name.ilike(term),
                    UserProfile.last_name.ilike(term),
                )
            )
        if is_active is not None:
            query = query.filter(User.is_active == is_active)

        total = query.count()
        results = query.order_by(User.created_at.desc()).offset(skip).limit(limit).all()
        return results, total