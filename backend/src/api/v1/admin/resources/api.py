from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from .....config.database import get_db
from .....api.dependencies import get_current_user
from . import logic

router = APIRouter()


@router.get("/tenants/{tenant_id}/invoices/{invoice_id}")
async def get_tenant_invoice_details(
    tenant_id: str,
    invoice_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return await logic.get_tenant_invoice_details(tenant_id, invoice_id, db, current_user)


@router.delete("/tenants/{tenant_id}/users/{user_id}")
async def delete_tenant_user(
    tenant_id: str,
    user_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return await logic.delete_tenant_user(tenant_id, user_id, db, current_user)


@router.delete("/tenants/{tenant_id}/invoices/{invoice_id}")
async def delete_tenant_invoice(
    tenant_id: str,
    invoice_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return await logic.delete_tenant_invoice(tenant_id, invoice_id, db, current_user)


@router.delete("/tenants/{tenant_id}/projects/{project_id}")
async def delete_tenant_project(
    tenant_id: str,
    project_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return await logic.delete_tenant_project(tenant_id, project_id, db, current_user)


@router.delete("/tenants/{tenant_id}/customers/{customer_id}")
async def delete_tenant_customer(
    tenant_id: str,
    customer_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return await logic.delete_tenant_customer(tenant_id, customer_id, db, current_user)
