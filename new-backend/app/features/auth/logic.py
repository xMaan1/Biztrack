from uuid import UUID

import bcrypt
from fastapi import HTTPException, Request, status
from sqlmodel.ext.asyncio.session import AsyncSession

from app.features.auth.schemas import LoginRequest, MeResponse, RegisterRequest
from app.models.tenant import Tenant
from app.models.user import User
from app.repositories import tenant as tenant_repo
from app.repositories import user as user_repo


def normalize_email(value: str) -> str:
    return value.strip().lower()


def _password_bytes(password: str) -> bytes:
    return password.encode("utf-8")[:72]


def hash_password(password: str) -> str:
    return bcrypt.hashpw(_password_bytes(password), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain_password: str, password_hash: str) -> bool:
    try:
        return bcrypt.checkpw(
            _password_bytes(plain_password),
            password_hash.encode("utf-8"),
        )
    except ValueError:
        return False


def parse_user_id(value: object) -> UUID | None:
    if value is None:
        return None
    try:
        return UUID(str(value))
    except ValueError:
        return None


def parse_tenant_id(value: object) -> UUID | None:
    return parse_user_id(value)


async def authenticate_user(
    session: AsyncSession,
    username: str,
    password: str,
) -> User | None:
    normalized = normalize_email(username)
    user = await user_repo.get_by_email(session, normalized)
    if not user:
        user = await user_repo.get_by_username(session, normalized)
    if not user or not user.is_active:
        return None
    if not verify_password(password, user.password_hash):
        return None
    return user


async def get_current_user(session: AsyncSession, request_session: dict) -> User:
    user_id = parse_user_id(request_session.get("user_id"))
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")

    user = await user_repo.get_user(session, user_id)
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid session")
    return user


def sign_in_user(request: Request, user: User) -> None:
    request.session.clear()
    request.session["user_id"] = str(user.id)


async def login_with_password(
    session: AsyncSession,
    request: Request,
    payload: LoginRequest,
) -> None:
    user = await authenticate_user(session, payload.username, payload.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
        )
    sign_in_user(request, user)
    member = await tenant_repo.get_member_for_user(session, user.id)
    if member:
        request.session["tenant_id"] = str(member.tenant_id)


async def _resolve_tenant(
    session: AsyncSession,
    request_session: dict,
    user: User,
) -> Tenant | None:
    tenant_id = parse_tenant_id(request_session.get("tenant_id"))
    if tenant_id:
        tenant = await tenant_repo.get_tenant(session, tenant_id)
        if tenant and tenant.is_active:
            member = await tenant_repo.get_member_for_user(session, user.id)
            if member and member.tenant_id == tenant.id:
                return tenant

    member = await tenant_repo.get_member_for_user(session, user.id)
    if not member:
        return None

    tenant = await tenant_repo.get_tenant(session, member.tenant_id)
    if tenant and tenant.is_active:
        request_session["tenant_id"] = str(tenant.id)
        return tenant
    return None


async def build_me_response(session: AsyncSession, request_session: dict) -> MeResponse:
    user = await get_current_user(session, request_session)
    tenant = await _resolve_tenant(session, request_session, user)

    if not tenant:
        return MeResponse(
            username=user.username,
            email=user.email,
            first_name=user.first_name,
            last_name=user.last_name,
            needs_tenant_setup=True,
        )

    return MeResponse(
        username=user.username,
        email=user.email,
        first_name=user.first_name,
        last_name=user.last_name,
        needs_tenant_setup=False,
        tenant_id=str(tenant.id),
        tenant_name=tenant.name,
        plan_type=tenant.plan_type,
    )


async def register_user(session: AsyncSession, payload: RegisterRequest) -> User:
    email = normalize_email(payload.email)
    username = payload.username.strip()

    if await user_repo.get_by_email(session, email):
        raise HTTPException(status_code=400, detail="Email already registered")
    if await user_repo.get_by_username(session, username):
        raise HTTPException(status_code=400, detail="Username already taken")

    return await user_repo.create_user(
        session,
        username=username,
        email=email,
        password_hash=hash_password(payload.password),
        first_name=payload.first_name,
        last_name=payload.last_name,
    )
