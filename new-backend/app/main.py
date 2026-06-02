from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware

from app.api.routes import api_router
from app.config import settings
from app.logging_config import configure_logging

configure_logging(settings.log_level)

app = FastAPI(title="Biztrack API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(
    SessionMiddleware,
    secret_key=settings.session_secret_key,
    max_age=settings.session_max_age,
    same_site="lax",
    https_only=settings.app_env == "production",
)

app.include_router(api_router, prefix="/api")
