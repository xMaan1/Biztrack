from typing import Optional, List
from uuid import UUID

from sqlalchemy.orm import Session
from sqlalchemy import and_

from ...models.healthcare_models import HealthcareStaff as HealthcareStaffPydantic
from ...models.common import ModulePermission
from ...config.core_models import User as UserModel, Role as RoleModel

HEALTHCARE_PERMISSION_SET = {
    ModulePermission.HEALTHCARE_VIEW.value,
    ModulePermission.HEALTHCARE_CREATE.value,
    ModulePermission.HEALTHCARE_UPDATE.value,
    ModulePermission.HEALTHCARE_DELETE.value,
}


def normalize_healthcare_permissions(perms: Optional[List[str]]) -> List[str]:
    items = [p for p in (perms or []) if isinstance(p, str)]
    filtered = [p for p in items if p in HEALTHCARE_PERMISSION_SET]
    deduped = list(dict.fromkeys(filtered))
    if not deduped:
        deduped = [ModulePermission.HEALTHCARE_VIEW.value]
    return deduped


def merge_healthcare_permissions(existing: Optional[List[str]], healthcare_perms: List[str]) -> List[str]:
    base = [p for p in (existing or []) if isinstance(p, str) and not p.startswith("healthcare:")]
    merged = base + healthcare_perms
    return list(dict.fromkeys(merged))


def ensure_healthcare_staff_role(db: Session, tenant_id: str) -> RoleModel:
    tid = UUID(tenant_id) if isinstance(tenant_id, str) else tenant_id
    role = db.query(RoleModel).filter(
        and_(
            RoleModel.tenant_id == tid,
            RoleModel.name == "healthcare_staff",
            RoleModel.isActive == True,
        )
    ).first()
    if role:
        return role
    role = RoleModel(
        tenant_id=tid,
        name="healthcare_staff",
        display_name="Healthcare Staff",
        description="Healthcare module staff",
        permissions=[],
        isActive=True,
    )
    db.add(role)
    db.commit()
    db.refresh(role)
    return role


def db_staff_to_pydantic(db_staff, db_user: UserModel, tenant_id: str, permissions: List[str]) -> HealthcareStaffPydantic:
    return HealthcareStaffPydantic(
        id=str(db_staff.id),
        tenant_id=str(db_staff.tenant_id),
        user_id=str(db_staff.user_id),
        username=db_user.userName,
        email=db_user.email,
        first_name=db_user.firstName,
        last_name=db_user.lastName,
        phone=db_staff.phone,
        role=db_staff.role,
        permissions=permissions,
        is_active=db_staff.is_active if hasattr(db_staff, "is_active") else True,
        createdAt=db_staff.createdAt,
        updatedAt=db_staff.updatedAt,
    )
