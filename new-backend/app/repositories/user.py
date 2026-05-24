from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.models.user import User


async def get_by_email(session: AsyncSession, email: str) -> User | None:
    result = await session.exec(select(User).where(User.email == email))
    return result.first()


async def get_by_username(session: AsyncSession, username: str) -> User | None:
    result = await session.exec(select(User).where(User.username == username))
    return result.first()


async def get_user(session: AsyncSession, user_id: UUID) -> User | None:
    result = await session.exec(select(User).where(User.id == user_id))
    return result.first()


async def create_user(
    session: AsyncSession,
    *,
    username: str,
    email: str,
    password_hash: str,
    first_name: str | None,
    last_name: str | None,
) -> User:
    user = User(
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
