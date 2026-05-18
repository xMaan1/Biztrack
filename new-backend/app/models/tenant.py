from uuid import UUID

from sqlalchemy import Column, ForeignKey, String, UniqueConstraint
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import Field, select

from app.models.entity import Entity


class Tenant(Entity, table=True):
    __tablename__ = "tenants"

    name: str = Field(sa_column=Column(String(255), nullable=False, index=True))
    plan_type: str = Field(sa_column=Column(String(32), nullable=False, index=True))
    is_active: bool = Field(default=True)

    @classmethod
    async def by_name(cls, session: AsyncSession, name: str) -> "Tenant | None":
        result = await session.exec(select(cls).where(cls.name == name))
        return result.first()

    @classmethod
    async def get(cls, session: AsyncSession, tenant_id: UUID) -> "Tenant | None":
        result = await session.exec(select(cls).where(cls.id == tenant_id))
        return result.first()

    @classmethod
    async def create(
        cls,
        session: AsyncSession,
        *,
        name: str,
        plan_type: str,
    ) -> "Tenant":
        tenant = cls(name=name.strip(), plan_type=plan_type)
        session.add(tenant)
        await session.commit()
        await session.refresh(tenant)
        return tenant


class TenantMember(Entity, table=True):
    __tablename__ = "tenant_members"
    __table_args__ = (UniqueConstraint("tenant_id", "user_id", name="uq_tenant_member"),)

    tenant_id: UUID = Field(
        sa_column=Column(ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    )
    user_id: UUID = Field(
        sa_column=Column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    )
    role: str = Field(default="owner", sa_column=Column(String(32), nullable=False))

    @classmethod
    async def for_user(cls, session: AsyncSession, user_id: UUID) -> "TenantMember | None":
        result = await session.exec(select(cls).where(cls.user_id == user_id))
        return result.first()

    @classmethod
    async def create(
        cls,
        session: AsyncSession,
        *,
        tenant_id: UUID,
        user_id: UUID,
        role: str = "owner",
    ) -> "TenantMember":
        member = cls(tenant_id=tenant_id, user_id=user_id, role=role)
        session.add(member)
        await session.commit()
        await session.refresh(member)
        return member
