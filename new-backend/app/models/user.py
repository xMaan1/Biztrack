from uuid import UUID

from sqlalchemy import Column, String
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import Field, select

from app.models.entity import Entity


class User(Entity, table=True):
    __tablename__ = "users"

    username: str = Field(sa_column=Column("user_name", String(255), nullable=False, index=True))
    email: str = Field(sa_column=Column(String(255), nullable=False, unique=True, index=True))
    first_name: str | None = Field(default=None, sa_column=Column(String(255), nullable=True))
    last_name: str | None = Field(default=None, sa_column=Column(String(255), nullable=True))
    password_hash: str = Field(sa_column=Column("hashed_password", String(255), nullable=False))
    is_active: bool = Field(default=True)

    @classmethod
    async def by_email(cls, session: AsyncSession, email: str) -> "User | None":
        result = await session.exec(select(cls).where(cls.email == email))
        return result.first()

    @classmethod
    async def by_username(cls, session: AsyncSession, username: str) -> "User | None":
        result = await session.exec(select(cls).where(cls.username == username))
        return result.first()

    @classmethod
    async def get(cls, session: AsyncSession, user_id: UUID) -> "User | None":
        result = await session.exec(select(cls).where(cls.id == user_id))
        return result.first()

    @classmethod
    async def create(
        cls,
        session: AsyncSession,
        *,
        username: str,
        email: str,
        password_hash: str,
        first_name: str | None,
        last_name: str | None,
    ) -> "User":
        user = cls(
            username=username,
            email=email,
            password_hash=password_hash,
            first_name=first_name,
            last_name=last_name,
        )
        session.add(user)
        await session.commit()
        await session.refresh(user)
        return user