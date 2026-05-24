from typing import Annotated

from fastapi import APIRouter, Depends, Request
from sqlmodel.ext.asyncio.session import AsyncSession

from app.db import get_db
from app.features.auth.dependencies import session_required
from app.features.auth.logic import (
    build_me_response,
    login_with_password,
    register_user,
    sign_in_user,
)
from app.features.auth.schemas import LoginRequest, MeResponse, RegisterRequest

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login")
async def app_login(
    payload: LoginRequest,
    request: Request,
    session: Annotated[AsyncSession, Depends(get_db)],
) -> dict[str, bool]:
    await login_with_password(session, request, payload)
    return {"ok": True}


@router.post("/register")
async def app_register(
    payload: RegisterRequest,
    request: Request,
    session: Annotated[AsyncSession, Depends(get_db)],
) -> dict[str, bool]:
    user = await register_user(session, payload)
    sign_in_user(request, user)
    return {"ok": True}


@router.post("/logout")
async def app_logout(request: Request) -> dict[str, bool]:
    request.session.clear()
    return {"ok": True}


@router.get("/me")
async def auth_me(
    request: Request,
    session: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[str, Depends(session_required)],
) -> MeResponse:
    return await build_me_response(session, request.session)
