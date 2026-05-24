from uuid import UUID

from sqlalchemy import Column, ForeignKey, String, UniqueConstraint
from sqlmodel import Field

from app.models.entity import Entity


class Tenant(Entity, table=True):
    __tablename__ = "tenants"

    name: str = Field(sa_column=Column(String(255), nullable=False, index=True))
    plan_type: str = Field(sa_column=Column(String(32), nullable=False, index=True))
    is_active: bool = Field(default=True)


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
