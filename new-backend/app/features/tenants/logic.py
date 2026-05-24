from fastapi import HTTPException, Request, status
from sqlmodel.ext.asyncio.session import AsyncSession

from app.features.auth.logic import get_current_user
from app.features.tenants.constants import PLAN_TYPES
from app.features.tenants.schemas import CreateTenantRequest, TenantSummary
from app.repositories import tenant as tenant_repo


async def create_tenant_for_user(
    session: AsyncSession,
    request: Request,
    payload: CreateTenantRequest,
) -> TenantSummary:
    if payload.plan_type.value not in PLAN_TYPES:
        raise HTTPException(status_code=400, detail="Invalid plan type")

    user = await get_current_user(session, request.session)

    existing = await tenant_repo.get_member_for_user(session, user.id)
    if existing:
        raise HTTPException(status_code=400, detail="Tenant already exists for this user")

    name = payload.name.strip()
    if await tenant_repo.get_by_name(session, name):
        raise HTTPException(status_code=400, detail="Tenant name already taken")

    tenant = await tenant_repo.create_tenant(
        session, name=name, plan_type=payload.plan_type.value
    )
    await tenant_repo.create_tenant_member(
        session, tenant_id=tenant.id, user_id=user.id, role="owner"
    )

    request.session["tenant_id"] = str(tenant.id)

    return TenantSummary(
        id=str(tenant.id),
        name=tenant.name,
        plan_type=payload.plan_type,
    )
