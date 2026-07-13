from datetime import datetime

from sqlalchemy.orm import Session

from .....models.hrm_models import Employee
from .....models.platform.user import User
from ...http_common import tenant_id_str
from ..shared import employee_to_model, get_or_create_employee
from .schemas import EmployeeProfileUpdate


def get_my_profile(db: Session, current_user: User, tenant_context: dict) -> Employee:
    tenant_id = tenant_id_str(tenant_context)
    employee = get_or_create_employee(db, current_user, tenant_id)
    return employee_to_model(employee, db)


def update_my_profile(
    body: EmployeeProfileUpdate,
    db: Session,
    current_user: User,
    tenant_context: dict,
) -> Employee:
    tenant_id = tenant_id_str(tenant_context)
    employee = get_or_create_employee(db, current_user, tenant_id)
    data = body.model_dump(exclude_unset=True)
    for k, v in data.items():
        if hasattr(employee, k):
            setattr(employee, k, v)
    employee.updatedAt = datetime.utcnow()
    db.commit()
    db.refresh(employee)
    return employee_to_model(employee, db)
