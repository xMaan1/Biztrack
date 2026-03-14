from typing import Optional, List

from sqlalchemy.orm import Session

from ...config.database import get_healthcare_staff, get_healthcare_staff_count
from ...config.core_models import User as UserModel
from ...models.healthcare_models import HealthcareStaffResponse, HealthcareStaff as HealthcareStaffPydantic
from ...services.rbac_service import RBACService
from ..mappers import db_staff_to_pydantic


def list_healthcare_staff_handler(
    tenant_id: str,
    db: Session,
    search: Optional[str] = None,
    is_active: Optional[bool] = None,
    page: int = 1,
    limit: int = 20,
) -> HealthcareStaffResponse:
    skip = (page - 1) * limit
    db_staff = get_healthcare_staff(
        db, tenant_id, skip=skip, limit=limit, search=search, is_active=is_active
    )
    total = get_healthcare_staff_count(db, tenant_id, search=search, is_active=is_active)
    out: List[HealthcareStaffPydantic] = []
    for s in db_staff:
        u = db.query(UserModel).filter(UserModel.id == s.user_id).first()
        if not u:
            continue
        perms = RBACService.get_user_permissions(db, str(u.id), tenant_id)
        healthcare_perms = [p for p in perms if p.startswith("healthcare:")]
        out.append(db_staff_to_pydantic(s, u, tenant_id, healthcare_perms))
    return HealthcareStaffResponse(staff=out, total=total)
