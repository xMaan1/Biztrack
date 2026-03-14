from uuid import UUID
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import and_

from ...config.database import (
    get_user_by_email,
    create_user,
    get_healthcare_staff_by_id,
    create_healthcare_staff,
    update_healthcare_staff,
)
from ...config.core_models import User as UserModel, TenantUser as TenantUserModel
from ...models.healthcare_models import HealthcareStaffCreate, HealthcareStaffUpdate
from ...services.rbac_service import RBACService
from ...core.auth import get_password_hash
from ..mappers import (
    db_staff_to_pydantic,
    normalize_healthcare_permissions,
    merge_healthcare_permissions,
    ensure_healthcare_staff_role,
)


def create_healthcare_staff_handler(tenant_id: str, body: HealthcareStaffCreate, db: Session, current_user_id: str):
    existing = get_user_by_email(body.email, db)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email already exists",
        )
    if not RBACService.validate_username_uniqueness(db, body.username, tenant_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken in this tenant",
        )
    role = ensure_healthcare_staff_role(db, tenant_id)
    healthcare_perms = normalize_healthcare_permissions(body.permissions)
    user_dict = {
        "tenant_id": UUID(tenant_id),
        "userName": body.username,
        "email": body.email,
        "firstName": body.first_name,
        "lastName": body.last_name,
        "hashedPassword": get_password_hash(body.password),
        "isActive": True,
    }
    db_user = create_user(user_dict, db)
    tenant_user = TenantUserModel(
        tenant_id=UUID(tenant_id),
        userId=UUID(str(db_user.id)),
        role_id=UUID(str(role.id)),
        role=role.name,
        custom_permissions=healthcare_perms,
        isActive=True,
        invitedBy=UUID(str(current_user_id)),
    )
    db.add(tenant_user)
    db.commit()
    db.refresh(tenant_user)
    staff_dict = {
        "tenant_id": UUID(tenant_id),
        "user_id": UUID(str(db_user.id)),
        "phone": body.phone,
        "role": body.role,
        "is_active": True,
    }
    db_staff = create_healthcare_staff(staff_dict, db)
    return db_staff_to_pydantic(db_staff, db_user, tenant_id, healthcare_perms)


def update_healthcare_staff_handler(
    tenant_id: str, staff_id: str, body: HealthcareStaffUpdate, db: Session
):
    db_staff = get_healthcare_staff_by_id(staff_id, db, tenant_id)
    if not db_staff:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Staff not found")
    db_user = db.query(UserModel).filter(UserModel.id == db_staff.user_id).first()
    if not db_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    if body.email is not None and body.email != db_user.email:
        if get_user_by_email(body.email, db):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered",
            )
        db_user.email = body.email
    if body.username is not None and body.username != db_user.userName:
        if not RBACService.validate_username_uniqueness(
            db, body.username, tenant_id, exclude_user_id=str(db_user.id)
        ):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already taken in this tenant",
            )
        db_user.userName = body.username
    if body.first_name is not None:
        db_user.firstName = body.first_name
    if body.last_name is not None:
        db_user.lastName = body.last_name
    if body.password is not None and body.password.strip():
        db_user.hashedPassword = get_password_hash(body.password)
    staff_update = {}
    if body.phone is not None:
        staff_update["phone"] = body.phone
    if body.role is not None:
        staff_update["role"] = body.role
    if body.is_active is not None:
        staff_update["is_active"] = body.is_active
    if staff_update:
        db_staff = update_healthcare_staff(staff_id, staff_update, db, tenant_id)
    if body.permissions is not None:
        healthcare_perms = normalize_healthcare_permissions(body.permissions)
        tenant_user = (
            db.query(TenantUserModel)
            .filter(
                and_(
                    TenantUserModel.tenant_id == tenant_id,
                    TenantUserModel.userId == db_user.id,
                    TenantUserModel.isActive == True,
                )
            )
            .first()
        )
        if tenant_user:
            tenant_user.custom_permissions = merge_healthcare_permissions(
                tenant_user.custom_permissions, healthcare_perms
            )
            db.commit()
        perms = RBACService.get_user_permissions(db, str(db_user.id), tenant_id)
        effective = [p for p in perms if p.startswith("healthcare:")]
        return db_staff_to_pydantic(db_staff, db_user, tenant_id, effective)
    perms = RBACService.get_user_permissions(db, str(db_user.id), tenant_id)
    effective = [p for p in perms if p.startswith("healthcare:")]
    db.commit()
    db.refresh(db_user)
    return db_staff_to_pydantic(db_staff, db_user, tenant_id, effective)


def delete_healthcare_staff_handler(tenant_id: str, staff_id: str, db: Session) -> None:
    db_staff = get_healthcare_staff_by_id(staff_id, db, tenant_id)
    if not db_staff:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Staff not found")
    db_staff.is_active = False
    tenant_user = (
        db.query(TenantUserModel)
        .filter(
            and_(
                TenantUserModel.tenant_id == tenant_id,
                TenantUserModel.userId == db_staff.user_id,
                TenantUserModel.isActive == True,
            )
        )
        .first()
    )
    if tenant_user:
        tenant_user.custom_permissions = merge_healthcare_permissions(
            tenant_user.custom_permissions, []
        )
    db.commit()
