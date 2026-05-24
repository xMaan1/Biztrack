from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.models.tenant import Tenant, TenantMember


async def get_by_name(session: AsyncSession, name: str) -> Tenant | None:
    result = await session.exec(select(Tenant).where(Tenant.name == name))
    return result.first()


async def get_tenant(session: AsyncSession, tenant_id: UUID) -> Tenant | None:
    result = await session.exec(select(Tenant).where(Tenant.id == tenant_id))
    return result.first()


async def create_tenant(
    session: AsyncSession,
    *,
    name: str,
    plan_type: str,
) -> Tenant:
    tenant = Tenant(name=name.strip(), plan_type=plan_type)
    session.add(tenant)
    await session.commit()
    await session.refresh(tenant)
    return tenant


async def get_member_for_user(session: AsyncSession, user_id: UUID) -> TenantMember | None:
    result = await session.exec(select(TenantMember).where(TenantMember.user_id == user_id))
    return result.first()


async def create_tenant_member(
    session: AsyncSession,
    *,
    tenant_id: UUID,
    user_id: UUID,
    role: str = "owner",
) -> TenantMember:
    member = TenantMember(tenant_id=tenant_id, user_id=user_id, role=role)
    session.add(member)
    await session.commit()
    await session.refresh(member)
    return member
