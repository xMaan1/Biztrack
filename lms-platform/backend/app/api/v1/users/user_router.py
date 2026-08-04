"""
User Router
Handles user management endpoints
"""

import os
import shutil
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from fastapi.encoders import jsonable_encoder
from sqlalchemy.orm import Session

from ....core.database import get_db_session
from ....core.security import get_current_user
from ....core.dependencies import require_admin, require_teacher_or_student
from ....core.exceptions import NotFoundError, ConflictError, ValidationError
from ....core.config import settings
from ....schemas.user import UserResponse, UserWithProfileResponse, UserUpdate, UserProfileUpdate, UserProfileResponse, UserCreateRequest, UserUpdateRequest
from ....schemas.common import ResponseWrapper
from ....services.user_service import UserService

router = APIRouter()


def _serialize_profile(profile):
    if profile is None:
        return None
    return jsonable_encoder(UserProfileResponse.model_validate(profile, from_attributes=True))


@router.get("/me", response_model=ResponseWrapper)
async def get_current_user_info(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db_session)
):
    """
    Get current user information
    """
    user = UserService.get_user_by_id(db, current_user["user_id"])
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": {"code": "NOT_FOUND", "message": "User not found"}}
        )
    
    return ResponseWrapper(
        success=True,
        message="User retrieved successfully",
        data=UserWithProfileResponse(
            id=user.id,
            email=user.email,
            role_id=user.role_id,
            department_id=user.department_id,
            is_active=user.is_active,
            is_verified=user.is_verified,
            last_login_at=user.last_login_at,
            created_at=user.created_at,
            updated_at=user.updated_at,
            role=user.role if user.role else None,
            department_name=user.department.name if user.department else None,
            profile=user.profile
        )
    )


@router.post("/profile/upload-picture", response_model=ResponseWrapper)
async def upload_profile_picture(
    file: UploadFile = File(...),
    db: Session = Depends(get_db_session),
    current_user: dict = Depends(get_current_user),
):
    user_id = current_user["user_id"]
    user = UserService.get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail={"error": {"code": "NOT_FOUND", "message": "User not found"}})

    avatar_dir = os.path.join(settings.UPLOAD_DIR, "avatars")
    os.makedirs(avatar_dir, exist_ok=True)

    ext = os.path.splitext(file.filename)[1] if file.filename else ".jpg"
    filename = f"user_{user_id}{ext}"
    filepath = os.path.join(avatar_dir, filename)

    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    profile_picture_url = f"/uploads/avatars/{filename}"
    if user.profile:
        user.profile.profile_picture_url = profile_picture_url
        db.commit()

    return ResponseWrapper(
        success=True,
        message="Profile picture uploaded",
        data={"profile_picture_url": profile_picture_url}
    )


@router.get("/", response_model=ResponseWrapper)
async def get_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    role: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    db: Session = Depends(get_db_session),
    current_user: dict = Depends(require_admin)
):
    """
    Get list of users (Admin only)
    """
    users, total = UserService.get_users(
        db,
        skip=skip,
        limit=limit,
        search=search,
        role=role,
        is_active=is_active
    )
    
    user_responses = []
    for user in users:
        user_responses.append(UserWithProfileResponse(
            id=user.id,
            email=user.email,
            role_id=user.role_id,
            department_id=user.department_id,
            is_active=user.is_active,
            is_verified=user.is_verified,
            last_login_at=user.last_login_at,
            created_at=user.created_at,
            updated_at=user.updated_at,
            role=user.role if user.role else None,
            department_name=user.department.name if user.department else None,
            profile=user.profile
        ))
    
    return ResponseWrapper(
        success=True,
        message="Users retrieved successfully",
        data={
            "users": user_responses,
            "total": total,
            "skip": skip,
            "limit": limit
        }
    )


@router.post("/", response_model=ResponseWrapper, status_code=status.HTTP_201_CREATED)
async def create_user(
    user_data: UserCreateRequest,
    db: Session = Depends(get_db_session),
    current_user: dict = Depends(require_admin)
):
    """
    Create a new user (Admin only)
    """
    from ....schemas.user import UserCreate, UserProfileCreate

    try:
        user_create = UserCreate(
            email=user_data.email,
            password=user_data.password,
            role=user_data.role,
            department_id=user_data.department_id,
            is_active=user_data.is_active if user_data.is_active is not None else True,
            is_verified=user_data.is_verified if user_data.is_verified is not None else False,
        )

        profile_create = None
        if user_data.first_name or user_data.last_name:
            profile_create = UserProfileCreate(
                user_id=0,
                first_name=user_data.first_name or "",
                last_name=user_data.last_name or "",
                phone=user_data.phone,
            )

        role_extra = {}
        if user_data.student_number:
            role_extra["student_number"] = user_data.student_number
        if user_data.employee_number:
            role_extra["employee_number"] = user_data.employee_number
        if user_data.specialization:
            role_extra["specialization"] = user_data.specialization

        user = UserService.create_user(
            db,
            user_data=user_create,
            profile_data=profile_create,
            role_extra=role_extra if role_extra else None
        )

        return ResponseWrapper(
            success=True,
            message="User created successfully",
            data=UserWithProfileResponse(
                id=user.id,
                email=user.email,
                role_id=user.role_id,
                department_id=user.department_id,
                is_active=user.is_active,
                is_verified=user.is_verified,
                last_login_at=user.last_login_at,
                created_at=user.created_at,
                updated_at=user.updated_at,
                role=user.role if user.role else None,
                department_name=user.department.name if user.department else None,
                profile=user.profile
            )
        )
    except ConflictError as e:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(e)
        )
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except NotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create user: {str(e)}"
        )


@router.get("/students", response_model=ResponseWrapper)
async def get_students(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=200),
    search: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    course_id: Optional[int] = Query(None),
    db: Session = Depends(get_db_session),
    current_user: dict = Depends(require_admin)
):
    """
    Get list of students (Admin only)
    """
    results, total = UserService.get_students(db, skip=skip, limit=limit, search=search, is_active=is_active)

    student_responses = []
    for student, user, profile in results:
        student_responses.append({
            "id": user.id,
            "email": user.email,
            "role_id": user.role_id,
            "department_id": user.department_id,
            "is_active": user.is_active,
            "is_verified": user.is_verified,
            "last_login_at": user.last_login_at,
            "created_at": user.created_at,
            "updated_at": user.updated_at,
            "role_name": user.role if user.role else None,
            "department_name": user.department.name if user.department else None,
            "profile": _serialize_profile(profile),
            "student_record": {
                "id": student.id,
                "student_number": student.student_number,
                "enrollment_year": student.enrollment_year,
                "gpa": student.gpa,
                "academic_status": student.academic_status,
            },
        })

    return ResponseWrapper(
        success=True,
        message="Students retrieved successfully",
        data={
            "users": student_responses,
            "total": total,
            "skip": skip,
            "limit": limit,
        }
    )


@router.get("/teachers", response_model=ResponseWrapper)
async def get_teachers(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    department_id: Optional[int] = Query(None),
    db: Session = Depends(get_db_session),
    current_user: dict = Depends(require_admin)
):
    """
    Get list of teachers (Admin only)
    """
    results, total = UserService.get_teachers(db, skip=skip, limit=limit, search=search, is_active=is_active, department_id=department_id)

    teacher_responses = []
    for teacher, user, profile in results:
        teacher_responses.append({
            "id": user.id,
            "email": user.email,
            "role_id": user.role_id,
            "department_id": user.department_id,
            "is_active": user.is_active,
            "is_verified": user.is_verified,
            "last_login_at": user.last_login_at,
            "created_at": user.created_at,
            "updated_at": user.updated_at,
            "role_name": user.role if user.role else None,
            "department_name": user.department.name if user.department else None,
            "profile": _serialize_profile(profile),
            "teacher_record": {
                "id": teacher.id,
                "employee_number": teacher.employee_number,
                "hire_date": str(teacher.hire_date) if teacher.hire_date else None,
                "specialization": teacher.specialization,
                "employment_type": teacher.employment_type,
            },
        })

    return ResponseWrapper(
        success=True,
        message="Teachers retrieved successfully",
        data={
            "users": teacher_responses,
            "total": total,
            "skip": skip,
            "limit": limit,
        }
    )


@router.get("/admins", response_model=ResponseWrapper)
async def get_admins(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    db: Session = Depends(get_db_session),
    current_user: dict = Depends(require_admin)
):
    """
    Get list of administrators (Admin only)
    """
    results, total = UserService.get_admins(db, skip=skip, limit=limit, search=search, is_active=is_active)

    admin_responses = []
    for admin, user, profile in results:
        admin_responses.append({
            "id": user.id,
            "email": user.email,
            "role_id": user.role_id,
            "department_id": user.department_id,
            "is_active": user.is_active,
            "is_verified": user.is_verified,
            "last_login_at": user.last_login_at,
            "created_at": user.created_at,
            "updated_at": user.updated_at,
            "role_name": user.role if user.role else None,
            "department_name": user.department.name if user.department else None,
            "profile": _serialize_profile(profile),
            "admin_record": {
                "id": admin.id,
                "employee_number": admin.employee_number,
                "admin_level": admin.admin_level,
            },
        })

    return ResponseWrapper(
        success=True,
        message="Administrators retrieved successfully",
        data={
            "users": admin_responses,
            "total": total,
            "skip": skip,
            "limit": limit,
        }
    )


@router.get("/{user_id}", response_model=ResponseWrapper)
async def get_user(
    user_id: int,
    db: Session = Depends(get_db_session),
    current_user: dict = Depends(require_teacher_or_student)
):
    """
    Get user by ID
    """
    # Check permission
    if current_user["role"] != "admin" and current_user["user_id"] != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"error": {"code": "PERMISSION_DENIED", "message": "Access denied"}}
        )
    
    user = UserService.get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": {"code": "NOT_FOUND", "message": "User not found"}}
        )
    
    return ResponseWrapper(
        success=True,
        message="User retrieved successfully",
        data=UserWithProfileResponse(
            id=user.id,
            email=user.email,
            role_id=user.role_id,
            department_id=user.department_id,
            is_active=user.is_active,
            is_verified=user.is_verified,
            last_login_at=user.last_login_at,
            created_at=user.created_at,
            updated_at=user.updated_at,
            role=user.role if user.role else None,
            department_name=user.department.name if user.department else None,
            profile=user.profile
        )
    )


@router.put("/{user_id}", response_model=ResponseWrapper)
async def update_user(
    user_id: int,
    user_data: UserUpdateRequest,
    db: Session = Depends(get_db_session),
    current_user: dict = Depends(require_admin)
):
    """
    Update user (Admin only)
    """
    try:
        user_update = UserUpdate(
            email=user_data.email,
            role=user_data.role,
            department_id=user_data.department_id,
            is_active=user_data.is_active,
            is_verified=user_data.is_verified,
        )

        user = UserService.update_user(db, user_id, user_update, user_data.profile)
        
        return ResponseWrapper(
            success=True,
            message="User updated successfully",
            data=UserWithProfileResponse(
                id=user.id,
                email=user.email,
                role_id=user.role_id,
                department_id=user.department_id,
                is_active=user.is_active,
                is_verified=user.is_verified,
                last_login_at=user.last_login_at,
                created_at=user.created_at,
                updated_at=user.updated_at,
                role=user.role if user.role else None,
                department_name=user.department.name if user.department else None,
                profile=user.profile
            )
        )
    except NotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": {"code": "NOT_FOUND", "message": str(e)}}
        )
    except ConflictError as e:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"error": {"code": "CONFLICT", "message": str(e)}}
        )


@router.delete("/{user_id}", response_model=ResponseWrapper)
async def delete_user(
    user_id: int,
    permanent: bool = Query(False),
    db: Session = Depends(get_db_session),
    current_user: dict = Depends(require_admin)
):
    """
    Delete user (Admin only)
    """
    try:
        UserService.delete_user(db, user_id, soft_delete=not permanent)
        
        return ResponseWrapper(
            success=True,
            message="User deleted successfully"
        )
    except NotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": {"code": "NOT_FOUND", "message": str(e)}}
        )
