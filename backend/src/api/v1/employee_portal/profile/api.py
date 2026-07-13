from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from .....api.dependencies import get_current_user, get_tenant_context
from .....config.database import get_db
from .....models.hrm_models import Employee
from .....models.platform.user import User
from . import logic
from .schemas import EmployeeProfileUpdate

router = APIRouter()


@router.get("/me", response_model=Employee)
async def get_my_employee_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
):
    return logic.get_my_profile(db, current_user, tenant_context)


@router.put("/me", response_model=Employee)
async def update_my_employee_profile(
    body: EmployeeProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
):
    return logic.update_my_profile(body, db, current_user, tenant_context)
