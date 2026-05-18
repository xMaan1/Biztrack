from typing import Annotated

from fastapi import APIRouter, Depends, Request
from sqlmodel.ext.asyncio.session import AsyncSession

from app.db import get_db
from app.features.auth.dependencies import session_required
from app.features.tenants.logic import create_tenant_for_user
from app.features.tenants.schemas import CreateTenantRequest, TenantSummary

router = APIRouter(prefix="/tenants", tags=["tenants"])


@router.post("/setup")
async def setup_tenant(
    payload: CreateTenantRequest,
    request: Request,
    session: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[str, Depends(session_required)],
) -> dict[str, bool | TenantSummary]:
    tenant = await create_tenant_for_user(session, request, payload)
    return {"ok": True, "tenant": tenant}
