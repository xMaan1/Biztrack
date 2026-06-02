from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional

from .....config.database import get_db
from .....api.dependencies import get_current_user, get_tenant_context, require_permission
from .....models.common import ModulePermission
from .schemas import Lead, LeadCreate, LeadUpdate, CRMLeadsResponse
from ..contacts.schemas import ContactCreate
from . import logic

router = APIRouter()


@router.get("/leads", response_model=CRMLeadsResponse)
async def get_crm_leads(
    status: Optional[str] = Query(None),
    source: Optional[str] = Query(None),
    assigned_to: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=1000),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.CRM_VIEW.value)),
):
    return logic.get_crm_leads(db, current_user, tenant_context, status, source, assigned_to, search, page, limit)


@router.post("/leads", response_model=Lead)
async def create_crm_lead(
    lead_data: LeadCreate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.CRM_CREATE.value)),
):
    return logic.create_crm_lead(lead_data, current_user, db, tenant_context)


@router.get("/leads/{lead_id}", response_model=Lead)
async def get_crm_lead(
    lead_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.CRM_VIEW.value)),
):
    return logic.get_crm_lead(lead_id, db, current_user, tenant_context)


@router.put("/leads/{lead_id}", response_model=Lead)
async def update_crm_lead(
    lead_id: str,
    lead_data: LeadUpdate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.CRM_UPDATE.value)),
):
    return logic.update_crm_lead(lead_id, lead_data, current_user, db, tenant_context)


@router.delete("/leads/{lead_id}")
async def delete_crm_lead(
    lead_id: str,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.CRM_DELETE.value)),
):
    return logic.delete_crm_lead(lead_id, current_user, db, tenant_context)


@router.post("/leads/{lead_id}/convert")
async def convert_lead_to_contact(
    lead_id: str,
    contact_data: ContactCreate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.CRM_CREATE.value)),
):
    return logic.convert_lead_to_contact(lead_id, contact_data, current_user, db, tenant_context)
