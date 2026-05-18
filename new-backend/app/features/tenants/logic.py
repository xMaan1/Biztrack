from fastapi import HTTPException, Request, status
from sqlmodel.ext.asyncio.session import AsyncSession

from app.features.auth.logic import get_current_user
from app.features.tenants.constants import PLAN_TYPES
from app.features.tenants.schemas import CreateTenantRequest, TenantSummary
from app.models.tenant import Tenant, TenantMember


async def create_tenant_for_user(
    session: AsyncSession,
    request: Request,
    payload: CreateTenantRequest,
) -> TenantSummary:
    if payload.plan_type.value not in PLAN_TYPES:
        raise HTTPException(status_code=400, detail="Invalid plan type")

    user = await get_current_user(session, request.session)

    existing = await TenantMember.for_user(session, user.id)
    if existing:
        raise HTTPException(status_code=400, detail="Tenant already exists for this user")

    name = payload.name.strip()
    if await Tenant.by_name(session, name):
        raise HTTPException(status_code=400, detail="Tenant name already taken")

    tenant = await Tenant.create(session, name=name, plan_type=payload.plan_type.value)
    await TenantMember.create(session, tenant_id=tenant.id, user_id=user.id, role="owner")

    request.session["tenant_id"] = str(tenant.id)

    return TenantSummary(
        id=str(tenant.id),
        name=tenant.name,
        plan_type=payload.plan_type,
    )
